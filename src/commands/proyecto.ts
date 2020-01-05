import {flags} from '@oclif/command'
// import * as inquirer from 'inquirer'
import {cli} from 'cli-ux'
import {find} from 'lodash'
import Command from '../gitlab-command'
import chalk from 'chalk'
import {ProjectSchema, PRojectDetailsSchema, GroupDetailSchema} from 'gitlab'

const DEFAULT_GROUP = 'dgti'

type Environment = { id: number; name: string; state: string; external_url: string; description: string }
type Variable = { id: number; name: string; path: string; name_with_namespace: string }

export default class Proyecto extends Command {
  static description = 'Información sobre proyectos individuales'

  static args = [
    {
      name: 'grupo',
      description: 'ID o ruta de grupo en GitLab. Ej: dgti, dnet/catalogos',
      default: DEFAULT_GROUP,
    },
    {
      name: 'proyecto',
      description: 'ID numérico o ruta de GitLab (grupo/seubgrupo/proyecto)',
    },
    {
      name: 'ambiente',
      description: 'Seleccionar un ambiente por nombre o ID',
    },
    {
      name: 'acción',
      description: 'Acción a realizar sobre el proyecto',
      options: ['open', 'abrir', 'redeploy'],
    },
  ]

  static flags = {
    ...Command.flags,
    all: flags.boolean({
      char: 'a',
      default: false,
      description: 'Incluir todos los ambientes',
    }),
  };

  static aliases = ['project', 'projects', 'proyectos']

  static examples = [
    chalk.bold('\n# Listar proyectos disponibles'),
    '$ devops proyecto ',

    chalk.bold('\n# Listar proyectos disponibles'),
    '$ devops proyecto 358 # Información de proyecto',

    '$ devops proyecto devops/devopsfront # Por ruta del proyecto (grupo/subgrupo/proyecto)',
    '$ devops proyecto devops/devopsfront production # Información de un ambiente',
    '$ devops proyecto devops/devopsfront production open # Abrir URL externa de un proyecto',
    '$ devops proyecto devops/devopsfront production redeploy # Re-ejecutar tarea Deploy de un ambiente',
    '$ devops --help # Ayuida',
  ]

  perPage = 20

  page = 1

  async logSubgroups(subgroups: object[]) {
    this.log('\nSubgrupos totales:', chalk.bold(subgroups.length))
    cli.table(subgroups, {
      id: {
        header: 'ID',
        minWidth: 7,
      },
      name: {
        header: 'Nombre',
        minWidth: 7,
      },
      web_url: {
        // extended: true,
      },
    })
  }

  async logProjects(projects: ProjectSchema[]) {
    this.log('\nProyectos totales:', chalk.bold(projects.length))
    cli.table(projects, {
      id: {
        header: 'ID',
        minWidth: 7,
      },
      path: {
        header: 'Ruta',
        minWidth: 10,
      },
      name: {
        header: 'Nombre',
      },
      web_url: {
        // extended: true,
      },
    })
  }

  async logGroupVariables(variables: [Variable]) {
    this.log('\nVariables totales:', chalk.bold(variables.length))
  }

  async logEnvironments(environments: [Environment]) {
    this.log('\nAmbientes totales:', chalk.bold(environments.length))
    cli.table(environments, {
      id: {
        header: 'ID',
        minWidth: 7,
      },
      name: {
        header: 'Nombre',
      },
      state: {
        header: 'Estado',
      },
      external_url: {
        header: 'URL',
        get: env => env.external_url || '',
      },
    })
  }

  paginationParams = {
    perPage: 20,
    page: 1,
  }

  async run() {
    const {args, flags} = this.parse(Proyecto)

    const group: GroupDetailSchema | undefined = await this.gitlab?.Groups.show(args.grupo)
    const project: ProjectSchema | undefined = group?.projects.find(project => [project.id, project.path].includes(args.proyecto))
    const environments: [Environment] = project ?
      (await this.gitlab?.Environments.all(project.id).then(
        (envs: Environment[]) => envs.filter(env => flags.all || (env.state === 'available')))) :
      []

    if (project) {
      this.log('\nProyecto', chalk.bold(project.name_with_namespace))
      cli.url(project?.web_url, project?.web_url || '')

      if (args.ambiente) {
        const environment = find(environments, {name: args.ambiente})
        if (!environment) {
          this.error(`El Ambiente especificado no existe: ${args.ambiente}`)
        }

        switch (args.acción) {
        case 'abrir':
        case 'open':
          if (environment.external_url) {
            this.log('Abriendo URL en bavegador...', environment.external_url)
            cli.open(environment.external_url)
          } else {
            this.warn(`No hay una URL disponible para el ambiente ${environment.name}`)
          }
          break

        case 'redeploy':
        }
      } else if (environments.length > 0) {
        this.logEnvironments(environments)
      }
    } else {
      // console.log(group)
      this.log('\nGrupo', chalk.bold(group.name), `(${group.id})`)
      cli.url(chalk.bold(group?.web_url), group?.web_url || '')

      const projects = await this.gitlab?.GroupProjects.all(group.id, this.paginationParams)
      projects && projects.length > 0 && this.logProjects(projects)

      const subgroups: object[] | undefined = await this.gitlab?.Groups.subgroups(group.id, this.paginationParams).then()
      subgroups && subgroups.length > 0 && this.logSubgroups(subgroups)
    }
  }
}
