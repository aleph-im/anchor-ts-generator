import generate from "./generator.js"
import { TemplateType } from "./types.js"
import { Command } from 'commander'
import { exec } from 'child_process'
import { Paths } from './paths.js'
import { readFileSync } from "fs"
import { Idl } from "@metaplex-foundation/solita"

const program = new Command()

program
  .name('igen')
  .option('-f, --file <path>', 'Generates Indexer based on your IDL.')
  .option('-a, --address <pubkey>', 'Generates Indexer based on your program PubKey. If --file is provided, then this address will only be used as the programId in the generated code.')
  .option('-o, --output <path>', 'Sets the output path for the generated indexer folder.', './packages')
  .action(main)

program.parse(process.argv)

async function main() {
  const options = program.opts()
  if (options.file) {
    let path: string[] = options.file.replace('.json', '').split('/')
    let programName: string = path[path.length - 1]
    const paths = new Paths(`./`, programName, options.output)
    const idl: Idl = JSON.parse(readFileSync(paths.idlFile(programName), "utf8"))
    if(!idl.metadata) {
      idl.metadata = {
        address: "PROGRAM PUBKEY"
      }
    }
    if(options.address) {
      idl.metadata.address = options.address
    }
    await generate(idl, paths,
      [
        TemplateType.Types,
        TemplateType.Instructions,
        TemplateType.Accounts
      ]
    )
  }
  else{
    if (options.address) {
      exec(`anchor idl fetch --provider.cluster mainnet ${options.address}`, async (error, stdout, stderr) => {
        if(error) {
          console.log(error) 
        }
        if(stdout) {
          const idl: Idl = JSON.parse(stdout)
          if(!idl.metadata) {
            idl.metadata = {
              address: options.address
            }
          }
          const paths = new Paths(`./`, idl.name, options.output)
          await generate(idl, paths,
            [
              TemplateType.Types,
              TemplateType.Instructions,
              TemplateType.Accounts
            ],
            options.address
          )
          return
        }
        if(stderr) {
          return
        }
      })
    }
  }
}