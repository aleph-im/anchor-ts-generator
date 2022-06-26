import generate from "./generator.js";
import {TemplateType} from "./types.js";

//let dest:string;
export const dest = process.argv[3] ?? "./";
async function main() {
  const filename = process.argv[2] ?? "switchboard_v2";
    //dest =  process.argv[3];
   // export const PACKAGE_ROOT: string = "./"
  console.log("\n");
  console.log("Destination: " + dest);
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
