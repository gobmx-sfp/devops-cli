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
$ npm install -g @gobmx-sfp/devops-cli
$ devops COMMAND
running command...
$ devops (-v|--version|version)
@gobmx-sfp/devops-cli/0.0.5 darwin-x64 node-v13.6.0
$ devops --help [COMMAND]
USAGE
  $ devops COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`devops config [ACCIÓN]`](#devops-config-acción)
* [`devops help [COMMAND]`](#devops-help-command)
* [`devops proyecto [ACCIÓN] [AMBIENTE]`](#devops-proyecto-acción-ambiente)

## `devops config [ACCIÓN]`

Establece o cambia la configuración necesaria

```
USAGE
  $ devops config [ACCIÓN]

ARGUMENTS
  ACCIÓN  (reset) Operación a realizar en la configuración

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

## `devops proyecto [ACCIÓN] [AMBIENTE]`

Información sobre proyectos individuales

```
USAGE
  $ devops proyecto [ACCIÓN] [AMBIENTE]

ARGUMENTS
  ACCIÓN    (abrir|open|redeploy|pipelines|variables|variable|info) [default: info] Acción a realizar sobre el grupo o
            proyecto

  AMBIENTE  Seleccionar un ambiente por nombre o ID

OPTIONS
  -a, --all               Incluir todos los ambientes en vez de solo los ambientes activos
  -x, --extended          show extra columns
  --columns=columns       only show provided columns (comma-separated)
  --csv                   output is csv format [alias: --output=csv]
  --filter=filter         filter property by partial string matching, ex: name=foo
  --host=host             Nombre del host de GitLab
  --id=id                 ID o ruta de grupo o proyecto en GitLab. Ej: dgti, dnet/catalogos, 72
  --no-header             hide table header from output
  --no-truncate           do not truncate output to fit screen
  --output=csv|json|yaml  output in a more machine friendly format
  --sort=sort             property to sort by (prepend '-' for descending)

  --token=token           Token de acceso de GitLab
                          (https://docs.gitlab.com/12.6/ee/user/profile/personal_access_tokens.html)

ALIASES
  $ devops project
  $ devops projects
  $ devops proyectos
```
<!-- commandsstop -->
