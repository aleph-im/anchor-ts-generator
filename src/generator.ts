import { Solita, Schema, Idl } from "@metaplex-foundation/solita"
import { TemplateType } from "./types.js";
import { existsSync, mkdirSync, writeFileSync, readFileSync } from "fs";
import { PACKAGE_ROOT } from "./constants.js";
import Mustache from "mustache";
import IdlTransformer from "./transformer.js";
import { Paths } from './paths.js'
import { renderRootFiles } from './render-root.js'
import { renderSrcFiles } from './render-src.js'
import { renderParsersFiles } from './render-parsers.js'
import { renderGraphQLFiles } from './render-graphql.js'
import { renderDALFiles } from './render-dal.js'
import { renderDomainFiles } from './render-domain.js'
import { renderIndexersFiles } from './render-indexers.js'
import { renderLayoutsFiles } from './render-layouts.js'
import { format, Options } from 'prettier'
//import { renderUtilsFiles } from "./render-utils.js";

const DEFAULT_FORMAT_OPTS: Options = {
  semi: false,
  singleQuote: true,
  trailingComma: 'all',
  useTabs: false,
  tabWidth: 2,
  arrowParens: 'always',
  printWidth: 80,
  parser: 'typescript',
}

export default async function generate(fileName: string, idl: Idl, paths: Paths, toGenerate: TemplateType[]) {

  if(!existsSync(paths.outputDir))
    mkdirSync(paths.outputDir)

  if(!existsSync(paths.projectDir))
    mkdirSync(paths.projectDir)
    const {docker, pkg, run, tsconfig, typesdts } = renderRootFiles(fileName)
    writeFileSync(paths.projectFile('docker-compose.yaml'), docker);
    writeFileSync(paths.projectFile('package.json'), pkg);
    writeFileSync(paths.projectFile('run.ts'), run);
    writeFileSync(paths.projectFile('tsconfig.json'), tsconfig);
    writeFileSync(paths.projectFile('types.d.ts'), typesdts);

  const { typesView, instructionsView, eventsView, accountsView, textAndTemplate } = generateFromTemplateType(idl, toGenerate)
  console.log(typesView, instructionsView, eventsView, accountsView)

  if(!existsSync(paths.srcDir))
    mkdirSync(paths.srcDir)
  const { constants, types } = renderSrcFiles(fileName, accountsView, instructionsView)
  try {
    writeFileSync(paths.srcFile('constants'), format(constants, DEFAULT_FORMAT_OPTS));
    writeFileSync(paths.srcFile('types'), format(types, DEFAULT_FORMAT_OPTS));
  } catch (err) {
    console.log(`Failed to format on src folder`)
  }

  if(!existsSync(paths.dalDir))
    mkdirSync(paths.dalDir)
  const { main, common, instruction, fetcherState } = renderDALFiles(fileName)
  try {
    writeFileSync(paths.dalFile('index'), format(main, DEFAULT_FORMAT_OPTS));
    writeFileSync(paths.dalFile('common'), format(common, DEFAULT_FORMAT_OPTS));
    writeFileSync(paths.dalFile('instruction'), format(instruction, DEFAULT_FORMAT_OPTS));
    writeFileSync(paths.dalFile('fetcherState'), format(fetcherState, DEFAULT_FORMAT_OPTS));
  } catch (err) {
    console.log(`Failed to format on dal folder`)
  }

  if(!existsSync(paths.domainDir))
    mkdirSync(paths.domainDir)
  const { account, processor, custom } = renderDomainFiles(fileName)
  try {
    writeFileSync(paths.domainFile('account'), format(account, DEFAULT_FORMAT_OPTS));
    writeFileSync(paths.domainFile('processor'), format(processor, DEFAULT_FORMAT_OPTS));
    writeFileSync(paths.domainFile(fileName), format(custom, DEFAULT_FORMAT_OPTS));
  } catch (err) {
    console.log(`Failed to format on domain folder`)
  }

  if(!existsSync(paths.graphqlDir))
    mkdirSync(paths.graphqlDir)
  try {
    await generateSchema(paths, idl);
    const { index, resolvers } = renderGraphQLFiles(fileName)
    writeFileSync(paths.graphqlFile('index'), format(index, DEFAULT_FORMAT_OPTS));
    writeFileSync(paths.graphqlFile('resolvers'), format(resolvers, DEFAULT_FORMAT_OPTS));
  } catch (err) {
    console.log(`Failed to format on graphql folder`)
  }

  if(!existsSync(paths.indexersDir))
    mkdirSync(paths.indexersDir)
  const { indexerAccount, customIndexer } = renderIndexersFiles(fileName)
  try {
    writeFileSync(paths.indexersFile(fileName), format(indexerAccount, DEFAULT_FORMAT_OPTS));
    writeFileSync(paths.indexersFile("accountIndexer"), format(customIndexer, DEFAULT_FORMAT_OPTS));
  } catch (err) {
    console.log(`Failed to format on indexer folder`)
  }


  if(!existsSync(paths.layoutsDir))
    mkdirSync(paths.layoutsDir)
  const { accountLayouts, ixLayouts } = renderLayoutsFiles(instructionsView, accountsView);
  try {
    if(accountLayouts) {
      writeFileSync(paths.layoutsFile('accounts'), format(accountLayouts, DEFAULT_FORMAT_OPTS));
    }
    if(ixLayouts) {
      writeFileSync(paths.layoutsFile('instructions'), format(ixLayouts, DEFAULT_FORMAT_OPTS));
    }
  } catch (err) {
    console.log(`Failed to format on layouts folder`)
  }

  if(!existsSync(paths.tsDir))
    mkdirSync(paths.tsDir)
    for (const x of textAndTemplate) {
      if(x[0] == TemplateType.Instructions) {
        writeFileSync(paths.tsFile(x[0]), format(x[1], DEFAULT_FORMAT_OPTS))
      }
      else {
        if(x[0] == TemplateType.Accounts){
          writeFileSync(paths.tsFile(x[0]), format(x[1], DEFAULT_FORMAT_OPTS))
        }
      }
    }

  if(!existsSync(paths.parsersDir))
    mkdirSync(paths.parsersDir)
  const { parser, instructionParser } = renderParsersFiles(fileName)
  try {
    writeFileSync(paths.parsersFile('accountEvent'), format(parser, DEFAULT_FORMAT_OPTS));
    writeFileSync(paths.parsersFile('instruction'), format(instructionParser, DEFAULT_FORMAT_OPTS));
  } catch (err) {
    console.log(`Failed to format on parser folder`)
  }

  if(!existsSync(paths.tsSolitaDir))
    mkdirSync(paths.tsSolitaDir)
  await generateSolitaTypeScript(paths, idl);

  if(!existsSync(paths.graphqlDir))
    mkdirSync(paths.tsSolitaDir)
}

