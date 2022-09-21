export function renderRootFiles(filename: string){
  const name = filename.toLowerCase()

  let docker: string = 
`version: '2'

services:
  error-indexer:
    build: ../..
    container_name: ${filename}-indexer
    volumes:
      - ~/indexer.data:/app/data:rw
      - ~/indexer.discovery:/app/discovery:rw
    extra_hosts:
      - host.docker.internal:host-gateway
    env_file:
      - ../../.env
      - ./.env
    environment:
      - DEX=${filename}
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
  "name": "@aleph-indexer/${filename}",
  "version": "1.0.0",
  "description": "",
  "main": "dist/index.js",
  "module": "dist/index.js",
  "types": "dist/index.d.js",
  "type": "module",
  "scripts": {
    "start": "npm run build && node ./dist/run.js",
    "build": "tsc -p ./tsconfig.json && npm run postbuild",
    "build:ts": "tsc -p ./tsconfig.json",
    "clean:ts": "rm -rf ./dist",
    "clean:all": "rm -rf ./node_modules && rm -rf ./dist && rm -rf package-lock.json",
    "postbuild": "cp ./src/api/schema.graphql ./dist/src/api/schema.graphql",
    "test": "echo \"Error: no test specified\" && exit 1",
    "up": "docker-compose up -d",
    "up:devnet": "docker-compose -f docker-compose-devnet.yaml --project-name error-devnet up -d"
  },
  "author": "ALEPH.im",
  "license": "ISC",
  "dependencies": {
    "@metaplex-foundation/beet": "0.6.1",
    "@metaplex-foundation/beet-solana": "0.3.1",
    "@solana/web3.js": "1.61.1",
    "bs58": "5.0.0",
    "graphql": "16.6.0",
    "graphql-tools": "8.3.6",
    "@aleph-indexer/core": "1.0.0",
    "@aleph-indexer/framework": "1.0.0"
  },
  "devDependencies": {
    "@types/luxon": "^3.0.1",
    "@types/node": "^18.7.18",
    "typescript": "^4.8.3"
  }
}`

  let run: string = 
`import { fileURLToPath } from 'url'
import path from 'path'
import SDK, { TransportType } from '@aleph-indexer/framework'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function main() {
  const indexerDomainPath = path.join(__dirname, './src/domain/indexer.js')
  const mainDomainPath = path.join(__dirname, './src/domain/main.js')
  const apiSchemaPath = path.join(__dirname, './src/api/index.js')

  await SDK.init({
    ${name},
    transport: TransportType.LocalNet,
    indexer: {
      main: {
        domainPath: mainDomainPath,
        apiSchemaPath,
      },
      worker: {
        domainPath: indexerDomainPath,
        instances: 4,
      },
      // parser: {
      //   instances: 1,
      // },
      // fetcher: {
      //   instances: 1,
      // },
    }
  })
}

main()
`

  let tsconfig: string = 
`{
  "extends": "../solana-indexer-framework/tsconfig.json",
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
