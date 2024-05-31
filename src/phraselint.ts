import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import { difference, groupBy } from './utils.js'
import type { Result } from './Result.js'

const cwd = process.cwd()

type PhraseKey = string
type PhraseValue = string | string[] | object[] | object

type PhraseJson = {
  [key: PhraseKey]: PhraseValue
}

type Filename = string

type ValuePair = [Filename, PhraseValue | null]

type PhraseLintProps = {
  dir: string
  mainEntry: string
}

export enum IssueCode {
  MissingProp = 1011,
}

type IssueMissingProp = {
  code: IssueCode.MissingProp,
  props: string[]
}

type IssueDesc = IssueMissingProp

export type Issue = {
  file: Filename
  key: string
  issue: IssueDesc
}

enum ErrorKind {
  NoEntryDir = 9,
  NoReferenceLocale,
  CouldNotParseJson,
}

type NoEntryDirError = {
  code: ErrorKind.NoEntryDir,
  message: 'Entry directory does not exist',
  dir: string
}

type NoReferenceLocaleError = {
  code: ErrorKind.NoReferenceLocale,
  message: 'Reference locale file does not exist',
  file: string
}

type CouldNotParseJsonError = {
  code: ErrorKind.CouldNotParseJson,
  message: 'Could not parse JSON file',
  file: string
}

type AppError = NoEntryDirError | NoReferenceLocaleError | CouldNotParseJsonError

export async function phraselint({ dir, mainEntry }: PhraseLintProps): Promise<Result<Map<string, Issue[]>, AppError>> {
  const baseDir = path.resolve(cwd, dir)

  let dirContents = []
  try {
    dirContents = await fs.readdir(baseDir, { recursive: false, withFileTypes: true, encoding: 'utf8' })
  } catch {
    return [null, {
      code: ErrorKind.NoEntryDir,
      dir: baseDir,
      message: 'Entry directory does not exist'
    }]
  }

  const files = dirContents
    .filter(it => it.isFile() && it.name.endsWith('.json'))
    .map(it => it.name)

  const jsons = new Map<Filename, PhraseJson>()
  for (const file of files) {
    const content = await fs.readFile(path.join(baseDir, file), 'utf8')
    try {
      const json = JSON.parse(content) as PhraseJson
      jsons.set(file, json)
    } catch {
      return [null, {
        code: ErrorKind.CouldNotParseJson,
        message: 'Could not parse JSON file',
        file
      }]
    }
  }

  const mainEntryJson = jsons.get(mainEntry)

  if (!mainEntryJson) {
    return [null, {
      code: ErrorKind.NoReferenceLocale,
      file: mainEntry,
      message: 'Reference locale file does not exist'
    }]
  }

  const issues: Issue[] = []

  for (const key of Object.keys(mainEntryJson)) {
    const values: ValuePair[] = files
      .map(file => {
        const value = jsons.get(file)?.[key] ?? null
        return [file, value]
      })

    issues.push(...inspect(key, values))
  }

  const groups = groupBy(issues, it => it.key)

  return [groups, null]
}

export function inspect(key: string, values: ValuePair[]): Issue[] {
  const issues: Issue[] = []

  issues.push(...inspectMissingProp(key, values))

  return issues
}

function inspectMissingProp(key: string, values: ValuePair[]): Issue[] {
  const propsCount = new Map<Filename, number>(
    values
      .filter(([, value]) =>
        value !== null &&
        typeof value === 'object' &&
        Object.keys(value).length > 0 &&
        !Array.isArray(value)
      )
      .map(([file, value]) => {
        return [file, Object.keys(value as object).length]
      })
  )

  const byCount = new Map<number, Filename[]>()

  for (const [file, count] of propsCount.entries()) {
    const files = byCount.get(count) ?? []
    files.push(file)
    byCount.set(count, files)
  }

  if (byCount.size <= 1) {
    return []
  }

  // we say first group is the true, all others lacking something
  const [refGroup, ...troubleGroup] = [...byCount].sort((a, b) => b[0] - a[0])

  const [, refFiles] = refGroup
  const refFile = refFiles[0]
  const [, refJson] = values.find(it => {
    const [file] = it
    return file === refFile
  })!
  const refKeys = Object.keys(refJson!)

  const issues: Issue[] = []

  for (const [, files] of troubleGroup) {
    for (const file of files) {
      const [, actualJson] = values.find(it => it[0] === file)!
      const actualKeys = Object.keys(actualJson!)
      const diff = difference(refKeys, actualKeys)

      issues.push({
        key,
        file,
        issue: {
          code: IssueCode.MissingProp,
          props: diff
        }
      })
    }
  }

  return issues
}