function generateFromTemplateType(idl: Idl, toGenerate: TemplateType[]) {
  let typesView, instructionsView, eventsView, accountsView = undefined
  let textAndTemplate: [TemplateType, string][] = []
  for (const templateType of toGenerate) {
    switch (templateType) {
      case TemplateType.Types:
        if (idl.types) {
          const { template, view } = generateTypes(idl)
          const text = Mustache.render(template, view);
          //writeFileSync(paths.tsFile(templateType), text)
          textAndTemplate.push([templateType, text])
          typesView = view
        }
        else console.log("Missing IDL types")
        break
  
      case TemplateType.Instructions:
        if (idl.instructions) {
          const { template, view } = generateInstructions(idl)
          const text = Mustache.render(template, view);
          // TODO: Modularize to enum.mustache
          //writeFileSync(paths.tsFile(templateType), text.slice(0, text.length-2))
          textAndTemplate.push([templateType, text.slice(0, text.length-2)])
          instructionsView = view
        }
        else console.log("Missing IDL instructions")
        break
  
      case TemplateType.Events:
        if (idl.events){
          const { template, view } = generateEvents(idl)
          const text = Mustache.render(template, view)
          // TODO: Modularize to enum.mustache
          //writeFileSync(paths.tsFile(templateType), text.slice(0, text.length-2))
          textAndTemplate.push([templateType, text.slice(0, text.length-2)])
          eventsView = view
        }
        else console.log("Missing IDL events")
        break

      case TemplateType.Accounts:
        if (idl.accounts){
          const { template, view } = generateAccounts(idl)
          const text = Mustache.render(template, view)
          textAndTemplate.push([templateType, text])
          // TODO: Modularize to enum.mustache
          //writeFileSync(paths.tsFile(templateType), text.slice(0, text.length))
          accountsView = view
        }
        else console.log("Missing IDL accounts")
        break
  
      default:
        console.log(`template type ${templateType} not supported`)
    }
  }
  return { typesView, instructionsView, eventsView, accountsView, textAndTemplate }
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

function generateAccounts(idl: Idl) {
  const trafo = new IdlTransformer(idl);
  const view = trafo.generateViewAccounts();
  const template = readFileSync(
    `${PACKAGE_ROOT}/src/mustaches/accounts.mustache`, "utf8");
  return { template, view };
}

async function generateSolitaTypeScript(paths: Paths, idl: Idl) {
  console.log("Generating TypeScript SDK to %s", paths.tsSolitaDir);

  const gen = new Solita(idl, { formatCode: true });
  await gen.renderAndWriteTo(paths.tsSolitaDir);

  console.log("Success on TS generation!");
}

async function generateSchema(paths: Paths, idl: Idl) {
  console.log("Generating Schema to %s", paths.graphqlDir);

  const gen = new Schema(idl, { formatCode: false });
  await gen.renderAndWriteTo(paths.graphqlDir);

  console.log("Success on Schema generation!");
}