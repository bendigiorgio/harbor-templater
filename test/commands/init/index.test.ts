import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

import {runCommand} from '@oclif/test'
import {expect} from 'chai'

describe('init', () => {
  it('scaffolds from a local template without prompting', async () => {
    const tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'harbor-templater-init-'))
    const projectDir = path.join(tmpRoot, 'app')

    process.env.NPM_TOKEN = 'abc123'

    await runCommand([
      'init',
      '--template',
      './test/commands/init/fixtures/template.json',
      '--out',
      tmpRoot,
      '--answer',
      `projectDir=${projectDir}`,
      '--defaults',
    ])

    const pkg = JSON.parse(await fs.readFile(path.join(projectDir, 'package.json'), 'utf8'))
    expect(pkg.scripts).to.have.property('test')
    expect(pkg.scripts).to.have.property('lint')
    expect(pkg.dependencies).to.have.property('left-pad')
    expect(pkg.dependencies).to.have.property('chalk')

    const npmrc = await fs.readFile(path.join(projectDir, '.npmrc'), 'utf8')
    expect(npmrc).to.contain('token=abc123')

    const ran = await fs.readFile(path.join(projectDir, 'ran.txt'), 'utf8')
    expect(ran).to.equal('ok')
  })

  it('supports conflict=skip for file targets', async () => {
    const tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'harbor-templater-init-'))
    const projectDir = path.join(tmpRoot, 'app')
    await fs.mkdir(projectDir, {recursive: true})

    await fs.writeFile(path.join(projectDir, 'package.json'), '{"keep":true}\n', 'utf8')

    await runCommand([
      'init',
      '--template',
      './test/commands/init/fixtures/template.json',
      '--out',
      tmpRoot,
      '--answer',
      `projectDir=${projectDir}`,
      '--defaults',
      '--conflict',
      'skip',
      '--dryRun=false',
    ])

    const pkg = JSON.parse(await fs.readFile(path.join(projectDir, 'package.json'), 'utf8'))
    expect(pkg).to.have.property('keep', true)
  })

  it('supports conflict=overwrite for file targets', async () => {
    const tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'harbor-templater-init-'))
    const projectDir = path.join(tmpRoot, 'app')
    await fs.mkdir(projectDir, {recursive: true})

    await fs.writeFile(path.join(projectDir, 'package.json'), '{"keep":true}\n', 'utf8')
    process.env.NPM_TOKEN = 'abc123'

    await runCommand([
      'init',
      '--template',
      './test/commands/init/fixtures/template.json',
      '--out',
      tmpRoot,
      '--answer',
      `projectDir=${projectDir}`,
      '--defaults',
      '--conflict',
      'overwrite',
    ])

    const pkg = JSON.parse(await fs.readFile(path.join(projectDir, 'package.json'), 'utf8'))
    expect(pkg).to.not.have.property('keep')
    expect(pkg.scripts).to.have.property('lint')
  })
})
