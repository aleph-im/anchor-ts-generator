import { ViewInstructions } from "./types"

export function renderSrcFiles(Name: string, filename: string, instructionsView: ViewInstructions | undefined, address?: string){
  const NAME = filename.toUpperCase()
  const name = filename.toUpperCase()

  let constants = ''
  let types = ''

  if(instructionsView) {
  constants = 
`import { PublicKey } from '@solana/web3.js'
import { config } from '../../solana-indexer-framework/packages/core/src'
import { InstructionType } from './types.js'

export enum ProgramName {
  ${Name} = '${name}',
}

// @todo: This is just an example, to use it on a type guard on stats folder 
export const collectionEvent1 = [
  InstructionType.${instructionsView.instructions[0].name},
  InstructionType.${instructionsView.instructions[1].name},
]

export const collectionEvent1Whitelist = new Set(collectionEvent1)

export const collectionEvent2 = [
  InstructionType.${instructionsView.instructions[2].name},
  InstructionType.${instructionsView.instructions[3].name},
]

export const collectionEvent2Whitelist = new Set(collectionEvent1)

const DAY = 1000 * 60 * 60 * 24
const START_DATE = Date.now()
const SINCE_DATE = START_DATE - 7 * DAY
export const DOMAIN_CACHE_START_DATE = config.INDEX_START_DATE
  ? Number(config.INDEX_START_DATE)
  : SINCE_DATE
`
  if(address){
    constants += 
`
export const ${NAME}_PROGRAM_ID = '${address}'
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

    types += 
`export * from './utils/layouts/index.js'
`
    types +=
`
import { AccountStats } from '../../solana-indexer-framework/packages/framework'
import { AccountType, ParsedEvents, ParsedAccountsData } from './utils/layouts/index.js'

export type ${Name}AccountInfo = {
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

// You should group different related instructions to process their information together
export type ${Name}Info = EventType1Info & EventType2Info

export type EventType1Info = {
  customProperties1: number
}

export type EventType2Info = {
  customProperties2: number
}

export type ${Name}Stats = {
  requestsStatsByHour: Record<string, AccountTimeStat>
  last1h: ${Name}Info
  last24h: ${Name}Info
  last7d: ${Name}Info
  total: ${Name}Info
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
  info: ${Name}AccountInfo
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