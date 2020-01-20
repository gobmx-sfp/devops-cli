import Command, {writeGitlabConfig} from '../command'

export class Logout extends Command {
  static description = 'Olvidar token de acceso'

  async run() {
    writeGitlabConfig(this, {}).then(() => {
      this.log(
        'Token restablecido. Configurar nuevamente con: devops gitlab login',
      )
    })
  }
}
