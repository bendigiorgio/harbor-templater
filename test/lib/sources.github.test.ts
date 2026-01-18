import fs from 'node:fs/promises'

import {expect} from 'chai'

import {resolveSource} from '../../src/lib/sources.js'

const describeGitHub = process.env.RUN_GITHUB_TESTS === '1' ? describe : describe.skip

async function findWorkingRef(): Promise<string> {
  const candidates = [process.env.GITHUB_TEST_REF, 'main', 'develop', 'master'].filter(Boolean) as string[]
  let lastError: unknown

  for (const ref of candidates) {
    try {
      await resolveSource(`github:bendigiorgio/harbor-templater#${ref}:README.md`)
      return ref
    } catch (error) {
      lastError = error
      const message = String((error as Error).message ?? error)
      // If a ref doesn't exist, GitHub codeload returns 404.
      if (message.includes(' 404 ')) continue
      // Any other error is likely transient or a real bug; surface it.
      throw error
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error('Unable to find a working ref for GitHub integration tests')
}

// These tests make real network calls to GitHub (codeload.github.com).
// They are skipped by default; enable with: RUN_GITHUB_TESTS=1 pnpm test
describeGitHub('resolveSource (github: integration)', () => {
  it('downloads a file from GitHub tarball', async () => {
    const ref = await findWorkingRef()
    const resolved = await resolveSource(`github:bendigiorgio/harbor-templater#${ref}:README.md`)
    expect(resolved.kind).to.equal('file')

    const contents = await fs.readFile(resolved.path, 'utf8')
    expect(contents.toLowerCase()).to.contain('harbor-templater')
  })

  it('downloads a directory from GitHub tarball', async () => {
    const ref = await findWorkingRef()
    const resolved = await resolveSource(`github:bendigiorgio/harbor-templater#${ref}:docs`)
    expect(resolved.kind).to.equal('dir')

    const stat = await fs.stat(resolved.path)
    expect(stat.isDirectory()).to.equal(true)

    const entries = await fs.readdir(resolved.path)
    expect(entries).to.include('template-json.md')
  })
})
