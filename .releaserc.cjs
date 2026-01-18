module.exports = {
  branches: ['main'],
  tagFormat: 'v${version}',
  plugins: [
    ['@semantic-release/commit-analyzer', {preset: 'conventionalcommits'}],
    ['@semantic-release/release-notes-generator', {preset: 'conventionalcommits'}],
    ['@semantic-release/changelog', {changelogFile: 'CHANGELOG.md'}],

    // Keep the oclif README command section in sync on releases
    ['@semantic-release/exec', {prepareCmd: 'pnpm exec oclif readme'}],

    ['@semantic-release/npm', {npmPublish: true}],
    ['@semantic-release/github', {}],

    // Commit back CHANGELOG + README updates
    [
      '@semantic-release/git',
      {
        assets: ['CHANGELOG.md', 'README.md'],
        message:
          'chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}',
      },
    ],
  ],
}
