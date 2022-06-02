import { Idl, TemplateType } from "./types.js";
import { existsSync, mkdirSync, writeFileSync, readFileSync, realpathSync } from "fs";
import { PACKAGE_ROOT } from "./constants.js";
import Mustache from "mustache";
import IdlTransformer from "./transformer.js";
import { Paths } from './paths.js'
import { renderRootFiles } from './render-root.js'
import { renderSrcFiles } from './render-src.js'

export default function generate(fileName: string, toGenerate: TemplateType[]) {
  const paths = new Paths(`./`)
  const idl = parseIdl(paths.idlFile(fileName))

  if(!existsSync(paths.outputDir))
    mkdirSync(paths.outputDir)

  if(!existsSync(paths.tsDir))
    mkdirSync(paths.tsDir)
  for (const templateType of toGenerate) {
    const output = generateFromTemplateType(idl, templateType)
    writeFileSync(paths.tsFile(templateType), output);
  }

  if(!existsSync(paths.indexerDir))
    mkdirSync(paths.indexerDir)
    const { config, pkg, run, tsconfig } = renderRootFiles(fileName)
    writeFileSync(paths.indexerFile('config.ts'), config);
    writeFileSync(paths.indexerFile('package.json'), pkg);
    writeFileSync(paths.indexerFile('run.ts'), run);
    writeFileSync(paths.indexerFile('config.ts'), tsconfig);

  if(!existsSync(paths.srcDir))
    mkdirSync(paths.srcDir)
    let { constants, solanarpc, types } = renderSrcFiles()
    writeFileSync(paths.srcFile('constants'), constants);
    writeFileSync(paths.srcFile('solanaRpc'), solanarpc);
    writeFileSync(paths.srcFile('types'), types);

  if(!existsSync(paths.dalDir))
    mkdirSync(paths.dalDir)

  if(!existsSync(paths.domainDir))
    mkdirSync(paths.domainDir)
  
  if(!existsSync(paths.graphqlDir))
    mkdirSync(paths.graphqlDir)

  if(!existsSync(paths.indexersDir))
    mkdirSync(paths.indexersDir)

  if(!existsSync(paths.parsersDir))
    mkdirSync(paths.parsersDir)

  if(!existsSync(paths.utilsDir))
    mkdirSync(paths.utilsDir)
}

function generateFromTemplateType(idl: Idl, type: TemplateType): string {
  switch (type) {
    case TemplateType.Types:
      return idl.types ? generateTypes(idl) : "// No IDL types detected"
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
  const template = readFileSync(
    `${PACKAGE_ROOT}/src/mustaches/types.mustache`, "utf8");
  return Mustache.render(template, view);
}

function generateInstructions(idl: Idl): string {
  const trafo = new IdlTransformer(idl);
  const view = trafo.generateViewInstructions();
  const template = readFileSync(
    `${PACKAGE_ROOT}/src/mustaches/instructions.mustache`, "utf8");
  const text = Mustache.render(template, view);
  // TODO: Modularize to enum.mustache
  return text.slice(0, text.length-2)  // to avoid the last '|'
}

function generateEvents(idl: Idl): string {
  const trafo = new IdlTransformer(idl);
  const view = trafo.generateViewEvents();
  const template = readFileSync(
    `${PACKAGE_ROOT}/src/mustaches/events.mustache`, "utf8");
  const text = Mustache.render(template, view);
  // TODO: Modularize to enum.mustache
  return text.slice(0, text.length-2)
}

function parseIdl(path: string): Idl {
  console.log(realpathSync(path))
  return JSON.parse(readFileSync(path, "utf8"))
}
