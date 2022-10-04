export function renderRootFiles(filename: string){
  const name = filename.toLowerCase()

  let docker: string = 
`version: '2'

services:
  ${name}:
    build: ../..
    volumes:
      - ~/indexer.data:/app/data:rw
    extra_hosts:
      - host.docker.internal:host-gateway
    env_file:
      - ../../.env
      - ./.env
    environment:
      - INDEXER=${name}
      - LETSENCRYPT_HOST=port.api.aleph.cloud
      - VIRTUAL_HOST=port.api.aleph.cloud
      - VIRTUAL_PORT=8080
      - SOLANA_RPC=http://solrpc1.aleph.cloud:7725/
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
    "build": "tsc -p ./tsconfig.json",
    "clean:ts": "rm -rf ./dist",
    "clean:all": "rm -rf ./node_modules && rm -rf ./dist && rm -rf package-lock.json",
    "start": "npm i && npm link @aleph-indexer/core @aleph-indexer/framework && npm run build && node ./dist/run.js",
    "test": "echo \\"Error: no test specified\" && exit 1",
    "up": "docker-compose up -d",
    "up:devnet": "docker-compose -f docker-compose-devnet.yaml --project-name error-devnet up -d"
  },
  "author": "ALEPH.im",
  "license": "ISC",
  "dependencies": {
    "@aleph-indexer/core": "file:../../../solana-indexer-framework/packages/core/dist",
    "@aleph-indexer/framework": "file:../../../solana-indexer-framework/packages/framework/dist",
    "@metaplex-foundation/beet": "0.7.1",
    "@metaplex-foundation/beet-solana": "0.4.0",
    "@solana/spl-token": "0.3.5",
    "@solana/web3.js": "1.61.1",
    "bs58": "5.0.0"
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
import { config } from '@aleph-indexer/core'
import SDK, { TransportType } from '@aleph-indexer/framework'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function main() {
  const workerDomainPath = path.join(__dirname, './src/domain/worker.js')
  const mainDomainPath = path.join(__dirname, './src/domain/main.js')
  const apiSchemaPath = path.join(__dirname, './src/api/index.js')

  const instances = Number(config.INDEXER_INSTANCES || 2)
  const apiPort = Number(config.INDEXER_API_PORT || 8080)
  const tcpPort = Number(config.INDEXER_TCP_PORT) || undefined
  const tcpUrls = config.INDEXER_TCP_URLS || undefined

  const projectId = '${name}'
  const dataPath = config.INDEXER_DATA_PATH || undefined // 'data'
  const transport =
    (config.INDEXER_TRANSPORT as TransportType) || TransportType.LocalNet

  if (!projectId) throw new Error('INDEXER_NAMESPACE env var must be provided ')

  await SDK.init({
    projectId,
    transport,
    transportConfig,
    apiPort,
    indexer: {
      dataPath,
      tcpPort,
      tcpUrls,
      main: {
        domainPath: mainDomainPath,
        apiSchemaPath,
      },
      worker: {
        instances,
        domainPath: workerDomainPath,
      },
    }
  })
}

main()
`

  let tsconfig: string = 
`{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
      "outDir": "dist",
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
`declare module '@solana/web3.js' {
  interface Connection {
    public _rpcRequest(method: string, args: any[]): Promise<any>
    public _rpcBatchRequest(requests: any[]): Promise<any>
  }
}

declare module 'graphql-type-long'
`

  return {docker, pkg, run, tsconfig, typesdts }
}
