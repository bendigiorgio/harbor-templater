import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

import {expect} from 'chai'

import {mergeIntoTarget} from '../../src/lib/merge.js'

async function makeTmpDir(prefix: string): Promise<string> {
  return fs.mkdtemp(path.join(os.tmpdir(), prefix))
}

describe('mergeIntoTarget', () => {
  it('deep merges objects and concatenates arrays', async () => {
    const tmpRoot = await makeTmpDir('harbor-templater-merge-')
    const sourcePath = path.join(tmpRoot, 'source.json')
    const targetPath = path.join(tmpRoot, 'target.json')

    await fs.writeFile(
      targetPath,
      JSON.stringify({
        arr: [1],
        obj: {a: 1, nested: {x: 1}},
      }),
      'utf8',
    )
    await fs.writeFile(
      sourcePath,
      JSON.stringify({
        arr: [2, 3],
        obj: {b: 2, nested: {y: 2}},
      }),
      'utf8',
    )

    await mergeIntoTarget(sourcePath, targetPath, {format: 'json', strategy: 'deep'})

    const merged = JSON.parse(await fs.readFile(targetPath, 'utf8'))
    expect(merged).to.deep.equal({
      arr: [1, 2, 3],
      obj: {a: 1, b: 2, nested: {x: 1, y: 2}},
    })
  })

  it('shallow merges only at the top level', async () => {
    const tmpRoot = await makeTmpDir('harbor-templater-merge-')
    const sourcePath = path.join(tmpRoot, 'source.json')
    const targetPath = path.join(tmpRoot, 'target.json')

    await fs.writeFile(
      targetPath,
      JSON.stringify({
        arr: [1],
        obj: {a: 1, nested: {x: 1}},
      }),
      'utf8',
    )
    await fs.writeFile(
      sourcePath,
      JSON.stringify({
        arr: [2, 3],
        obj: {b: 2, nested: {y: 2}},
      }),
      'utf8',
    )

    await mergeIntoTarget(sourcePath, targetPath, {format: 'json', strategy: 'shallow'})

    const merged = JSON.parse(await fs.readFile(targetPath, 'utf8'))
    expect(merged).to.deep.equal({
      arr: [2, 3],
      obj: {b: 2, nested: {y: 2}},
    })
  })

  it('treats missing or invalid target JSON as empty object', async () => {
    const tmpRoot = await makeTmpDir('harbor-templater-merge-')
    const sourcePath = path.join(tmpRoot, 'source.json')
    const targetPathMissing = path.join(tmpRoot, 'missing', 'target.json')
    const targetPathInvalid = path.join(tmpRoot, 'invalid.json')

    await fs.writeFile(sourcePath, JSON.stringify({a: 1, nested: {b: 2}}), 'utf8')
    await fs.writeFile(targetPathInvalid, '{not-json', 'utf8')

    await mergeIntoTarget(sourcePath, targetPathMissing, {format: 'json', strategy: 'deep'})
    expect(JSON.parse(await fs.readFile(targetPathMissing, 'utf8'))).to.deep.equal({a: 1, nested: {b: 2}})

    await mergeIntoTarget(sourcePath, targetPathInvalid, {format: 'json', strategy: 'deep'})
    expect(JSON.parse(await fs.readFile(targetPathInvalid, 'utf8'))).to.deep.equal({a: 1, nested: {b: 2}})
  })

  it('supports text append and prepend', async () => {
    const tmpRoot = await makeTmpDir('harbor-templater-merge-')
    const sourcePath = path.join(tmpRoot, 'source.txt')
    const targetPath = path.join(tmpRoot, 'target.txt')

    await fs.writeFile(targetPath, 'B', 'utf8')
    await fs.writeFile(sourcePath, 'A', 'utf8')

    await mergeIntoTarget(sourcePath, targetPath, {format: 'text', strategy: 'append'})
    expect(await fs.readFile(targetPath, 'utf8')).to.equal('BA')

    await fs.writeFile(targetPath, 'B', 'utf8')
    await mergeIntoTarget(sourcePath, targetPath, {format: 'text', strategy: 'prepend'})
    expect(await fs.readFile(targetPath, 'utf8')).to.equal('AB')
  })
})
