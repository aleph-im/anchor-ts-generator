// @ts-check
("use strict");

const PROGRAM_NAME = "club_program_v020";
const PROGRAM_ID = "lololololololo";

const path = require("path");
const generatedIdlDir = path.join(__dirname, "..", "idl");
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

const { spawn } = require("child_process");
const { Solita, Schema } = require("@metaplex-foundation/solita");
const { writeFile } = require("fs/promises");


generateTypeScriptSDK().then(async () => { await generateSchema() });

async function generateTypeScriptSDK() {
  console.error("Generating TypeScript SDK to %s", generatedSDKDir);
  const generatedIdlPath = path.join(generatedIdlDir, `${PROGRAM_NAME}.json`);

  const idl = require(generatedIdlPath);
  if (idl.metadata?.address == null) {
    idl.metadata = { ...idl.metadata, address: PROGRAM_ID };
    await writeFile(generatedIdlPath, JSON.stringify(idl, null, 2));
  }
  const gen = new Solita(idl, { formatCode: true });
  await gen.renderAndWriteTo(generatedSDKDir);

  console.error("Success!");
}

async function generateSchema() {
  await sleep(700); // weird but easy functional solution to manage multithread processes
  console.error("Generating Schema to %s", generatedSchemaDir);
  const generatedIdlPath = path.join(generatedIdlDir, `${PROGRAM_NAME}.json`);

  const idl = require(generatedIdlPath);
  if (idl.metadata?.address == null) {
    idl.metadata = { ...idl.metadata, address: PROGRAM_ID };
    await writeFile(generatedIdlPath, JSON.stringify(idl, null, 2));
  }
  const gen = new Schema(idl, { formatCode: false });
  await gen.renderAndWriteTo(generatedSchemaDir);

  console.error("Success!");
  process.exit(0);
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
