import Command, {flags} from '@oclif/command'
import {Gitlab} from 'gitlab'
import {find} from 'lodash'
import chalk from 'chalk'
import * as fs from 'fs-extra'
import * as path from 'path'
import {configFile} from './constants'

const git = require('simple-git')(process.cwd())

const getGitProjectId = async () => {
  return new Promise<string>((resolve, reject) => {
    return git.silent(true).getRemotes(true, (_: any, remotes: any) => {
      if (remotes?.length) {
        const origin = find(remotes, {name: 'origin'})
        if (origin) {
          const [, namespace] = origin.refs.fetch.match(/.+:(.+).git/)
          resolve(namespace)
        } else {
          reject(new Error('No git repository'))
        }
      }
    })
  })
}

const readGitlabConfig = (command: Command) =>
  fs.readJSON(path.join(command.config.configDir, configFile)).catch(error => {
    if (error.code === 'ENOINT') {
      command.log('Directorio no existe')
    }
  })

export const writeGitlabConfig = async (command: Command, config: object) => {
  await fs.ensureDir(command.config.configDir)
  return fs.writeJSON(path.join(command.config.configDir, configFile), config)
}

export default abstract class extends Command {
  static flags = {
    host: flags.string({
      description: 'Nombre del host de GitLab',
      env: 'GITLAB_HOST',
    }),
    token: flags.string({
      description:
        'Token de acceso de GitLab (https://docs.gitlab.com/12.6/ee/user/profile/personal_access_tokens.html)',
      env: 'GITLAB_TOKEN',
    }),
    debug: flags.boolean({
      default: false,
      description: 'Incluir información de debug',
    }),
  }

  gitlab?: Gitlab

  gitProjectId?: string

  paginationParams = {
    perPage: 100,
    page: 1,
  }

  async init() {
    const {flags} = this.parse()

    const host = flags.host || (await readGitlabConfig(this))?.host
    const token = flags.token || (await readGitlabConfig(this))?.token

    if (!['login', 'logout'].includes(`${this.id}`) && (!host || !token)) {
      this.error(`Sin configuracióbn. Ejecuta ${chalk.bold('$ devops login')}`)
    }

    this.gitlab = new Gitlab({host, token})
    this.gitProjectId = await getGitProjectId()
  }

  async catch(error: any) {
    const status = error.response?.status
    if (status === 404) {
      this.error(`El recurso especificado no existe: ${error.response?.url}`)
    } else {
      this.error(error)
    }
  }

  heading(text: string) {
    return this.log(chalk.underline.bold(`\n${text}\n`))
  }
}
