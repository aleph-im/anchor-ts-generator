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
    "@aleph-indexer/beet": "1.0.0",
    "@aleph-indexer/beet-solana": "1.0.0",
    "@aleph-indexer/core": "1.0.0",
    "@aleph-indexer/layout": "1.0.0"
  }
}`

  let run: string = 
`import { fileURLToPath } from 'url'
import path from 'path'
import { config } from '@aleph-indexer/core'
import SDK, { TransportType } from '@aleph-indexer/framework'

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
