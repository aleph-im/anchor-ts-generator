import { Idl, TemplateType } from "./types.js";
import { existsSync, mkdirSync, writeFileSync, readFileSync, realpathSync } from "fs";
import { PACKAGE_ROOT } from "./constants.js";
import Mustache from "mustache";
import IdlTransformer from "./transformer.js";

import { Paths } from './paths.js'
import { renderRootFiles } from './render-root.js'
import { renderSrcFiles } from './render-src.js'
import { renderParsersFiles } from './render-parsers.js'
import { renderGraphQLFiles } from './render-graphql.js'

export default function generate(fileName: string, toGenerate: TemplateType[]) {
  const paths = new Paths(`./`)
  const idl = parseIdl(paths.idlFile(fileName))

  if(!existsSync(paths.outputDir))
    mkdirSync(paths.outputDir)

  if(!existsSync(paths.tsDir))
    mkdirSync(paths.tsDir)
  
  const { typesView, instructionsView, eventsView } = generateFromTemplateType(idl, toGenerate, paths)
  console.log(typesView, instructionsView, eventsView)
  
  if(!existsSync(paths.indexerDir))
    mkdirSync(paths.indexerDir)
    const { config, pkg, run, tsconfig } = renderRootFiles(fileName)
    writeFileSync(paths.indexerFile('config.ts'), config);
    writeFileSync(paths.indexerFile('package.json'), pkg);
    writeFileSync(paths.indexerFile('run.ts'), run);
    writeFileSync(paths.indexerFile('tsconfig.json'), tsconfig);

  if(!existsSync(paths.srcDir))
    mkdirSync(paths.srcDir)
    const { constants, solanarpc, types } = renderSrcFiles()
    writeFileSync(paths.srcFile('constants'), constants);
    writeFileSync(paths.srcFile('solanaRpc'), solanarpc);
    writeFileSync(paths.srcFile('types'), types);

  if(!existsSync(paths.dalDir))
    mkdirSync(paths.dalDir)

  if(!existsSync(paths.domainDir))
    mkdirSync(paths.domainDir)
  
  if(!existsSync(paths.graphqlDir))
    mkdirSync(paths.graphqlDir)
    const { index, resolvers, schema, GQLtypes } = renderGraphQLFiles(fileName)
    writeFileSync(paths.graphqlFile('index'), index);
    writeFileSync(paths.graphqlFile('resolvers'), resolvers);
    writeFileSync(paths.graphqlFile('schema'), schema);
    writeFileSync(paths.graphqlFile('types'), GQLtypes);

  if(!existsSync(paths.indexersDir))
    mkdirSync(paths.indexersDir)

  if(!existsSync(paths.parsersDir))
    mkdirSync(paths.parsersDir)
    const event = renderParsersFiles(fileName)
    writeFileSync(paths.parsersFile('event'), event);

  if(!existsSync(paths.utilsDir))
    mkdirSync(paths.utilsDir)
}

function generateFromTemplateType(idl: Idl, toGenerate: TemplateType[], paths: Paths) {
  let typesView, instructionsView, eventsView = null

  for (const templateType of toGenerate) {
    switch (templateType) {
      case TemplateType.Types:
        if (idl.types && idl.instructions) {
          const { template, view } = generateTypes(idl)
          const text = Mustache.render(template, view);
          writeFileSync(paths.tsFile(templateType), text)
          typesView = view
        }
        else console.log("No IDL types detected")
        break
  
      case TemplateType.Instructions:
        if (idl.types && idl.instructions) {
          const { template, view } = generateInstructions(idl)
          const text = Mustache.render(template, view);
          // TODO: Modularize to enum.mustache
          text.slice(0, text.length-2)  // to avoid the last '|'
          writeFileSync(paths.tsFile(templateType), text)
          instructionsView = view
        }
        else console.log("Missing IDL types or instructions")
        break
  
      case TemplateType.Events:
        if (idl.events && idl.instructions){
          const { template, view } = generateEvents(idl)
          const text = Mustache.render(template, view)
          // TODO: Modularize to enum.mustache
          text.slice(0, text.length-2)
          writeFileSync(paths.tsFile(templateType), text)
          eventsView = view
        }
        else console.log("Missing IDL types or events")
        break
  
      default:
        console.log(`template type ${templateType} not supported`)
    }
  }

  return { typesView, instructionsView, eventsView }
}

function generateTypes(idl: Idl) {
  const trafo = new IdlTransformer(idl);
  let view = trafo.generateViewTypes();
  const template = readFileSync(
    `${PACKAGE_ROOT}/src/mustaches/types.mustache`, "utf8");
  return { template, view };
}

function generateInstructions(idl: Idl) {
  const trafo = new IdlTransformer(idl);
  const view = trafo.generateViewInstructions();
  const template = readFileSync(
    `${PACKAGE_ROOT}/src/mustaches/instructions.mustache`, "utf8");

  return { template, view };
}

function generateEvents(idl: Idl) {
  const trafo = new IdlTransformer(idl);
  const view = trafo.generateViewEvents();
  const template = readFileSync(
    `${PACKAGE_ROOT}/src/mustaches/events.mustache`, "utf8");
  return { template, view };
}

function parseIdl(path: string): Idl {
  console.log(realpathSync(path))
  return JSON.parse(readFileSync(path, "utf8"))
}
