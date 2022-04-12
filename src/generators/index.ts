import { Idl, TemplateType } from "../types.js";
import { generateTypes } from "./types/index.js";
import fs from "fs";
import { PACKAGE_ROOT } from "../constants.js";

export * from "./types/index.js";

export function parseIdl(path: string): Idl {
  console.log(fs.realpathSync(path))
  return JSON.parse(fs.readFileSync(path, "utf8"))
}

function generateFromTemplateType(idl: Idl, type: TemplateType): string {
  switch (type) {
    case TemplateType.Types:
      return idl.types ? generateTypes(idl.types) : "// No IDL types detected"
    default:
      return `// template type ${type} not supported`
  }
}

export function generateCode(fileName: string, toGenerate: TemplateType[]) {
  const idl = parseIdl(`${PACKAGE_ROOT}/idl/${fileName}`)

  if(!fs.existsSync(`${PACKAGE_ROOT}/output`))
    fs.mkdirSync(`${PACKAGE_ROOT}/output`)

  for (const templateType of toGenerate) {
    const output = generateFromTemplateType(idl, templateType)
    fs.writeFileSync(`${PACKAGE_ROOT}/output/${templateType}.ts`, output);
  }
}