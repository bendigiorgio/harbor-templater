import {runCommand} from '@oclif/test'
import {expect} from 'chai'

describe('init --dry-run', () => {
  it('prints actions and does not error', async () => {
    const {stdout} = await runCommand([
      'init',
      '--template',
      './test/commands/init/fixtures/template.json',
      '--out',
      '.',
      '--answer',
      'projectDir=./.tmp-dry-run',
      '--defaults',
      '--dryRun',
    ])

    expect(stdout).to.contain('copy')
  })
})
