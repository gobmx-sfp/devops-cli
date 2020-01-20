import * as inquirer from 'inquirer'
import chalk from 'chalk'
import {Gitlab} from 'gitlab'
import Command, {writeGitlabConfig} from '../command'
import {hostOptions} from '../constants'

export class Login extends Command {
  static description = 'Configurar servidor y token de acceso'

  async run() {
    // prettier-ignore
    inquirer
    .prompt([
      {
        name: 'host',
        message: 'Elige un servidor GitLab',
        type: 'list',
        choices: hostOptions,
      },
      {
        name: 'token',
        message: 'Introduce un Personal Access Token vigente',
        type: 'password',
      },
    ])
    .then(({host, token}) => {
      const gitlab = new Gitlab({host, token})
      return gitlab.Users.current()
      .then((user: any) => {
        this.log(`\nUsuario identificado como ${chalk.bold(user.name)}\n`)
        writeGitlabConfig(this, {host, token})
        .then(() => {
          this.log('Configuración guardada')
        })
        .catch(error => {
          console.error(error)
          this.warn('Error al guardar la configuración')
        })
      })
      .catch(error => {
        if (error.response.status === 401) {
          this.warn('Token inválido')
        } else {
          console.log(error)
          this.warn('Error al consultar servidor GitLab')
        }
      })
    })
  }
}
