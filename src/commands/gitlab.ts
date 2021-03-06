import {filter, find, get, pick} from 'lodash'
import {
  ProjectSchema as Project,
  EnvironmentSchema as Environment,
  GroupSchema as Group,
  ResourceVariableSchema as Variable,
} from 'gitlab'
import {Options} from '@oclif/config/lib/plugin'
import {flags} from '@oclif/command'
import {cli} from 'cli-ux'
import chalk from 'chalk'
import * as inquirer from 'inquirer'
import Command from '../command'
import {baseGitlabColumns} from '../constants'

export default class GitLab extends Command {
  static description = 'Interactuar con proyecto o grupo de GitLab'

  static args = [
    {
      name: 'acción',
      description: 'Acción a realizar sobre el grupo o proyecto',
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
      description: 'Seleccionar un ambiente específico por nombre o ID',
    },
  ]

  static flags = {
    ...Command.flags,
    ...cli.table.flags(),
    id: flags.string({
      description:
        'ID o ruta de grupo o proyecto en GitLab. Ej: dgti, dnet/catalogos, 72',
    }),
    all: flags.boolean({
      char: 'a',
      default: false,
      description:
        'Incluir todos los ambientes en vez de solo los ambientes activos',
    }),
  }

  static aliases = ['gl']

  perPage = 100

  page = 1

