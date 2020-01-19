import {flags} from '@oclif/command'
import {cli} from 'cli-ux'
import {filter, find, get} from 'lodash'
import Command from '../gitlab-command'
import chalk from 'chalk'
import {
  ProjectSchema as Project,
  EnvironmentSchema as Environment,
  GroupSchema as Group,
  ResourceVariableSchema as Variable,
} from 'gitlab'
// import {runInThisContext} from 'vm'

export default class Proyecto extends Command {
  static description = 'Información sobre proyectos individuales'

  static args = [
    {
      name: 'id',
      description:
        'ID o ruta de grupo o proyecto en GitLab. Ej: dgti, dnet/catalogos, 72',
    },
    {
      name: 'acción',
      description: 'Acción a realizar sobre el proyecto',
      default: 'info',
      options: [
        'abrir',
        'open',
        'redeploy',
        'pipelines',
        'variables',
        'variable',
        'info',
      ],
    },
    {
      name: 'ambiente',
      description: 'Seleccionar un ambiente por nombre o ID',
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

  perPage = 100

  page = 1

  async logGroups(groups: Group[]) {
    this.heading('Grupos')
    cli.table(groups, {
      id: {
        header: 'ID',
        minWidth: 7,
      },
      name: {
        header: 'Nombre',
        minWidth: 7,
      },
      path: {
        header: 'Ruta',
        minWidth: 7,
      },
      web_url: {
        // extended: true,
      },
    })
    cli.log(chalk.bold('\nTotal\t'), groups.length.toString())
  }

  async logProjects(projects: Project[]) {
    this.heading('Proyectos')
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
    cli.log(chalk.bold('\nTotal\t'), projects.length.toString())
  }

  async logEnvironments(environments: Environment[]) {
    this.heading('Ambientes')
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
    cli.log(chalk.bold('\nTotal\t'), environments.length.toString())
  }

  async logVariables(variables: Variable[]) {
    this.heading('Variables')
    cli.table(variables, {
      key: {
        header: 'Nombre',
        minWidth: 7,
      },
      value: {
        header: 'Valor',
      },
      protected: {
        header: 'Protegido',
      },
      masked: {
        header: 'Enmascarada',
      },
      variable_type: {
        header: 'Tipo',
      },
      ...(get(variables, '0.environment_scope')
        ? {
            environment_scope: {
              header: 'Ambienbte alcance',
            },
          }
        : {}),
    })
    cli.log(chalk.bold('\nTotal\t'), variables.length.toString())
  }

  async logGroup(group: Group) {
    this.log('\nGrupo', chalk.bold(group?.name), `(ID: ${group?.id})`)
    this.log(group.description)
    cli.url(chalk.bold(group?.web_url), group?.web_url || '')

    const projects = await this.gitlab?.GroupProjects.all(
      group.id,
      this.paginationParams,
    )

    if (projects && projects.length > 0) {
      this.logProjects(projects)
    }

    if (!this.gitlab) {
      this.error('GitLab no configurado')
    }

    this.gitlab.GroupVariables.all(group.id).then(variables => {
      this.logVariables(variables)
    })

    const subgroups: Group[] = await this.gitlab.Groups.subgroups(
      group.id,
      this.paginationParams,
    )
    if (subgroups && subgroups.length > 0) {
      this.logGroups(subgroups)
    }
  }

  async logProject(project: Project) {
    if (!this.gitlab) {
      this.error('GitLab no configurado')
    }

    const {args, flags} = this.parse(Proyecto)

    this.heading(`${project.name}`)
    cli.log(`ID: ${project.id}`)
    cli.log(`Path: ${project.namespace.path}`)
    cli.url(`GitLab: ${project.web_url}`, project.web_url || '')
    cli.log(`\n${project.description}`)

    const environments: Environment[] = project
      ? await this.gitlab?.Environments.all(project.id).then(envs =>
          filter(
            envs,
            (env: Environment) => flags.all || env.state === 'available',
          ),
        )
      : []

    let environment: Environment | undefined

    if (args.ambiente) {
      environment = find(environments, {
        name: args.ambiente,
      })
      if (!environment) {
        this.error(`El Ambiente especificado no existe: ${args.ambiente}`)
      }
    } else if (environments.length > 0) {
      this.logEnvironments(environments)
    }

    const variables = await this.gitlab.ProjectVariables.all(project.id)

    switch (args.acción) {
      case 'abrir':
      case 'open':
        if (environment?.external_url) {
          this.log('Abriendo URL en bavegador...', environment.external_url)
          cli.open(environment.external_url)
        } else {
          this.warn(
            `No hay una URL disponible para el ambiente ${environment?.name}`,
          )
        }
        break

      case 'variable':
      case 'variables':
        this.logVariables(variables)
        break

      case 'redeploy':
        break
      // default:
      case 'info':
        if (variables && variables?.length) {
          this.logVariables(variables)
        }
        break
    }
  }

  async run() {
    const {args} = this.parse(Proyecto)

    if (!this.gitlab) {
      this.error('GitLab no configurado')
    }

    if (args.id) {
      this.gitlab.Groups.show(args.id)
        .then(group => this.logGroup(group))
        .catch(() => {
          this.gitlab?.Projects.show(args.id)
            .then(project => {
              this.logProject(project)
            })
            .catch(error => {
              this.warn(
                `Error al obtener groupo o proyecto: ${error.description}`,
              )
            })
        })
    } else {
      this.gitlab.Groups.all().then(groups => {
        this.logGroups(groups.filter(group => !group.parent_id))
      })
    }
  }
}
