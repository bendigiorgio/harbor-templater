import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

import {expect} from 'chai'

import {resolveSource} from '../../src/lib/sources.js'

async function makeTmpDir(prefix: string): Promise<string> {
  return fs.mkdtemp(path.join(os.tmpdir(), prefix))
}

describe('resolveSource', () => {
  it('resolves local files and directories', async () => {
    const tmpRoot = await makeTmpDir('harbor-templater-source-')
    const filePath = path.join(tmpRoot, 'file.txt')
    const dirPath = path.join(tmpRoot, 'dir')

    await fs.writeFile(filePath, 'ok', 'utf8')
    await fs.mkdir(dirPath)

    const file = await resolveSource(filePath)
    expect(file.kind).to.equal('file')
    expect(file.path).to.equal(path.resolve(filePath))

    const dir = await resolveSource(dirPath)
    expect(dir.kind).to.equal('dir')
    expect(dir.path).to.equal(path.resolve(dirPath))
  })

  it('throws on invalid github: sources before any network calls', async () => {
    const invalids = [
      'github:owner/repo:path',
      'github:owner/repo#ref',
      'github:owner/#ref:path',
      'github:/repo#ref:path',
      'github:owner/repo#:path',
      'github:owner/repo#ref:',
    ]

    for (const input of invalids) {
      let threw = false
      try {
        await resolveSource(input)
      } catch (error) {
        threw = true
        expect(String((error as Error).message ?? error)).to.contain('Invalid github source')
      }

      expect(threw).to.equal(true)
    }
  })
})
