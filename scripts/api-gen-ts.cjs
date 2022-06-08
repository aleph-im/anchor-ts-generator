// @ts-check
("use strict");

const PROGRAM_NAME = "switchboard_v2";
const PROGRAM_ID = "D7ko992PKYLDKFy3fWCQsePvWF3Z7CmvoDHnViGf8bfm";

const path = require("path");
const generatedIdlDir = path.join(__dirname, "..", "idl");
const generatedSDKDir = path.join(
  __dirname,
  "..",
  "generated",
  PROGRAM_NAME,
  "ts"
);

const generatedSchemaDir = path.join(
  __dirname,
  "..",
  "generated",
  PROGRAM_NAME,
  "schema"
);

const { spawn } = require("child_process");
const { Solita, Schema } = require("@metaplex-foundation/solita");
const { writeFile } = require("fs/promises");

const anchor = spawn("anchor", ["build", "--idl", generatedIdlDir])
  .on("error", (err) => {
    console.error(err);
    // @ts-ignore this err does have a code
    if (err.code === "ENOENT") {
      console.error(
        "Ensure that `anchor` is installed and in your path, see:\n  https://project-serum.github.io/anchor/getting-started/installation.html#install-anchor\n"
      );
    }
    process.exit(1);
  })
  .on("exit", () => {
    console.error(
      "IDL written to: %s",
      path.join(generatedIdlDir, `${PROGRAM_NAME}.json`)
    );
    generateTypeScriptSDK();
    generateSchema();
  });

anchor.stdout.on("data", (buf) => console.log(buf.toString("utf8")));
anchor.stderr.on("data", (buf) => console.error(buf.toString("utf8")));

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
