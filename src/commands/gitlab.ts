import {flags} from '@oclif/command'
import {filter, find, get, pick} from 'lodash'
import {cli} from 'cli-ux'
import * as inquirer from 'inquirer'
import Command from '../command'
import chalk from 'chalk'
import {
  ProjectSchema as Project,
  EnvironmentSchema as Environment,
  GroupSchema as Group,
  ResourceVariableSchema as Variable,
} from 'gitlab'
import {Options} from '@oclif/config/lib/plugin'

export default class GitLab extends Command {
  static description = 'Información sobre proyectos individuales'

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
      description: 'Seleccionar un ambiente por nombre o ID',
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
          // extended: true,
        },
      },
      {
        printLine: this.log,
        ...(tableOptions as Options),
      },
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
      },
      {
        printLine: this.log,
        ...(tableOptions as Options),
      },
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
      {
        printLine: this.log,
        ...(tableOptions as Options),
      },
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
        },
      } :
      {}

    cli.table(
      variables,
      {
        key: {
          header: 'Nombre',
          minWidth: 7,
        },
        value: {
          header: 'Valor',
        },
        protected: {
          header: 'Protegida',
          get: variable => (get(variable, 'protected', false) ? 'Sí' : 'No'),
        },
        masked: {
          header: 'Enmascarada',
          get: variable => (get(variable, 'masked', false) ? 'Sí' : 'No'),
        },
        variable_type: {
          header: 'Tipo',
          get: ({variable_type}: Variable) => {
            const variableTypes = {
              env_var: 'Ambiente',
              file: 'Archivo',
            }
            return get(variableTypes, variable_type, variable_type)
          },
        },
        ...envScopeColumn,
      },
      {
        printLine: this.log,
        ...(tableOptions as Options),
      },
    )
    total && cli.log(chalk.bold('Total\t'), variables.length.toString())
  }

  async logGroup(group: Group) {
    this.heading(`${group.name}`)
    cli.log(`ID: ${group.id}`)
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
      this.error('GitLab no configurado. Ejecuta: "devops config"')
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
      this.error('GitLab no configurado. Ejecuta: "devops config"')
    }

    const {args, flags} = this.parse(GitLab)
    this.heading(`${project.name}`)
    cli.log(`ID: ${project.id}`)
    cli.log(`Path: ${project.path_with_namespace}`)
    cli.log(`GitLab: ${project.web_url}`)
    project.namespace &&
      cli.log(
        `Grupo: ${project.namespace.full_path} | ${project.namespace.name}`,
      )
    // cli.log(`Grupo: ${project.gr}`)
    console.log(project)

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
    inquirer.prompt([
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
        validate: value => !value.trim(),
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
      {
        name: 'confirm',
        message: 'Se agregará una variable ¿Estás seguro?',
        type: 'confirm',
        default: false,
      },
    ])
    .then(({key, value, options, environment_scope, confirm}) => {
      if (!confirm) return

      this.log('Creando variable...')
        this.gitlab?.ProjectVariables.create(project.id, {
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
        }).catch(error => {
          console.error(error)
          this.warn('Error al crear variable')
        })
    })
  }

  async run() {
    const {flags} = this.parse(GitLab)
    const id = flags.id || this.gitProjectId

    if (!this.gitlab) {
      this.error('GitLab no configurado. Ejecuta: "devops config"')
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
