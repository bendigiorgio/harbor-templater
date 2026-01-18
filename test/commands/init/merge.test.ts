import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

import {runCommand} from '@oclif/test'
import {expect} from 'chai'

describe('init (merge strategies)', () => {
  it('supports json shallow merge strategy', async () => {
    const tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'harbor-templater-init-'))
    const projectDir = path.join(tmpRoot, 'app')

    await runCommand([
      'init',
      '--template',
      './test/commands/init/fixtures/template-shallow.json',
      '--out',
      tmpRoot,
      '--answer',
      `projectDir=${projectDir}`,
      '--defaults',
      '--conflict',
      'overwrite',
    ])

    const pkg = JSON.parse(await fs.readFile(path.join(projectDir, 'package.json'), 'utf8'))

    // Shallow merge replaces the nested objects entirely.
    expect(pkg.scripts).to.deep.equal({lint: 'echo addon'})
    expect(pkg.dependencies).to.deep.equal({chalk: '5.0.0'})
  })

  it('supports text append merge strategy and creates parent directories', async () => {
    const tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'harbor-templater-init-'))
    const projectDir = path.join(tmpRoot, 'app')

    await runCommand([
      'init',
      '--template',
      './test/commands/init/fixtures/template-text-append.json',
      '--out',
      tmpRoot,
      '--answer',
      `projectDir=${projectDir}`,
      '--defaults',
    ])

    const contents = await fs.readFile(path.join(projectDir, 'nested', 'notes.txt'), 'utf8')
    expect(contents.replaceAll('\r\n', '\n')).to.equal('base\naddon\n')
  })
})
