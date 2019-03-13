#!/usr/bin/env node
import * as commander from 'commander'
import { prompt, Questions, Answers } from 'inquirer'
import chalk from 'chalk'
import * as spawn from 'cross-spawn'
import { execSync, SpawnOptions } from 'child_process'
import * as path from 'path'
import * as fs from 'fs-extra'

import { name, version } from './package.json'

type PackageManagers = 'yarn' | 'npm'
type Bundle = 'cra' | 'gatby' | 'next'
type Language = 'javascript' | 'typescript'

enum Commands {
  yarn = 'yarn',
  npx = 'npx',
  npm = 'npm',
}

interface Install {
  packageName: string
  bundle: Bundle
  packageManager: PackageManagers
  language: Language
  includeEslint: boolean
  includePrettier: boolean
  setupPrecommit: boolean
}

if (!canUseNpx() && !canUseYarn()) {
  console.log(
    `You need ${chalk.cyan('Yarn')} or ${chalk.cyan(
      'npx',
    )} in order to run this command`,
  )
  process.exit(1)
}

const questions: Questions = [
  {
    type: 'input',
    name: 'packageName',
    message: 'Package Name',
  },
  {
    type: 'list',
    name: 'bundle',
    message: 'Preferred bundle',
    choices: [
      { value: 'cra', name: 'Create React App' },
      { value: 'gatsby', name: 'Gatsby' },
      { value: 'next', name: 'Next' },
    ],
    default: 'cra',
  },
  {
    type: 'list',
    name: 'packageManager',
    message: 'Preferred Package Manager',
    choices: [{ value: 'npm', name: 'npm' }, { value: 'yarn', name: 'Yarn' }],
    default: 'npm',
  },
  {
    type: 'list',
    name: 'language',
    message: 'Language',
    choices: [
      { value: 'javascript', name: 'JavaScript' },
      { value: 'typescript', name: 'TypeScript' },
    ],
    default: 'typescript',
  },
  {
    type: 'confirm',
    name: 'includeEslint',
    message: 'Include eslint?',
    default: true,
  },
  {
    type: 'confirm',
    name: 'includePrettier',
    message: 'Include prettier?',
    default: true,
  },
  {
    type: 'confirm',
    name: 'setupPrecommit',
    message: 'Add precommit format hook?',
    default: true,
  },
]

commander.version(version)
commander
  .command('create')
  .alias('c')
  .description('Create new project')
  .action(() => {
    prompt(questions)
      .then((answers: Answers) => {
        install(answers as Install)
          .then(() => {
            console.log(chalk.green('Success!'))
            console.log(
              `Thanks for using ${chalk.green(
                name,
              )} please consider a donation`,
            )
          })
          .catch(error => {
            console.error(error)
            console.log('Something went wrong :(')
          })
      })
      .catch(error => {
        console.log(error)
      })
  })

commander.parse(process.argv)

function canUseYarn() {
  try {
    execSync('yarnpkg --version', { stdio: 'ignore' })
    return true
  } catch (e) {
    return false
  }
}

function canUseNpx() {
  try {
    execSync('npx --version', { stdio: 'ignore' })
    return true
  } catch (e) {
    return false
  }
}

function install({
  bundle,
  packageManager,
  packageName,
  language,
  includeEslint,
  includePrettier,
  setupPrecommit,
}: Install) {
  return new Promise(async (resolve, reject) => {
    let command = packageManager === 'yarn' ? Commands.yarn : Commands.npx
    let localCommand = command === 'yarn' ? Commands.yarn : Commands.npm
    let args: string[] = []
    let devDependencies: string[] = []

    const root = path.resolve(packageName)

    if (bundle === 'cra') {
      args = installCRA(command, language, packageName)
    }

    if (bundle === 'gatby') {
      args = installGatsby(command, packageName)
      if (language === 'typescript') {
        devDependencies.push('gatsby-plugin-typescript')
      }
    }

    if (bundle === 'next') {
      args = installNext(command, language, packageName)
    }

    try {
      await installDependencies(command, args)
    } catch (error) {
      reject(error)
    }

    if (includeEslint) {
      devDependencies.push('eslint')
    }

    if (includePrettier) {
      devDependencies.push('prettier')
    }

    if (setupPrecommit) {
      const packageJSONPath = root + '/package.json'
      addPrecommitConfiguration(packageJSONPath, language)
      devDependencies.push('husky', 'lint-staged')
    }

    if (devDependencies.length) {
      try {
        let depsArgs: string[] = []
        if (localCommand === Commands.yarn) {
          depsArgs.push('add')
        } else if (localCommand === Commands.npm) {
          depsArgs.push('install')
        }
        depsArgs.push(...devDependencies)
        await installDependencies(localCommand, depsArgs, { cwd: root })
      } catch (error) {
        console.log('Failed installing dependencies')
        console.log(error)
      }
    }
    resolve()
  })
}

function installDependencies(
  command: Commands,
  args: string[],
  options?: SpawnOptions,
) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: 'inherit', ...options })
    child.on('close', code => {
      if (code !== 0) {
        reject({
          command: `${command} ${args.join(' ')}`,
        })
        return
      }
      resolve()
    })
  })
}

function installCRA(
  command: Commands,
  language: Language,
  packageName: string,
): string[] {
  const allArgs = []

  if (command === Commands.yarn) {
    allArgs.push('create', 'react-app', packageName)
  } else if (command === Commands.npx) {
    allArgs.push('create-react-app', packageName, '--use-npm')
  }

  if (language === 'typescript') {
    allArgs.push('--typescript')
  }
  return allArgs
}

function installGatsby(command: Commands, packageName: string): string[] {
  const allArgs = []

  if (command === Commands.yarn) {
    allArgs.push('create', 'react-app', packageName)
  } else if (command === Commands.npx) {
    allArgs.push('gatsby', 'new', packageName)
  }
  return allArgs
}

function installNext(
  command: Commands,
  language: Language,
  packageName: string,
): string[] {
  const allArgs = []

  if (command === Commands.yarn) {
    allArgs.push('create', 'next-app', '--example')
  } else if (command === Commands.npx) {
    allArgs.push('create-next-app', '--example')
  }

  if (language === 'typescript') {
    allArgs.push('with-typescript')
  } else {
    allArgs.push('hello-world')
  }

  allArgs.push(packageName)

  return allArgs
}

function addPrecommitConfiguration(
  packageJSONPath: string,
  language: Language,
) {
  const packageObj = fs.readJSONSync(packageJSONPath)
  let linterFileTypes = 'src/**/*.{js,md,css,json}'
  if (language === 'typescript') {
    linterFileTypes = 'src/**/*.{js,md,css,json,ts,tsx}'
  }
  fs.writeJSONSync(packageJSONPath, {
    ...packageObj,
    husky: {
      hooks: {
        'pre-commit': 'lint-staged',
      },
    },
    'lint-staged': {
      linters: {
        [linterFileTypes]: ['prettier --write', 'git add'],
      },
    },
  })
}
