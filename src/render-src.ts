import { ViewAccounts, ViewInstructions } from "./types"

export function renderSrcFiles(name: string, accountsView: ViewAccounts | undefined, instructionsView: ViewInstructions | undefined){
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
`export * from './layouts/ts/instructions.js'
export { ParsedInstructions } from './layouts/solita/index.js'
export { InstructionType } from './layouts/ts/instructions.js'
`
    if(accountsView) {
      types += 
`export { AccountType } from './layouts/ts/accounts.js'
import {
  ParsedAccountInfo
} from '@aleph-indexer/core'
`
      types += 
`
import {
`
      for(let i = 0; i < accountsView.accounts.length; i++){
        types +=
`\t${accountsView.accounts[i].name},
\t${accountsView.accounts[i].name}Args,
`
      }
      types +=
`\tParsedAccountsData,
\tParsedInstructions
} from './layouts/solita/index.js'

import { InstructionType } from './layouts/ts/instructions.js'

export enum IndexersType {
`
      for(let i = 0; i < accountsView.accounts.length; i++){
        types +=
`\t${accountsView.accounts[i].name}Indexer = '${accountsView.accounts[i].name}Indexer',
`
      }
      types +=
`}

export type SwitchboardAccountInfo = ParsedAccountInfo<AccountType, ParsedAccountsData>

// ------------------- PARSED ------------------

export type InstructionEvent = {
  id: string
  type: InstructionType | undefined
  timestamp: number
  programId: string
  account: string
  accounts: Record<string, string>
  data: ParsedInstructions
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

export type ${Name}AccountInfo = ParsedAccountInfo<AccountType, ParsedAccountsData>

export type HourlyStats = {
  stats: AccountTimeStat[]
  statsMap: Record<string, AccountTimeStat>
}

export type GlobalStats = {
  totalAccounts: Record<AccountType, number>
  totalRequests: number
  totalUniqueAccessingPrograms: number
}

// -------------------------- ACCOUNTS --------------------------

export type AccountData = ParsedAccountInfo<AccountType, ParsedAccountsData> & {
  stats: ${Name}AccountStats
}
`
      types += `
export type ${Name}AccountBeet =
`
      for(let i = 0; i < accountsView.accounts.length; i++){
        types +=
`  ${accountsView.accounts[i].name} |
`
      }
      types = types.slice(0, types.length-2)
  

        types +=`
export type ${Name}AccountBeetArgs =
`
      for(let i = 0; i < accountsView.accounts.length; i++){
        types +=
` ${accountsView.accounts[i].name}Args |
`
      }
      types = types.slice(0, types.length-2)
      types += '\n'
    }
  }
  return { constants, types }
}