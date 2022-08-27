import { ViewInstructions } from "./types"

export function renderSrcFiles(name: string, instructionsView: ViewInstructions | undefined){
  const Name = name.charAt(0).toUpperCase().concat(name.slice(1))
  const NAME = name.toUpperCase()
  const _name = name.toLowerCase()

  let constants: string = 
`import { PublicKey } from '@solana/web3.js'
import { config } from '@aleph-indexer/core'

export enum ProgramName {
  ${Name} = '${_name}',
}

const DAY = 1000 * 60 * 60 * 24
const START_DATE = Date.now()
const SINCE_DATE = START_DATE - 7 * DAY
export const DOMAIN_CACHE_START_DATE = config.INDEX_START_DATE
  ? Number(config.INDEX_START_DATE)
  : SINCE_DATE
`
  if(name.length == 43){
    constants += 
`
export const ${NAME}_PROGRAM_ID = ${NAME}
export const ${NAME}_PROGRAM_ID_PK = new PublicKey(${NAME}_PROGRAM_ID)
`
  }
  else{
    constants += 
`
export const ${NAME}_PROGRAM_ID = 'WRITE YOUR PROGRAM PUBKEY HERE'
export const ${NAME}_PROGRAM_ID_PK = new PublicKey(${NAME}_PROGRAM_ID)
`
  }

  let types: string = ''
  if(instructionsView && instructionsView.instructions.length > 0) {
    types += 
`export * from './layouts/index.js'
`
    types +=
`
import { AccountStats } from '@aleph-indexer/framework'
import { AccountType, ParsedEvents, ParsedAccountsData } from './layouts/index.js'

export type AccountInfo = {
  name: string
  programId: string
  address: string
  type: AccountType
  data: ParsedAccountsData
}

// -------------------------- STATS --------------------------

export type AccountTimeStat = {
  requests: number
  uniqueProgramIds: number
  interval: string
}

export type ${Name}Stats = {
  requestsStatsByHour: Record<string, AccountTimeStat>

  requests1h: number
  requests24h: number
  requests7d: number
  requestsTotal: number

  accessingPrograms: Set<string>

  lastRequest?: ParsedEvents
}

export type HourlyStats = {
  stats: AccountTimeStat[]
  statsMap: Record<string, AccountTimeStat>
}

export type Global${Name}Stats = {
  totalAccounts: Record<AccountType, number>
  totalRequests: number
  totalUniqueAccessingPrograms: number
}

export type ${Name}ProgramData = {
  info: AccountInfo
  stats?: ${Name}Stats
}

export type AccountTypesGlobalStats = {
  type: AccountType
  stats: AccountStats<Global${Name}Stats>
}
` 
  }
  return { constants, types }
}