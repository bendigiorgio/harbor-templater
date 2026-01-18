import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

import {runCommand} from '@oclif/test'
import {expect} from 'chai'

async function runAndCatch(args: string[]): Promise<Error> {
  const {error} = await runCommand(args)
  if (error) return error as Error
  throw new Error('Expected command to error')
}

describe('init (env + error paths)', () => {
  it('fails on missing env vars by default', async () => {
    const tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'harbor-templater-init-'))
    const projectDir = path.join(tmpRoot, 'app')

    const prev = process.env.MISSING_ENV
    delete process.env.MISSING_ENV
    try {
      const err = await runAndCatch([
        'init',
        '--template',
        './test/commands/init/fixtures/template-env-missing.json',
        '--out',
        tmpRoot,
        '--answer',
        `projectDir=${projectDir}`,
        '--defaults',
      ])
      expect(String(err.message)).to.contain('Missing environment variable: MISSING_ENV')
    } finally {
      if (prev !== undefined) process.env.MISSING_ENV = prev
    }
  })

  it('allows missing env vars with --allowMissingEnv (placeholder remains)', async () => {
    const tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'harbor-templater-init-'))
    const projectDir = path.join(tmpRoot, 'app')

    const prev = process.env.MISSING_ENV
    delete process.env.MISSING_ENV
    try {
      const {error} = await runCommand([
        'init',
        '--template',
        './test/commands/init/fixtures/template-env-missing.json',
        '--out',
        tmpRoot,
        '--answer',
        `projectDir=${projectDir}`,
        '--defaults',
        '--allowMissingEnv',
      ])

      expect(error).to.equal(undefined)

      const contents = await fs.readFile(path.join(projectDir, 'env.txt'), 'utf8')
      expect(contents).to.contain('__MISSING_ENV__')
    } finally {
      if (prev !== undefined) process.env.MISSING_ENV = prev
    }
  })

  it('errors when merge format is yaml (not implemented)', async () => {
    const tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'harbor-templater-init-'))
    const projectDir = path.join(tmpRoot, 'app')

    const err = await runAndCatch([
      'init',
      '--template',
      './test/commands/init/fixtures/template-merge-yaml.json',
      '--out',
      tmpRoot,
      '--answer',
      `projectDir=${projectDir}`,
      '--defaults',
    ])

    expect(String(err.message)).to.contain('YAML merge is not implemented yet')
  })

  it('errors when merge source resolves to a directory', async () => {
    const tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'harbor-templater-init-'))
    const projectDir = path.join(tmpRoot, 'app')

    const err = await runAndCatch([
      'init',
      '--template',
      './test/commands/init/fixtures/template-merge-source-dir.json',
      '--out',
      tmpRoot,
      '--answer',
      `projectDir=${projectDir}`,
      '--defaults',
    ])

    expect(String(err.message)).to.contain('merge source must resolve to a file')
  })

  it('treats conflict=prompt as error when --defaults is set', async () => {
    const tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'harbor-templater-init-'))
    const projectDir = path.join(tmpRoot, 'app')
    await fs.mkdir(projectDir, {recursive: true})

    await fs.writeFile(path.join(projectDir, 'package.json'), '{"keep":true}\n', 'utf8')

    const err = await runAndCatch([
      'init',
      '--template',
      './test/commands/init/fixtures/template-copy-base-only.json',
      '--out',
      tmpRoot,
      '--answer',
      `projectDir=${projectDir}`,
      '--defaults',
      '--conflict',
      'prompt',
    ])

    expect(String(err.message)).to.contain('Target exists:')
  })
})
