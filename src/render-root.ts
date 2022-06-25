export function renderRootFiles(name: string){
  const Name = name.charAt(0).toUpperCase().concat(name.slice(1))
  let docker: string = 
`version: '2'

services:
  error-indexer:
    build: ../..
    container_name: ${name}-indexer
    volumes:
      - ~/indexer.data:/app/data:rw
      - ~/indexer.discovery:/app/discovery:rw
    extra_hosts:
      - host.docker.internal:host-gateway
    env_file:
      - ../../.env
      - ./.env
    environment:
      - DEX=${name}
    ports:
      - 8080:8080
    # (configure them in .env file)
    #   - LETSENCRYPT_HOST=splerror.api.aleph.cloud
    #   - VIRTUAL_HOST=splerror.api.aleph.cloud
    #   - VIRTUAL_PORT=8080
    network_mode: bridge
`

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
    "build": "tsc -p ./tsconfig.json && npm run postbuild",
    "postbuild": "cp ./src/graphql/schema.graphql ./dist/src/graphql/schema.graphql",
    "test": "echo \\"Error: no test specified\\" && exit 1",
    "up": "docker-compose up -d",
    "up:devnet": "docker-compose -f docker-compose-devnet.yaml --project-name error-devnet up -d"
  },
  "author": "ALEPH.im",
  "license": "ISC",
  "dependencies": {
    "@aleph-indexer/beet": "1.0.0",
    "@aleph-indexer/beet-solana": "1.0.0",
    "@aleph-indexer/core": "1.0.0",
    "@aleph-indexer/layout": "1.0.0",
    "@switchboard-xyz/switchboard-v2": "^0.0.71"
  }
}`

  let run: string = 
`import os from 'os'
import { EventEmitter } from 'events'
import { Settings } from 'luxon'

Settings.defaultZone = 'utc'

import { config } from '@aleph-indexer/core'
import graphQLServer from './src/graphql/index.js'
import { ${Name}Indexer } from './src/indexers/${name}'
import * as v8 from "v8";
import { round } from "lodash-es";

// Disable event emmiter warning
EventEmitter.defaultMaxListeners = 100000

// libuv max threads
const cpus = os.cpus().length
const concurrency = cpus // Math.max(4, Math.min(12, cpus))
process.env.UV_THREADPOOL_SIZE = concurrency as any

console.log('UV_THREADPOOL_SIZE', process.env.UV_THREADPOOL_SIZE)

async function main() {
  console.log(
    'Current max heap size:',
    round(v8.getHeapStatistics().total_available_size / 1024 / 1024),
    'MB')
  await graphQLServer.listen({
    port: config.PORT ? parseInt(config.PORT) : 8080
  })
  const indexer = new ${Name}Indexer()
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

let typesdts: string = 
`export * from '../../types'`

  return {docker, pkg, run, tsconfig, typesdts }
}
