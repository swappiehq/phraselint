import { Command } from 'commander'
import { type Issue, phraselint } from './phraselint.js'

console.time('Done')

async function main() {
  let app = new Command()
    .name('phraselint')
    .description('Tool for validating i18n files coming from Phrase')
    .version('0.1.0')
    .helpCommand(true)

  app
    .requiredOption('--entry <path>', 'entry point to where i18n files are i.e. `./i18n`')
    .requiredOption('--ref <locale-file>', 'reference locale file containing all the right keys and values', 'en.json')

  app.parse()

  const { ref, entry } = app.opts() as { entry: string, ref: string }

  const [groups, error] = await phraselint({
    dir: entry,
    mainEntry: ref,
  })

  if (error) {
    console.error(error.message)
    process.exitCode = 1
  }
}

main()
  .catch(console.error)
  .finally(() => {
    console.timeEnd('Done')
  })
