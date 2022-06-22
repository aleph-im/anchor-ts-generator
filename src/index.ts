import generate from "./generator.js";
import {TemplateType} from "./types.js";

async function main() {
  const filename = process.argv[2] ?? "switchboard_v2"
  await generate(filename,
    [
      TemplateType.Types,
      TemplateType.Instructions,
      TemplateType.Events,
      TemplateType.Accounts
    ]
  )
}

main().then(() => { return 1 })
