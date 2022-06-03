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

    let run: string = 
`import os from 'os'
import { EventEmitter } from 'events'
import { Settings } from 'luxon'

Settings.defaultZone = 'utc'

import config from './config.js'
import { graphQLServer } from './src/graphql/index.js'
import { SPLTokenIndexer } from './src/indexers/token.js'
import { discoveryFn } from './src/utils/discovery.js'

// Disable event emmiter warning
EventEmitter.defaultMaxListeners = 100000

// max old heap mem size
process.env.NODE_OPTIONS = '--max-old-space-size=8192' // 8gb

// libuv max threads
const cpus = os.cpus().length
const concurrency = cpus // Math.max(4, Math.min(12, cpus))
process.env.UV_THREADPOOL_SIZE = concurrency as any

console.log('UV_THREADPOOL_SIZE', process.env.UV_THREADPOOL_SIZE)
console.log('NODE_OPTIONS', process.env.NODE_OPTIONS)

async function main() {
  graphQLServer.start(config.PORT ? parseInt(config.PORT) : 8080)
  const indexer = new SPLTokenIndexer(discoveryFn)
  await indexer.init()
  await indexer.run()
}

main()

process.on('uncaughtException', (e) => {
  console.log('uncaughtException', e)
})

process.on('unhandledRejection', (e) => {
  console.log('unhandledRejection', e)
})`

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
