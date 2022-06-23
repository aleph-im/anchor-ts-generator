import { ViewAccounts } from "./types"

export function renderSrcFiles(name: string, accountsView: ViewAccounts | undefined){
  const Name = name.charAt(0).toUpperCase().concat(name.slice(1))
  const NAME = name.toUpperCase()
  let constants: string = 
`export enum ProgramName {
  ${Name} = '${name}',
}

export const ${NAME}_PROGRAM_ID = 'SW1TCH7qEPTdLsDHRgPuMQjbQxKdH2aBStViMFnt64f'
export const ${NAME}_PROGRAM_ID_PK = new PublicKey(${NAME}_PROGRAM_ID)

const DAY = 1000 * 60 * 60 * 24
const START_DATE = Date.now()
const SINCE_DATE = START_DATE - 7 * DAY
export const DOMAIN_CACHE_START_DATE = config.INDEX_START_DATE
  ? Number(config.INDEX_START_DATE)
  : SINCE_DATE`


    let types: string = 
`export * from "../../ts/types.js"
export * from "../../ts/events.js"
export * from "../../ts/instructions.js"
export * from "../../ts/accounts.js"
export { ParsedInstructions } from "../../ts-solita/index.js"
export { InstructionType } from "../../ts/instructions.js"
export { AccountType } from "../../ts/accounts.js"

import {
`
  if(accountsView != undefined) {
    for(let i = 0; i < accountsView.accounts.length; i++){
      types +=
`  ${accountsView.accounts[i].name},
  ${accountsView.accounts[i].name}Args,
`
    }
  }
  types +=
`
} from "../../ts-solita/index.js"

import { InstructionType } from "../../ts/instructions.js"
import { AccountType } from "../../ts/accounts.js"

export enum IndexersType {
`
  if(accountsView != undefined) {
    for(let i = 0; i < accountsView.accounts.length; i++){
      types +=
`  ${accountsView.accounts[i].name}Indexer = '${accountsView.accounts[i].name}Indexer',
`
    }
  }
  types +=
`}

// ------------------- PARSED ------------------

export type InstructionEvent = {
  id: string
  type: InstructionType | undefined
  timestamp: number
  programId: string
  account: string
}

// -------------------------- STATS --------------------------

export type AccountTimeStat = {
  requests: number
  uniqueProgramIds: number
  interval: string
}

export type ${Name}AccountStats = {
  requestsStatsByHour: Record<string, AccountTimeStat>

  requests1h: number
  requests24h: number
  requests7d: number
  requestsTotal: number

  accessingPrograms: Set<string>

  lastRequest?: InstructionEvent
}

export type ${Name}AccountInfo = AccountData & {
  stats: ${Name}AccountStats
}

export type HourlyStats = {
  stats: AccountTimeStat[]
  statsMap: Record<string, AccountTimeStat>
}

export type GlobalOracleStats = {
  totalAccounts: Record<AccountType, number>
  totalRequests: number
  totalUniqueAccessingPrograms: number
}

// -------------------------- ACCOUNTS --------------------------

export type AccountData = {
  name: string
  programId: string
  address: string
  type: AccountType
  data: ${Name}AccountBeetArgs
}

export type ${Name}AccountBeet =
`
  if(accountsView != undefined) {
    for(let i = 0; i < accountsView.accounts.length; i++){
      types +=
`  ${accountsView.accounts[i].name} |
`
    }
  }
  types = types.slice(0, types.length-2)
  types +=
`

export type ${Name}AccountBeetArgs =
`
  if(accountsView != undefined) {
    for(let i = 0; i < accountsView.accounts.length; i++){
      types +=
` ${accountsView.accounts[i].name}Args |
`
    }
  }
  types = types.slice(0, types.length-2)
  types +=
`
`

    return { constants, types }
  }