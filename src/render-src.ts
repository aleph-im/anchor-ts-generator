export function renderSrcFiles(name: string){
  const Name = name.charAt(0).toUpperCase().concat(name.slice(1))
  const NAME = name.toUpperCase()
  let constants: string = 
`import config from '../config.js'
import { PublicKey } from '@solana/web3.js'

export enum ProgramName {
  ${Name} = '${name}',
}

export const ${NAME}_PROGRAM_ID =
  'SW1TCH7qEPTdLsDHRgPuMQjbQxKdH2aBStViMFnt64f'
export const ${NAME}_PROGRAM_ID_PK = new PublicKey(${NAME}_PROGRAM_ID)

export const ${NAME}_PERMISSIONLESS_QUEUE =
  '5JYwqvKkqp35w8Nq3ba4z1WYUeJQ1rB36V8XvaGp6zn1'
export const ${NAME}_PERMISSIONLESS_QUEUE_PK = new PublicKey(
  ${NAME}_PERMISSIONLESS_QUEUE,
)

export const ${NAME}_PERMISSIONLESS_CRANK =
  'BKtF8yyQsj3Ft6jb2nkfpEKzARZVdGgdEPs6mFmZNmbA'
export const ${NAME}_PERMISSIONLESS_CRANK_PK = new PublicKey(
  ${NAME}_PERMISSIONLESS_CRANK,
)

export const ${NAME}_PERMISSIONED_QUEUE =
  '3HBb2DQqDfuMdzWxNk1Eo9RTMkFYmuEAd32RiLKn9pAn'
export const ${NAME}_PERMISSIONED_QUEUE_PK = new PublicKey(
  ${NAME}_PERMISSIONED_QUEUE,
)

export const ${NAME}_PERMISSIONED_CRANK =
  'GdNVLWzcE6h9SPuSbmu69YzxAj8enim9t6mjzuqTXgLd'
export const ${NAME}_PERMISSIONED_CRANK_PK = new PublicKey(
  ${NAME}_PERMISSIONED_CRANK,
)

// @note: Indexed cache start date

const DAY = 1000 * 60 * 60 * 24
const START_DATE = Date.now()
const SINCE_DATE = START_DATE - 7 * DAY
export const DOMAIN_CACHE_START_DATE = config.INDEX_START_DATE
  ? Number(config.INDEX_START_DATE)
  : SINCE_DATE
`

    let solanarpc: string = 
`import config from '../config.js'
import { PARSERS, SolanaRPCRoundRobin } from '@aleph-indexer/core'

export const solanaRPCRoundRobin = new SolanaRPCRoundRobin(
  [...(config.SOLANA_RPC || '').split(','), 'https://aleph.genesysgo.net'],
  PARSERS,
  false,
)

export const solanaMainPublicRPCRoundRobin = new SolanaRPCRoundRobin(
  config.SOLANA_MAIN_PUBLIC_RPC
    ? config.SOLANA_MAIN_PUBLIC_RPC.split(',')
    : [
        // @note: All pools has historical data
        'https://api.mainnet-beta.solana.com',
        // 'https://free.rpcpool.com', this is the same cluster than "api.mainnet-beta.solana.com"
      ],
  PARSERS,
  true,
)

export const solana = solanaRPCRoundRobin.getProxy()
export const solanaMainPublic = solanaMainPublicRPCRoundRobin.getProxy()`

    let types: string = 
`export * from "../../ts/types.js"
export * from "../../ts/events.js"
export * from "../../ts/instructions.js"

// ------------------- PARSED ------------------

export type OracleRawEvent = any

export type OracleEvent = {
  id: string
  type: InstructionType | undefined
  timestamp: number
  programId: string
  queue: string
  aggregator: string
}

// -------------------------- DOMAIN --------------------------

export type AggregatorInfo = {
  name: string
  programId: string
  oracleQueue: string
  address: string
  permissioned: boolean
}

export type AggregatorTimeStat = {
  aggregator: string
  requests: number
  updates: number
  uniqueProgramIds: number
  interval: string
}

export type AggregatorStats = {
  requestsStatsByHour: Record<string, AggregatorTimeStat>

  requests1h: number
  requests24h: number
  requests7d: number
  requestsTotal: number

  updates1h: number
  updates24h: number
  updates7d: number
  updatesTotal: number

  activelyUsed: boolean
  accessingPrograms: Set<string>

  lastRequest?: OracleEvent
}

export type OracleProgramData = AggregatorInfo & {
  stats: AggregatorStats
}

export type HourlyOracleStats = {
  stats: AggregatorTimeStat[]
  statsMap: Record<string, AggregatorTimeStat>
}

export type GlobalOracleStats = {
  totalAggregators: number
  totalActivelyUsedAggregators: number
  totalRequests: number
  totalUpdates: number
  totalUniqueAccessingPrograms: number
}
`

    return { constants, solanarpc, types }
  }