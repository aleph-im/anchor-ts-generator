export function renderRootFiles(filename: string){
  const NAME = filename.toUpperCase()

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
    "build": "tsc -p ./tsconfig.json && npm run postbuild",
    "postbuild": "cp ./src/graphql/schema.graphql ./dist/src/graphql/schema.graphql",
    "test": "echo \\"Error: no test specified\\" && exit 1",
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
    "graphql-tools": "8.3.6"
  },
  "devDependencies": {
    "@types/luxon": "^3.0.1"
  }
}`

  let run: string = 
`import { fileURLToPath } from 'url'
import path from 'path'
import { config } from '../../../solana-indexer-framework/packages/core/src'
import SDK, { TransportType } from '../../../solana-indexer-framework/packages/framework'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function main() {
  const indexerDomainPath = path.join(__dirname, './src/domain/indexer.js')
  const mainDomainPath = path.join(__dirname, './src/domain/main.js')
  const apiPath = path.join(__dirname, './src/api/index.js')

  const projectId = config.${NAME}_ID
  if (!projectId) throw new Error('${NAME}_ID env var must be provided ')

  await SDK.init({
    projectId,
    transport: TransportType.LocalNet,
    main: {
      apiPath,
      domainPath: mainDomainPath,
    },
    indexer: {
      instances: 4,
      domainPath: indexerDomainPath,
    },
    // parser: {
    //   instances: 1,
    // },
    // fetcher: {
    //   instances: 1,
    // },
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
