import {flags} from '@oclif/command'
import {cli} from 'cli-ux'
import {filter, find} from 'lodash'
import Command from '../gitlab-command'
import chalk from 'chalk'
import {
  ProjectSchema as Project,
  EnvironmentSchema as Environment,
  GroupSchema as Group,
  ResourceVariableSchema as Variable,
} from 'gitlab'

const DEFAULT_GROUP = 'dgti'

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
      options: ['abrir', 'open', 'redeploy', 'variables'],
    },
  ]

  static flags = {
    ...Command.flags,
    all: flags.boolean({
      char: 'a',
      default: false,
      description: 'Incluir todos los ambientes',
    }),
  }

  static aliases = ['project', 'projects', 'proyectos']

  static examples = [
    chalk.bold('\n# Listar proyectos disponibles'),
    '$ devops proyecto ',

    chalk.bold('\n# Listar proyectos disponibles'),
    '$ devops proyecto --help # Imprimir instrucciones de uso',
    '$ devops proyecto 358 # Información de proyecto',
    '$ devops proyecto devops/devopsfront # Por ruta del proyecto (grupo/subgrupo/proyecto)',
    '$ devops proyecto devops/devopsfront production # Información de un ambiente',
    '$ devops proyecto devops/devopsfront production open # Abrir URL externa de un proyecto',
    '$ devops proyecto devops/devopsfront production variables # Re-ejecutar Listar variables de ambiente',
    '$ devops proyecto devops/devopsfront production redeploy # Re-ejecutar tarea Deploy de un ambiente',
  ]

  perPage = 20

  page = 1

  async logGroups(groups: Group[]) {
    cli.table(groups, {
      id: {
        header: 'ID',
        minWidth: 7,
      },
      path: {
        header: 'Ruta',
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
    cli.log(chalk.bold('Total\t'), groups.length.toString())
  }

  async logProjects(projects: Project[]) {
    cli.table(projects, {
      id: {
        header: 'ID',
        minWidth: 7,
      },
      path: {
        header: 'Ruta',
        minWidth: 10,
      },
      web_url: {
        // extended: true,
      },
    })
    cli.log(chalk.bold('Total\t'), projects.length.toString())
  }

  async logEnvironments(environments: Environment[]) {
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
    cli.log(chalk.bold('Total\t'), environments.length.toString())
  }

  async logVariables(variables: Variable[]) {
    cli.table(variables, {
      key: {
        header: 'Nombre',
        minWidth: 7,
      },
      value: {
        header: 'Valor',
      },
      variable_type: {
        header: 'Tipo',
      },
    })
    cli.log(chalk.bold('Total\t'), variables.length.toString())
  }

  async run() {
    const {args, flags} = this.parse(Proyecto)

    if (!this.gitlab) {
      this.error('GitLab no configurado')
    }

    const group = await this.gitlab.Groups.show(args.grupo)
    const project = group.projects.find(project =>
      [project.id, project.path].includes(args.proyecto),
    )
    const environments: Environment[] = project
      ? await this.gitlab?.Environments.all(project.id).then(envs =>
          filter(
            envs,
            (env: Environment) => flags.all || env.state === 'available',
          ),
        )
      : []

    if (project) {
      this.log('\nProyecto', chalk.bold(project.name_with_namespace))
      cli.url(project.web_url, project.web_url || '')

      const variables = await this.gitlab.ProjectVariables.all(project.id)
      this.heading('Variables de proyecto')
      this.logVariables(variables)

      if (args.ambiente) {
        const environment = find(environments, {
          name: args.ambiente,
        })
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
              this.warn(
                `No hay una URL disponible para el ambiente ${environment.name}`,
              )
            }
            break

          case 'redeploy':
            break
          // default:
        }
      } else if (environments.length > 0) {
        this.heading('Ambientes')
        this.logEnvironments(environments)
      }
    } else {
      // console.log(group)
      this.heading('Grupo')
      this.log('\nGrupo', chalk.bold(group?.name), `(${group?.id})`)
      cli.url(chalk.bold(group?.web_url), group?.web_url || '')

      const projects = await this.gitlab?.GroupProjects.all(
        group.id,
        this.paginationParams,
      )

      if (projects && projects.length > 0) {
        this.heading('Ambientes')
        this.logProjects(projects)
      }

      const subgroups: Group[] = await this.gitlab?.Groups.subgroups(
        group?.id,
        this.paginationParams,
      ).then()
      if (subgroups && subgroups.length > 0) {
        this.heading('Subgrupos')
        this.logGroups(subgroups)
      }
    }
  }
}
