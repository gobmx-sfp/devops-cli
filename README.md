devops
====

Declaranet CLI

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/devops.svg)](https://npmjs.org/package/devops)
[![CircleCI](https://circleci.com/gh/dreglad/devops/tree/master.svg?style=shield)](https://circleci.com/gh/dreglad/devops/tree/master)
[![Downloads/week](https://img.shields.io/npm/dw/devops.svg)](https://npmjs.org/package/devops)
[![License](https://img.shields.io/npm/l/devops.svg)](https://github.com/dreglad/devops/blob/master/package.json)

<!-- toc -->
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->
# Usage
<!-- usage -->
```sh-session
$ npm install -g devops-cli
$ devops COMMAND
running command...
$ devops (-v|--version|version)
devops-cli/0.0.3 darwin-x64 node-v13.5.0
$ devops --help [COMMAND]
USAGE
  $ devops COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`devops conf [KEY] [VALUE]`](#devops-conf-key-value)
* [`devops config [ACTION]`](#devops-config-action)
* [`devops help [COMMAND]`](#devops-help-command)
* [`devops proyecto [GRUPO] [PROYECTO] [AMBIENTE] [ACCIÓN]`](#devops-proyecto-grupo-proyecto-ambiente-acción)
* [`devops variables [FILE]`](#devops-variables-file)

## `devops conf [KEY] [VALUE]`

manage configuration

```
USAGE
  $ devops conf [KEY] [VALUE]

ARGUMENTS
  KEY    key of the config
  VALUE  value of the config

OPTIONS
  -d, --cwd=cwd          config file location
  -d, --delete           delete?
  -h, --help             show CLI help
  -k, --key=key          key of the config
  -n, --name=name        config file name
  -p, --project=project  project name
  -v, --value=value      value of the config
```

_See code: [conf-cli](https://github.com/natzcam/conf-cli/blob/v0.1.9/src/commands/conf.ts)_

## `devops config [ACTION]`

Establece o cambia la configuración necesaria

```
USAGE
  $ devops config [ACTION]

ARGUMENTS
  ACTION  (reset) Operación a realizar en la configuración

OPTIONS
  --host=host    Nombre del host de GitLab
  --token=token  Token de acceso de GitLab (https://docs.gitlab.com/12.6/ee/user/profile/personal_access_tokens.html)
```

## `devops help [COMMAND]`

display help for devops

```
USAGE
  $ devops help [COMMAND]

ARGUMENTS
  COMMAND  command to show help for

OPTIONS
  --all  see all commands in CLI
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v2.2.3/src/commands/help.ts)_

## `devops proyecto [GRUPO] [PROYECTO] [AMBIENTE] [ACCIÓN]`

Información sobre proyectos individuales

```
USAGE
  $ devops proyecto [GRUPO] [PROYECTO] [AMBIENTE] [ACCIÓN]

ARGUMENTS
  GRUPO     [default: dgti] ID o ruta de grupo en GitLab. Ej: dgti, dnet/catalogos
  PROYECTO  ID numérico o ruta de GitLab (grupo/seubgrupo/proyecto)
  AMBIENTE  Seleccionar un ambiente por nombre o ID
  ACCIÓN    (abrir|open|redeploy|variables) Acción a realizar sobre el proyecto

OPTIONS
  -a, --all      Incluir todos los ambientes
  --host=host    Nombre del host de GitLab
  --token=token  Token de acceso de GitLab (https://docs.gitlab.com/12.6/ee/user/profile/personal_access_tokens.html)

ALIASES
  $ devops project
  $ devops projects
  $ devops proyectos

EXAMPLES
  
  # Listar proyectos disponibles
  $ devops proyecto 
  
  # Listar proyectos disponibles
  $ devops proyecto --help # Imprimir instrucciones de uso
  $ devops proyecto 358 # Información de proyecto
  $ devops proyecto devops/devopsfront # Por ruta del proyecto (grupo/subgrupo/proyecto)
  $ devops proyecto devops/devopsfront production # Información de un ambiente
  $ devops proyecto devops/devopsfront production open # Abrir URL externa de un proyecto
  $ devops proyecto devops/devopsfront production variables # Re-ejecutar Listar variables de ambiente
  $ devops proyecto devops/devopsfront production redeploy # Re-ejecutar tarea Deploy de un ambiente
```

## `devops variables [FILE]`

describe the command here

```
USAGE
  $ devops variables [FILE]

OPTIONS
  -f, --force
  -h, --help       show CLI help
  -n, --name=name  name to print
```
<!-- commandsstop -->
