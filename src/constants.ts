import {ProjectSchema as Project, GroupSchema as Group} from 'gitlab'

export const baseGitlabColumns = {
  id: {
    header: 'ID',
    minWidth: 7,
    get: (obj: Project | Group) => `${obj.id} | ${obj.path}`,
  },
  path: {
    header: 'Ruta',
    minWidth: 10,
  },
  web_url: {
    extended: true,
  },
}

export const hostOptions = [
  {
    value: 'https://gitlab.funcionpublica.gob.mx',
    name: 'GitLab DGTI (SFP)',
  },
  {
    value: 'https://gitlab.com',
    name: 'GitLab.com',
  },
  {
    value: null,
    name: 'Otro...',
  },
]

export const configFile = 'gitlab.config.json'
