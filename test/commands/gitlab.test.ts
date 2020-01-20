import {expect, test} from '@oclif/test'

describe('gitlab', () => {
  // prettier-ignore
  test
  .stdout()
  .command(['gitlab'])
  .it('selecciona un grupo por ID: gitlab --id 2', ctx => {
    expect(ctx.stdout).to.contain('DGTI')
  })

  // prettier-ignore
  test
  .stdout()
  .command(['gitlab', '--id', 'dgti'])
  .it('selecciona grupo por path: gitlab --id dgti', ctx => {
    expect(ctx.stdout).to.contain('DGTI')
  })
})
