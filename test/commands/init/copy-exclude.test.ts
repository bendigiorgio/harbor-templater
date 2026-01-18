import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

import {runCommand} from '@oclif/test'
import {expect} from 'chai'

describe('init (copy exclude + dir targets)', () => {
  it('supports copy.exclude for directory sources', async () => {
    const tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'harbor-templater-init-'))
    const projectDir = path.join(tmpRoot, 'app')

    await runCommand([
      'init',
      '--template',
      './test/commands/init/fixtures/template-copy-exclude.json',
      '--out',
      tmpRoot,
      '--answer',
      `projectDir=${projectDir}`,
      '--defaults',
    ])

    const keep = await fs.readFile(path.join(projectDir, 'copied', 'keep.txt'), 'utf8')
    expect(keep.replaceAll('\r\n', '\n')).to.equal('keep\n')

    const exists = async (p: string) =>
      fs
        .access(p)
        .then(() => true)
        .catch(() => false)

    expect(await exists(path.join(projectDir, 'copied', 'debug.log'))).to.equal(false)
    expect(await exists(path.join(projectDir, 'copied', 'node_modules', 'dep.txt'))).to.equal(false)

    // Some Node/platform combinations may still create the destination directory
    // even if all files beneath it are excluded.
    const nmPath = path.join(projectDir, 'copied', 'node_modules')
    if (await exists(nmPath)) {
      const entries = await fs.readdir(nmPath)
      expect(entries).to.deep.equal([])
    }
  })

  it('treats a trailing-slash copy target as a directory and preserves basename', async () => {
    const tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'harbor-templater-init-'))
    const projectDir = path.join(tmpRoot, 'app')

    await runCommand([
      'init',
      '--template',
      './test/commands/init/fixtures/template-copy-dir-target.json',
      '--out',
      tmpRoot,
      '--answer',
      `projectDir=${projectDir}`,
      '--defaults',
    ])

    const copiedPath = path.join(projectDir, 'dir-target', 'base.json')
    const raw = await fs.readFile(copiedPath, 'utf8')
    const parsed = JSON.parse(raw)
    expect(parsed).to.have.property('name', 'base')
  })
})
