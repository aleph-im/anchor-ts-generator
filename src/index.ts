import generate from "./generator.js";
import { TemplateType } from "./types.js";
import { Command } from 'commander';
import { exec } from 'child_process';
import { Paths } from './paths.js'
import { Idl } from "@metaplex-foundation/solita";
import { readFileSync } from "fs";
/*
  <insert-name-here> generate -f <path-to-idl.json> -> Invoke our generator script
  <insert-name-here> generate -a <smart-contract-address> -> Invoke anchor idl fetch <smart-contract-address> -o <idl-out-file.json>
*/

const program = new Command();

program
  .option('-f, --file <path>', 'Generates Indexer based on your IDL')
  .option('-a, --address <pubkey>', 'Generates Indexer based on your program PubKey')
  .action(main)

program.parse(process.argv);

async function main() {
  const options = program.opts();
  if (options.file) {
    let path: string[] = options.file.replace('.json', '').split('/')
    let programName: string = path[path.length - 1]
    const paths = new Paths(`./`, programName)
    const idl = parseIdl(readFileSync(paths.idlFile(programName), "utf8"))
    await generate(programName, idl, paths,
      [
        TemplateType.Types,
        TemplateType.Instructions,
        TemplateType.Events,
        TemplateType.Accounts
      ]
    )
  }
  else{
    if (options.address) {
      exec(`anchor idl fetch --provider.cluster mainnet ${options.address}`, async (error, stdout, stderr) => {
        if(error) {
          console.log(error.message);
          return;
        }
        if(stdout) {
          console.log(stdout)
          const paths = new Paths(`./`, options.address)
          const idl = parseIdl(stdout)
          await generate(options.address, idl, paths,
            [
              TemplateType.Types,
              TemplateType.Instructions,
              TemplateType.Events,
              TemplateType.Accounts
            ]
          )
          return;
        }
        if(stderr) {
          console.log(stderr);
          return;
        }
      })
    }
    else{
      console.log('HELP')
    }
  }
}

function parseIdl(idl: string): Idl {
  return JSON.parse(idl)
}