import * as commander from 'commander'
import { prompt, Questions, Answers } from 'inquirer'
import chalk from 'chalk'
import * as spawn from 'cross-spawn'
import { execSync } from 'child_process'
import * as path from 'path'

import { version } from './package.json'

type PackageManagers = 'yarn' | 'npm'
type Bundle = 'cra' | 'gatby' | 'next'
type Language = 'javascript' | 'typescript'

enum Commands {
  yarn = 'yarn',
  npx = 'npx',
  npm = 'nom',
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
                'create-react-project',
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
  includePrettier,
}: Install) {
  return new Promise((resolve, reject) => {
    let command = packageManager === 'yarn' ? Commands.yarn : Commands.npx
    let localCommand = command === 'yarn' ? Commands.yarn : Commands.npm
    let args: string[] = []

    const root = path.resolve(packageName)

    if (bundle === 'cra') {
      installCRA(command, args, language, packageName)
        .then(async () => {
          if (includePrettier) {
            try {
              await installPrettier(localCommand, root)
            } catch (error) {
              console.log('Failed installing prettier')
              console.log(error)
            }

            resolve()
          }
        })
        .catch(error => reject(error))
    }
  })
}

function installPrettier(command: Commands, source: string) {
  return new Promise((resolve, reject) => {
    let args: string[] = []
    if (command === Commands.yarn) {
      args.push('add')
    } else if (command === Commands.npm) {
      args.push('install')
    }

    args.push('-D', 'prettier')

    const child = spawn(command, args, { stdio: 'inherit', cwd: source })
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
  args: string[],
  language: Language,
  packageName: string,
) {
  return new Promise((resolve, reject) => {
    const allArgs = [...args]

    if (command === Commands.yarn) {
      allArgs.push('create', 'react-app', packageName)
    } else if (command === Commands.npx) {
      allArgs.push('create-react-app', packageName, '--use-npm')
    }

    if (language === 'typescript') {
      allArgs.push('--typescript')
    }

    const child = spawn(command, allArgs, { stdio: 'inherit' })
    child.on('close', code => {
      if (code !== 0) {
        reject({
          command: `${command} ${allArgs.join(' ')}`,
        })
        return
      }
      resolve()
    })
  })
}

function installGatsby(options: Install) {
  // TODO
  console.log('Not available yet ', options)
  return
}

function installNext(options: Install) {
  // TODO
  console.log('Not available yet ', options)
  return
}

// function install(dependencies: string[]) {
//   return new Promise((resolve, reject) => {
//     let command: string
//     let args: string[]

//     command = 'npm'
//     args = ['install', '--save', '--save-exact', '--loglevel', 'error'].concat(
//       dependencies,
//     )

//     const child = spawn(command, args, { stdio: 'inherit' })
//     child.on('close', code => {
//       if (code !== 0) {
//         reject({
//           command: `${command} ${args.join(' ')}`,
//         })
//         return
//       }
//       resolve()
//     })
//   })
// }

// function run(useTypescript: boolean) {
//   const allDependencies = ['react', 'react-dom', 'react-scripts']
//   if (useTypescript) {
//     allDependencies.push(
//       '@types/node',
//       '@types/react',
//       '@types/react-dom',
//       '@types/jest',
//       'typescript',
//     )
//   }

//   install(allDependencies)
// }

// run(program.typescript)
