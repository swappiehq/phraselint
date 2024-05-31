import * as assert from 'node:assert'
import { IssueCode, inspect } from '../src/phraselint.js'
import { test } from 'node:test'

test('Missing (sub)props', async (t) => {
  await t.test('should find "one" missing property when majority of other keys have it', () => {
    const actual = inspect('my-key', [
      ['en.json', {
        one: 1,
        two: 2,
      }],
      ['sv.json', {
        one: 3,
        two: 4,
      }],
      ['fi.json', {
        one: 10,
      }],
    ])
    const expected = [{
      key: 'my-key',
      file: 'fi.json',
      issue: {
        code: IssueCode.MissingProp,
        props: ['two'],
      }
    }]
    assert.deepStrictEqual(actual, expected)
  })
  await t.test('should find missing props in two locales', () => {
    const actual = inspect('my-key', [
      ['en.json', {
        one: 1,
        two: 2,
        three: 3,
      }],
      ['sv.json', {
        one: 1,
        two: 2,
      }],
      ['fi.json', {
        one: 10,
      }],
    ])
    assert.strictEqual(actual.length, 2)
    const sv = actual.find(it => it.file === 'sv.json')
    assert.deepStrictEqual(sv, {
      key: 'my-key',
      file: 'sv.json',
      issue: {
        code: IssueCode.MissingProp,
        props: ['three'],
      }
    })
    const fi = actual.find(it => it.file === 'fi.json')
    assert.deepStrictEqual(fi, {
      key: 'my-key',
      file: 'fi.json',
      issue: {
        code: IssueCode.MissingProp,
        props: ['two', 'three'],
      }
    })
  })
})
