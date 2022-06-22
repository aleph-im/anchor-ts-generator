// @ts-check
("use strict");

const { Solita, Schema } = require("@metaplex-foundation/solita");
const path = require("path");

const PROGRAM_NAME = "switchboard_v2";

const idlDir = path.join(__dirname, "..", "idl");
const generatedSDKDir = path.join(
  __dirname,
  "..",
  "output",
  PROGRAM_NAME,
  "solita-ts"
);

const generatedSchemaDir = path.join(
  __dirname,
  "..",
  "output",
  PROGRAM_NAME,
  "indexer",
  "src",
  "graphql",
  "schema"
);

async function generateTypeScriptSDK() {
  console.error("Generating TypeScript SDK to %s", generatedSDKDir);
  const idlPath = path.join(idlDir, `${PROGRAM_NAME}.json`);
  const idl = require(idlPath);

  const gen = new Solita(idl, { formatCode: true });
  await gen.renderAndWriteTo(generatedSDKDir);

  console.log("Success on TS generation!");
}

async function generateSchema() {
  console.error("Generating Schema to %s", generatedSchemaDir);
  const idlPath = path.join(idlDir, `${PROGRAM_NAME}.json`);
  const idl = require(idlPath);

  const gen = new Schema(idl, { formatCode: false });
  await gen.renderAndWriteTo(generatedSchemaDir);

  console.log("Success on Schema generation!");
}

generateTypeScriptSDK();
generateSchema();
