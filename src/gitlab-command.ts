import Command, {flags} from '@oclif/command'
import {Gitlab} from 'gitlab'
import chalk from 'chalk'
import * as fs from 'fs-extra'
import * as path from 'path'

const CONFIG_FILE = 'gitlab.config.json'

const readGitlabConfig = (command: Command) =>
  fs.readJSON(path.join(command.config.configDir, CONFIG_FILE)).catch(error => {
    if (error.code === 'ENOINT') {
      command.log('Necesario')
    }
  })

export const writeGitlabConfig = async (command: Command, config: object) => {
  await fs.ensureDir(command.config.configDir)
  return fs.writeJSON(path.join(command.config.configDir, CONFIG_FILE), config)
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
  }

  gitlab?: Gitlab

  paginationParams = {
    perPage: 100,
    page: 1,
  }

  async init() {
    const {flags} = this.parse()

    const host = flags.host || (await readGitlabConfig(this))?.host
    const token = flags.token || (await readGitlabConfig(this))?.token

    if (this.id !== 'config' && (!host || !token)) {
      this.error(
        `Necesario cofifgurar credenciales de acceso: ${chalk.bold(
          '$ devops config',
        )}`,
      )
    }

    this.gitlab = new Gitlab({host, token})
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

  // async finally(err) {
  //   // called after run and catch regardless of whether or not the command errored
  // }
}