  async logGroups(groups: Group[], total = false) {
    const {flags} = this.parse(GitLab)
    const tableOptions = pick(flags, Object.keys(cli.table.flags()))
    this.heading('Grupos')
    cli.table(
      groups,
      {
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
          header: 'URL',
        },
      },
      tableOptions as Options,
    )
    total && cli.log(chalk.bold('Total:\t'), groups.length.toString())
  }

  async logProjects(projects: Project[], total = false) {
    const {flags} = this.parse(GitLab)
    const tableOptions = pick(flags, Object.keys(cli.table.flags()))

    this.heading('Proyectos')
    cli.table(
      projects,
      {
        ...baseGitlabColumns,
      },
      tableOptions as Options,
    )
    total && cli.log(chalk.bold('Total:\t'), projects.length.toString())
  }

  async logEnvironments(environments: Environment[], total = false) {
    const {flags} = this.parse(GitLab)
    const tableOptions = pick(flags, Object.keys(cli.table.flags()))

    this.heading('Ambientes')
    cli.table(
      environments,
      {
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
      },
      tableOptions as Options,
    )
    total && cli.log(chalk.bold('Total:\t'), environments.length.toString())
  }

  async logVariables(variables: Variable[], total = false) {
    const {flags} = this.parse(GitLab)
    const tableOptions = pick(flags, Object.keys(cli.table.flags()))

    this.heading('Variables')

    const scope = get(variables, '0.environment_scope')

    // prettier-ignore
    const envScopeColumn: object = scope ?
      {
        environment_scope: {
          header: 'Ambienbte(s)',
          get: (obj: any) => obj.environment_scope === '*' ? '* (Todos)' : obj.environment_scope,
        },
      } :
      {}

    cli.table(
      variables,
      {
        ...envScopeColumn,
        key: {
          header: 'Nombre',
          minWidth: 7,
        },
        value: {
          header: 'Valor',
        },
        protected: {
          header: 'Prot.',
          get: variable => (get(variable, 'protected', false) ? 'Sí' : 'No'),
        },
        masked: {
          header: 'Masked',
          get: variable => (get(variable, 'masked', false) ? 'Sí' : 'No'),
        },
        variable_type: {
          extended: true,
          header: 'Tipo',
          get: ({variable_type}: Variable) => {
            const variableTypes = {
              env_var: 'Ambiente',
              file: 'Archivo',
            }
            return get(variableTypes, variable_type, variable_type)
          },
        },
      },
      tableOptions as Options,
    )
    total && cli.log(chalk.bold('Total\t'), variables.length.toString())
  }

  async logGroup(group: Group) {
    const {flags} = this.parse(GitLab)
    if (flags.debug) console.debug('Grupo', group)

    this.heading(`${group.name}`)
    cli.log(`Grupo ID: ${group.id}`)
    cli.log(`Path: ${group.full_path}`)
    cli.log(`GitLab: ${group.web_url}`)

    const projects = await this.gitlab?.GroupProjects.all(
      group.id,
      this.paginationParams,
    )

    if (projects && projects.length > 0) {
      this.logProjects(projects)
    }

    if (!this.gitlab) {
      this.error('GitLab no configurado. Ejecuta: "devops login"')
    }

    await this.gitlab.GroupVariables.all(group.id).then(variables =>
      this.logVariables(variables),
    )

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
      this.error('GitLab no configurado. Ejecuta: "devops login"')
    }

    const {args, flags} = this.parse(GitLab)
    if (flags.debug) console.debug('Proyecto', project)

    this.heading(`${project.name}`)
    cli.log(`Proyecto ID: ${project.id}`)
    cli.log(`Path: ${project.path_with_namespace}`)
    cli.log(`GitLab: ${project.web_url}`)
    project.namespace &&
      cli.log(
        `Grupo: ${project.namespace.full_path} | ${project.namespace.name}`,
      )

    // prettier-ignore
    const environments: Environment[] = project ?
      await this.gitlab?.Environments.all(project.id).then(envs =>
        filter(
          envs,
          (env: Environment) => flags.all || env.state === 'available',
        ),
        ) :
      []

    let environment: Environment | undefined
    if (args.ambiente) {
      environment = find(environments, {
        name: args.ambiente,
      })
      if (!environment) {
        this.error(`El Ambiente especificado no existe: ${args.ambiente}`)
      }
    }

    const variables = await this.gitlab.ProjectVariables.all(project.id)

    // prettier-ignore
    switch (args.acción) {
    case 'abrir':
    case 'open':
      // Si está seleccionado un ambiente, abrir la URL de despliegue
      if (environment?.external_url) {
        this.log(
          `Abriendo URL de amebiente "${environment.name}" en bavegador...`,
          environment.external_url,
        )
        cli.open(environment.external_url)
      } else {
        // Si no hay un ambiente seleccionado, abrir la URL de GitLab
        cli.open(project.web_url)
      }
      break

    case 'variable':
    case 'variables':
      this.logVariables(variables)
      this.log(`\n\n¿Añadir variable CI/CD a proyecto ${project.name}?`)
      this.inquireProjectVariable(project)
      break

    case 'redeploy':
      break

    case 'info':
    default:
      if (variables?.length) await this.logVariables(variables)
      if (environments?.length) await this.logEnvironments(environments)
    }
  }

  async inquireProjectVariable(project: Project) {
    // prettier-ignore
    inquirer
    .prompt([
      {
        name: 'environment_scope',
        message: 'Ambiente(s)',
        type: 'list',
        choices: [
          {name: '* (Todos los ambientes)', value: '*'},
          'production',
          'staging',
          'review/*',
          'Otro...',
        ],
        default: '*',
      },
      {
        name: 'key',
        message: 'Nombre de la variable',
        type: 'string',
        validate: value => Boolean(value.trim()),
      },
      {
        name: 'value',
        message: 'Valor',
        short: 'valor',
        type: 'input',
      },
      {
        name: 'options',
        message: 'Opciones',
        type: 'checkbox',
        choices: ['protected', 'masked'],
      },
    ])
    .then(({key, value, environment_scope, options}) => {
      const params = {
        key,
        value,
        environment_scope,
        ...options.reduce(
          (opts: string[], opt: string) => ({
            ...opts,
            [opt]: true,
          }),
          {},
        ),
      }
      return this.gitlab?.ProjectVariables.create(project.id, params)
      .then(() => {
        this.log('Creado')
      })
      .catch(
          error => {
            const [errorKey] = error.description?.key || []
            if (errorKey?.match(/already been taken/)) {
              cli.confirm('Ya existe variable con el mismo nombre ¿Reescribir? (y/n)')
              .then(confirmed => {
                if (confirmed) {
                  this.gitlab?.ProjectVariables.edit(project.id, key, params)
                  .then(() => {
                    this.log('Actualizado')
                  })
                  .catch(error => {
                    console.error(error)
                    this.warn('Error al actualizar variable')
                  })
                }
              })
            } else {
              this.warn('Error al crear variable')
              console.error(error)
            }
          },
        )
    })
  }

  async run() {
    const {flags} = this.parse(GitLab)
    const id = flags.id || this.gitProjectId

    if (!this.gitlab) {
      this.error('GitLab no configurado. Ejecuta: "devops login"')
    }

    if (id) {
      // prettier-ignore
      await this.gitlab.Groups.show(id)
      .then((group: Group) => this.logGroup(group))
      .catch(() =>
          this.gitlab?.Projects.show(id)
            .then((project: Project) => this.logProject(project))
            .catch(error => {
              if (error.response.status === 404) {
                this.warn(`El grupo o proyecto no existe: ${id}`)
              } else {
                this.warn(
                  `Error al obtener grupo o proyecto (${id}): ${error.description}`,
                )
              }
            }),
      )
    } else {
      await this.gitlab.Groups.all().then(groups =>
        this.logGroups(groups.filter(group => !group.parent_id)),
      )
    }
  }
}
