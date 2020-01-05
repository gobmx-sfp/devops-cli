import {flags} from '@oclif/command'
import * as inquirer from 'inquirer'
import Command, {writeGitlabConfig} from '../../gitlab-command'
import hostOptions from './hostOptions.json'

export class Config extends Command {
  // static flags = {
  //   ...Command.flags,
  //   host: flags.string({options: Object.keys(hostOptions), description: 'Host de GitLab', env: 'GITLAB_HOST'}),
  //   token: flags.string({options: Object.keys(hostOptions), description: 'Token de acceso de GitLab', env: 'GITLAB_TOKEN'}),
  // };

  static description = 'Establece o cambia la configuración necesaria'

  static args = [
    {name: 'action', options: ['reset'], description: 'Operación a realizar en la configuración'},
  ]

  async run() {
    const {args} = this.parse(Config)

    if (args.action === 'reset') {
      this.log('Restableciendo configuración')
      writeGitlabConfig(this, {})
    }

    inquirer.prompt(
      [
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
      ]
    ).then(({host, token}) => {
      writeGitlabConfig(this, {
        host,
        token,
      })
    })

    // const token =
    this.log('Configuración establecida')
  }
}
