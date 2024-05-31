import * as assert from 'node:assert'
import { IssueCode, inspect, phraselint } from '../src/phraselint.js'
import { test } from 'node:test'

test('Phraselint', async (t) => {
  await t.test('should test happy path', async () => {
    const [issues] = await phraselint({ dir: 'examples/happy1', mainEntry: 'en.json' })
    assert.strictEqual(issues?.size, 0)
  })
})
