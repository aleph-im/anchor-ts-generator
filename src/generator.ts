import { Idl, TemplateType } from "./types.js";
import fs from "fs";
import { PACKAGE_ROOT } from "./constants.js";
import Mustache from "mustache";
import IdlTransformer from "./transformer.js";

export default function generate(fileName: string, toGenerate: TemplateType[]) {
  const idl = parseIdl(`${PACKAGE_ROOT}/idl/${fileName}`)

  if(!fs.existsSync(`${PACKAGE_ROOT}/output`))
    fs.mkdirSync(`${PACKAGE_ROOT}/output`)

  for (const templateType of toGenerate) {
    const output = generateFromTemplateType(idl, templateType)
    fs.writeFileSync(`${PACKAGE_ROOT}/output/${templateType}.ts`, output);
  }
}

function generateFromTemplateType(idl: Idl, type: TemplateType): string {
  switch (type) {
    case TemplateType.Types:
      return idl.types ? generateTypes(idl) : "// No IDL types detected"
    case TemplateType.Accounts:
      return idl.accounts ? generateAccounts(idl) : "// No IDL types detected"
    case TemplateType.Instructions:
      return (idl.types && idl.instructions) ? generateInstructions(idl) :
        "// Missing IDL types or instructions"
    case TemplateType.Events:
      return (idl.events && idl.instructions) ? generateEvents(idl) :
        "// Missing IDL types or events"
    default:
      return `// template type ${type} not supported`
  }
}

function generateTypes(idl: Idl): string {
  const trafo = new IdlTransformer(idl);
  let view = trafo.generateViewTypes();
  const template = fs.readFileSync(
    `${PACKAGE_ROOT}/src/mustaches/types.mustache`, "utf8");
  return Mustache.render(template, view);
}

function generateAccounts(idl: Idl): string {
  const trafo = new IdlTransformer(idl);
  let view = trafo.generateViewAccounts();
  const template = fs.readFileSync(
    `${PACKAGE_ROOT}/src/mustaches/types.mustache`, "utf8");
  return Mustache.render(template, view);
}

function generateInstructions(idl: Idl): string {
  const trafo = new IdlTransformer(idl);
  const view = trafo.generateViewInstructions();
  const template = fs.readFileSync(
    `${PACKAGE_ROOT}/src/mustaches/instructions.mustache`, "utf8");
  const text = Mustache.render(template, view);
  // TODO: Modularize to enum.mustache
  return text.slice(0, text.length-2)  // to avoid the last '|'
}

function generateEvents(idl: Idl): string {
  const trafo = new IdlTransformer(idl);
  const view = trafo.generateViewEvents();
  const template = fs.readFileSync(
    `${PACKAGE_ROOT}/src/mustaches/events.mustache`, "utf8");
  const text = Mustache.render(template, view);
  // TODO: Modularize to enum.mustache
  return text.slice(0, text.length-2)
}

function parseIdl(path: string): Idl {
  console.log(fs.realpathSync(path))
  return JSON.parse(fs.readFileSync(path, "utf8"))
}
