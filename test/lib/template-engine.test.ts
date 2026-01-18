import path from 'node:path'

import {expect} from 'chai'

import {
  buildInitialContext,
  evaluateCondition,
  getRefValue,
  interpolate,
  resolveTargetPath,
} from '../../src/lib/template-engine.js'

describe('template-engine', () => {
  it('resolves ref values from the context', () => {
    const ctx = buildInitialContext('/out', {
      name: 'Ada',
      flags: {enabled: true},
    })

    expect(getRefValue(ctx, {ref: 'answers.name'})).to.equal('Ada')
    expect(getRefValue(ctx, {ref: 'answers.flags.enabled'})).to.equal(true)
    expect(getRefValue(ctx, {ref: 'answers.missing'})).to.equal(undefined)
  })

  it('interpolates {{outDir}} and answer refs, replacing missing values with empty string', () => {
    const ctx = buildInitialContext('/out', {name: 'Ada'})
    expect(interpolate('hi {{answers.name}}', ctx)).to.equal('hi Ada')
    expect(interpolate('dir={{outDir}}', ctx)).to.equal('dir=/out')
    expect(interpolate('x={{answers.missing}}', ctx)).to.equal('x=')
  })

  it('evaluates conditions', () => {
    const ctx = buildInitialContext('/out', {
      flavor: 'vanilla',
      enabled: true,
      empty: '',
    })

    expect(evaluateCondition(ctx, {op: 'eq', left: {ref: 'answers.flavor'}, right: 'vanilla'})).to.equal(true)
    expect(evaluateCondition(ctx, {op: 'neq', left: {ref: 'answers.flavor'}, right: 'chocolate'})).to.equal(true)
    expect(evaluateCondition(ctx, {op: 'in', left: {ref: 'answers.flavor'}, right: ['vanilla', 'strawberry']})).to.equal(true)
    expect(evaluateCondition(ctx, {op: 'notIn', left: {ref: 'answers.flavor'}, right: ['mint']})).to.equal(true)

    expect(evaluateCondition(ctx, {op: 'truthy', value: {ref: 'answers.enabled'}})).to.equal(true)
    expect(evaluateCondition(ctx, {op: 'falsy', value: {ref: 'answers.empty'}})).to.equal(true)
    expect(evaluateCondition(ctx, {op: 'exists', value: {ref: 'answers.flavor'}})).to.equal(true)
    expect(evaluateCondition(ctx, {op: 'exists', value: {ref: 'answers.missing'}})).to.equal(false)

    expect(
      evaluateCondition(ctx, {
        op: 'and',
        conditions: [
          {op: 'eq', left: {ref: 'answers.flavor'}, right: 'vanilla'},
          {op: 'truthy', value: {ref: 'answers.enabled'}},
        ],
      }),
    ).to.equal(true)

    expect(
      evaluateCondition(ctx, {
        op: 'or',
        conditions: [
          {op: 'eq', left: {ref: 'answers.flavor'}, right: 'mint'},
          {op: 'eq', left: {ref: 'answers.flavor'}, right: 'vanilla'},
        ],
      }),
    ).to.equal(true)

    expect(evaluateCondition(ctx, {op: 'not', condition: {op: 'truthy', value: {ref: 'answers.enabled'}}})).to.equal(false)
  })

  it('resolves target paths relative to outDir', () => {
    const outDir = path.resolve('C:/tmp/out')
    expect(resolveTargetPath(outDir, 'file.txt')).to.equal(path.resolve(outDir, 'file.txt'))
    expect(resolveTargetPath(outDir, path.resolve(outDir, 'abs.txt'))).to.equal(path.resolve(outDir, 'abs.txt'))
  })
})
