import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

import {expect} from 'chai'

import {applyEnvironmentReplacements} from '../../src/lib/environment.js'

async function makeTmpDir(prefix: string): Promise<string> {
  return fs.mkdtemp(path.join(os.tmpdir(), prefix))
}

describe('applyEnvironmentReplacements', () => {
  it('replaces placeholders with env var values', async () => {
    const tmpRoot = await makeTmpDir('harbor-templater-env-')
    const filePath = path.join(tmpRoot, '.npmrc')

    const prev = process.env.NPM_TOKEN
    process.env.NPM_TOKEN = 'abc123'
    try {
      await fs.writeFile(filePath, 'token=__NPM_TOKEN__\n', 'utf8')
      await applyEnvironmentReplacements(filePath, {NPM_TOKEN: '__NPM_TOKEN__'}, {allowMissing: false})
      expect(await fs.readFile(filePath, 'utf8')).to.equal('token=abc123\n')
    } finally {
      if (prev === undefined) delete process.env.NPM_TOKEN
      else process.env.NPM_TOKEN = prev
    }
  })

  it('throws on missing env vars when allowMissing=false', async () => {
    const tmpRoot = await makeTmpDir('harbor-templater-env-')
    const filePath = path.join(tmpRoot, 'file.txt')

    const prev = process.env.MISSING_ENV
    delete process.env.MISSING_ENV
    try {
      await fs.writeFile(filePath, 'x=__MISSING__', 'utf8')
      let threw = false
      try {
        await applyEnvironmentReplacements(filePath, {MISSING_ENV: '__MISSING__'}, {allowMissing: false})
      } catch (error) {
        threw = true
        expect(String((error as Error).message ?? error)).to.contain('Missing environment variable: MISSING_ENV')
      }

      expect(threw).to.equal(true)
    } finally {
      if (prev !== undefined) process.env.MISSING_ENV = prev
    }
  })

  it('keeps placeholders when allowMissing=true', async () => {
    const tmpRoot = await makeTmpDir('harbor-templater-env-')
    const filePath = path.join(tmpRoot, 'file.txt')

    const prev = process.env.MISSING_ENV
    delete process.env.MISSING_ENV
    try {
      await fs.writeFile(filePath, 'x=__MISSING__', 'utf8')
      await applyEnvironmentReplacements(filePath, {MISSING_ENV: '__MISSING__'}, {allowMissing: true})
      expect(await fs.readFile(filePath, 'utf8')).to.equal('x=__MISSING__')
    } finally {
      if (prev !== undefined) process.env.MISSING_ENV = prev
    }
  })
})
