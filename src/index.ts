import * as commander from 'commander'
import { prompt, Questions, Answers } from 'inquirer'
// import chalk from 'chalk'
import * as spawn from 'cross-spawn'
import { execSync } from 'child_process'

import { version } from '../package.json'

interface Install {
  packageName: string
  packageManager: 'npm' | 'yarn'
  language: 'javascript' | 'typescript'
  includeEslint: boolean
  includePrettier: boolean
  setupPrecommit: boolean
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
      .then(({ bundle, ...rest }: Answers) => {
        if (bundle) {
          if (bundle === 'cra') {
            installCRA(rest as Install)
          }
          if (bundle === 'gatsby') {
            installGatsby(rest as Install)
          }
          if (bundle === 'next') {
            installNext(rest as Install)
          }
        }
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

function installCRA({ packageName, packageManager, language }: Install) {
  return new Promise((resolve, reject) => {
    let command: 'yarn' | 'npx' | null = null
    let args: string[] | null = null

    if (packageManager === 'yarn' && canUseYarn()) {
      command = 'yarn'
      args = ['create', 'react-app', packageName]
    } else if (packageManager && canUseNpx()) {
      command = 'npx'
      args = ['create-react-app', packageName, '--use-npm']
    }

    if (args && language === 'typescript') {
      args = args.concat(['--typescript'])
    }

    if (command && args) {
      const child = spawn(command, args, { stdio: 'inherit' })
      child.on('close', code => {
        if (code !== 0 && args) {
          reject({
            command: `${command} ${args.join(' ')}`,
          })
          return
        }
        resolve()
      })
    } else {
      process.exit(1)
    }
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
