import { generateCode } from "./generators/index.js"
import { TemplateType } from "./types.js"

async function main() {
  generateCode("switchboard_v2.json",
    [
    TemplateType.Types
  ])
}

main()
