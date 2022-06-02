export function renderRootFiles(name: string){
    let config: string = 
`import dotenv from 'dotenv-defaults'
dotenv.config()

export default process.env`
    let pkg: string = 
`{
  "name": "@aleph-indexer/${name}",
  "version": "1.0.0",
  "description": "",
  "main": "dist/index.js",
  "module": "dist/index.js",
  "types": "dist/index.d.js",
  "type": "module",
  "scripts": {
    "test": "echo Error: no test specified && exit 1"
  },
  "author": "ALEPH.im",
  "license": "ISC",
  "dependencies": {
    "@aleph-indexer/core": "1.0.0",
    "@orca-so/sdk": "^1.1.0",
    "@solana/web3.js": "^1.16.1",
    "cors": "^2.8.5",
    "dotenv": "^10.0.0",
    "dotenv-defaults": "^2.0.2",
    "express": "^4.17.1",
    "express-graphql": "^0.12.0",
    "graphql-tools": "^7.0.5",
    "level": "^7.0.0"
  }
}`

    let run: string = "" //Insert code here

    let tsconfig: string = 
`{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "dist"
  },
  "exclude": [
    "node_modules",
    "dist",
    "scripts",
    "tests",
    "**/*.spec.ts",
    "**/*.test.ts",
    "**/__tests__",
    "**/__mocks__"
  ]
}`

    return { config, pkg, run, tsconfig }
  }
