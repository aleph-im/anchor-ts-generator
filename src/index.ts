import generate from "./generator.js";
import {TemplateType} from "./types.js";

async function main() {
  generate("switchboard_v2",
    [
      TemplateType.Types,
      TemplateType.Instructions,
      TemplateType.Events,
      TemplateType.Accounts
    ]
  )
}

main().then(() => { return 1 })
