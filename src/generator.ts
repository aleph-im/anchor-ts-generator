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
import { renderDALFiles } from './render-dal.js'
import { renderDomainFiles } from './render-domain.js'
import { renderLayoutsFiles } from './render-layouts.js'
import { format, Options } from 'prettier'
import { renderApiFiles } from "./render-api.js";
import { renderDiscovererFiles } from "./render-discoverer.js";
import { logError } from './utils/index.js'
import { renderStatsFiles } from "./render-stats.js";

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

export default async function generate(idl: Idl, paths: Paths, toGenerate: TemplateType[], address?: string, ) {
  const Name = toCamelCase(idl.name)
  
  if(!existsSync(paths.outputDir))
    mkdirSync(paths.outputDir)

  if(!existsSync(paths.projectDir))
    mkdirSync(paths.projectDir)
  const { docker, pkg, run, tsconfig, typesdts } = renderRootFiles(idl.name)
  writeFileSync(paths.projectFile('docker-compose.yaml'), docker);
  writeFileSync(paths.projectFile('package.json'), pkg);
  writeFileSync(paths.projectFile('run.ts'), run);
  writeFileSync(paths.projectFile('tsconfig.json'), tsconfig);
  writeFileSync(paths.projectFile('types.d.ts'), typesdts);

  const { typesView, instructionsView, eventsView, accountsView } = generateFromTemplateType(idl, toGenerate)
  console.log(typesView, instructionsView, eventsView, accountsView)

  if(!existsSync(paths.srcDir))
    mkdirSync(paths.srcDir)
  const { constants, types } = renderSrcFiles(Name, idl.name, instructionsView, address)
  try {
    writeFileSync(paths.srcFile('constants'), format(constants, DEFAULT_FORMAT_OPTS));
    writeFileSync(paths.srcFile('types'), format(types, DEFAULT_FORMAT_OPTS));
  } catch (err) {
    console.log(`Failed to format on src folder`)
    logError(err)
  }

  if(!existsSync(paths.apiDir))
    mkdirSync(paths.apiDir)
  await generateSchema(paths, idl);
  const { indexApi, resolversApi, schemaApi, apiTypes } = renderApiFiles(Name, idl.name, instructionsView, accountsView, typesView)
  try {
    writeFileSync(paths.apiFile('index'), format(indexApi, DEFAULT_FORMAT_OPTS));
    writeFileSync(paths.apiFile('resolvers'), format(resolversApi, DEFAULT_FORMAT_OPTS));
    writeFileSync(paths.apiFile('schema'), format(schemaApi, DEFAULT_FORMAT_OPTS));
    writeFileSync(paths.apiFile('types'), format(apiTypes, DEFAULT_FORMAT_OPTS));
  } catch (err) {
    logError(`Failed to format on api folder`)
    logError(err)
  }

  if(!existsSync(paths.dalDir))
    mkdirSync(paths.dalDir)
  const { eventDal } = renderDALFiles()
  try {
    writeFileSync(paths.dalFile('event'), format(eventDal, DEFAULT_FORMAT_OPTS));
  } catch (err) {
    logError(`Failed to format on dal folder`)
    logError(err)
  }

  if(!existsSync(paths.domainDir))
    mkdirSync(paths.domainDir)
  const { account, worker, mainDomain } = renderDomainFiles(Name, idl.name, accountsView)
  try {
    writeFileSync(paths.domainFile('account'), format(account, DEFAULT_FORMAT_OPTS));
    writeFileSync(paths.domainFile('worker'), format(worker, DEFAULT_FORMAT_OPTS));
    writeFileSync(paths.domainFile('main'), format(mainDomain, DEFAULT_FORMAT_OPTS));
  } catch (err) {
    logError(`Failed to format on domain folder`)
    logError(err)
  }

  if(!existsSync(paths.statsDir))
    mkdirSync(paths.statsDir)
  const { timeSeries, timeSeriesAggregator, statsAggregator } = renderStatsFiles(Name, idl.name, instructionsView)
  try {
    writeFileSync(paths.statsFile('timeSeries'), format(timeSeries, DEFAULT_FORMAT_OPTS));
    writeFileSync(paths.statsFile('timeSeriesAggregator'), format(timeSeriesAggregator, DEFAULT_FORMAT_OPTS));
    writeFileSync(paths.statsFile('statsAggregator'), format(statsAggregator, DEFAULT_FORMAT_OPTS));
  } catch (err) {
    logError(`Failed to format on domain folder`)
    logError(err)
  }

  if(!existsSync(paths.discovererDir))
    mkdirSync(paths.discovererDir)
  const { discoverer } = renderDiscovererFiles(Name, idl.name)
  try {
    writeFileSync(paths.discovererFile(idl.name), format(discoverer, DEFAULT_FORMAT_OPTS));
  } catch (err) {
    logError(`Failed to format on discoverer folder`)
    logError(err)
  }

  if(!existsSync(paths.utilsDir))
    mkdirSync(paths.utilsDir)
  if(!existsSync(paths.layaoutsDir))
    mkdirSync(paths.layaoutsDir)
  const { accountLayouts, ixLayouts, indexLayouts } = renderLayoutsFiles(instructionsView, accountsView);
  try {
    if(accountLayouts) {
      writeFileSync(paths.layoutsFile('accounts'), format(accountLayouts, DEFAULT_FORMAT_OPTS));
    }
    if(ixLayouts) {
      writeFileSync(paths.layoutsFile('instructions'), format(ixLayouts, DEFAULT_FORMAT_OPTS));
    }
    writeFileSync(paths.layoutsFile('index'), format(indexLayouts, DEFAULT_FORMAT_OPTS));
  } catch (err) {
    console.log(`Failed to format on layouts folder`)
    logError(err)
  }
  
  if(!existsSync(paths.tsSolitaDir))
    mkdirSync(paths.tsSolitaDir)
  await generateSolitaTypeScript(paths, idl);

  if(!existsSync(paths.parsersDir))
    mkdirSync(paths.parsersDir)
  const { event } = renderParsersFiles(instructionsView)
  try {
    writeFileSync(paths.parsersFile('event'), format(event, DEFAULT_FORMAT_OPTS));
  } catch (err) {
    console.log(`Failed to format on parser folder`)
    logError(err)
  }
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
          textAndTemplate.push([templateType, text])
          typesView = view
        }
        else console.log("Missing IDL types")
        break
  
      case TemplateType.Instructions:
        if (idl.instructions) {
          const { template, view } = generateInstructions(idl)
          const text = Mustache.render(template, view);
          textAndTemplate.push([templateType, text.slice(0, text.length-2)])
          instructionsView = view
        }
        else console.log("Missing IDL instructions")
        break
  
      case TemplateType.Events:
        if (idl.events){
          const { template, view } = generateEvents(idl)
          const text = Mustache.render(template, view)
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
  console.log("Generating Schema to %s", paths.apiDir);

  const gen = new Schema(idl, { formatCode: false });
  await gen.renderAndWriteTo(paths.apiDir);

  console.log("Success on Schema generation!");
}

function toCamelCase(str: string){
  let wordArr = str.split(/[-_]/g);
  let camelCase = ""
  for (let i in wordArr){
    camelCase += wordArr[i].charAt(0).toUpperCase() + wordArr[i].slice(1);
  }
  return camelCase;
}