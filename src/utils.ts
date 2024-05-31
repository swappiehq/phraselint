export function groupBy<T>(items: T[], getKey: (it: T) => any): Map<string, T[]> {
  const groups: Map<string, T[]> = new Map()

  for (const it of items) {
    let group = groups.get(getKey(it))
    if (!group) {
      group = []
      groups.set(getKey(it), group)
    }
    group.push(it)
  }

  return groups
}

export function difference(a: string[], b: string[]): string[] {
  const setA = new Set(a)

  for (const it of b) {
    setA.delete(it)
  }

  return [...setA]
}
