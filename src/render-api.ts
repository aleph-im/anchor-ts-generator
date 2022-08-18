import { ViewAccounts, ViewInstructions } from "./types"

export function renderApiFiles(instructions: ViewInstructions | undefined, accounts: ViewAccounts | undefined){
    let apiTypes: string = 
`import { GraphQLBoolean, GraphQLInt } from 'graphql'
import {
  GraphQLObjectType,
  GraphQLString,
  GraphQLEnumType,
  GraphQLNonNull,
  GraphQLList,
  GraphQLInterfaceType,
  GraphQLUnionType,
} from 'graphql'
import { GraphQLBigNumber, GraphQLLong } from '@aleph-indexer/core'
import { InstructionType, AccountType } from '../types.js'

// ------------------- STATS ---------------------------
/*
export const AggregatorInfo = new GraphQLObjectType({
  name: 'AggregatorInfo',
  fields: {
    name: { type: new GraphQLNonNull(GraphQLString) },
    programId: { type: new GraphQLNonNull(GraphQLString) },
    oracleQueue: { type: new GraphQLNonNull(GraphQLString) },
    address: { type: new GraphQLNonNull(GraphQLString) },
    permissioned: { type: new GraphQLNonNull(GraphQLBoolean) },
  },
})
*/

export const AccountsEnum = new GraphQLEnumType({
  name: 'AccountsEnum',
  values: {`
if(accounts){
  for(const account of accounts.accounts){
    apiTypes += `
    ${account.name}: { value: '${account.name}' },`
  }
  apiTypes += ` },
})

`

  for(const account of accounts.accounts){
  apiTypes += `
export const ${account.name} = new GraphQLObjectType({
  name: '${account.name}',
  isTypeOf: (item) => item.type === AccountType.${account.name},
  fields: {`
  for(const field of account.data.fields){
    apiTypes += `
    ${field.name}: { type: new GraphQLNonNull(GraphQLString) },`
  }
  apiTypes +=
` },
})
`
  }

  apiTypes +=
`export const ParsedAccountsData = new GraphQLUnionType({
    name: "ParsedAccountsData",
    types: [`
    for(const account of accounts.accounts){
      apiTypes += `
      ${account.name}, `
    }
    apiTypes += `
    ],
});
  
`
}

apiTypes += `export const SwitchboardAccountsInfo = new GraphQLObjectType({
  name: 'SwitchboardAccountsInfo',
  fields: {
    name: { type: new GraphQLNonNull(GraphQLString) },
    type: { type: new GraphQLNonNull(AccountsEnum) },
    address: { type: new GraphQLNonNull(GraphQLString) },
    programId: { type: new GraphQLNonNull(GraphQLString) },
    data: { type: new GraphQLNonNull(ParsedAccountsData) },
  },
})

export const GlobalStatsInfo = new GraphQLObjectType({
  name: 'GlobalStatsInfo',
  fields: {
    totalAggregators: { type: new GraphQLNonNull(GraphQLBigNumber) },
    totalActivelyUsedAggregators: {
      type: new GraphQLNonNull(GraphQLBigNumber),
    },
    totalRequests: { type: new GraphQLNonNull(GraphQLBigNumber) },
    totalUpdates: { type: new GraphQLNonNull(GraphQLBigNumber) },
    totalUniqueAccessingPrograms: {
      type: new GraphQLNonNull(GraphQLBigNumber),
    },
  },
})

export const AggregatorStats = new GraphQLObjectType({
  name: 'AggregatorStats',
  fields: {
    last1h: { type: ParsedAccountsData },
    last24h: { type: ParsedAccountsData },
    last7d: { type: ParsedAccountsData },
    total: { type: ParsedAccountsData },

    //requestsStatsByHour: { type: Record<string, AggregatorTimeStat> },
    requests1h: { type: new GraphQLNonNull(GraphQLInt) },
    requests24h: { type: new GraphQLNonNull(GraphQLInt) },
    requests7d: { type: new GraphQLNonNull(GraphQLInt) },
    requestsTotal: { type: new GraphQLNonNull(GraphQLInt) },
    updates1h: { type: new GraphQLNonNull(GraphQLInt) },
    updates24h: { type: new GraphQLNonNull(GraphQLInt) },
    updates7d: { type: new GraphQLNonNull(GraphQLInt) },
    updatesTotal: { type: new GraphQLNonNull(GraphQLInt) },
    activelyUsed: { type: new GraphQLNonNull(GraphQLBoolean) },
    //accessingPrograms: { type: Set<string> },
  },
})

// ------------------- AGGREGATOR --------------------------

export const Aggregator = new GraphQLObjectType({
  name: 'Aggregator',
  fields: {
    name: { type: new GraphQLNonNull(GraphQLString) },
    programId: { type: new GraphQLNonNull(GraphQLString) },
    oracleQueue: { type: new GraphQLNonNull(GraphQLString) },
    address: { type: new GraphQLNonNull(GraphQLString) },
    permissioned: { type: new GraphQLNonNull(GraphQLBoolean) },
    stats: { type: AggregatorStats },
  },
})

export const Reserves = new GraphQLList(Aggregator)

export const LendingMarkets = new GraphQLList(GraphQLString)

// ------------------- EVENTS --------------------------

export const InstructionTypes = new GraphQLEnumType({
  name: 'InstructionType',
  values: {
    aggregatorAddJob: { value: 'aggregatorAddJob' },
    aggregatorInit: { value: 'depositReserveLiquidity' },
    aggregatorLock: { value: 'aggregatorLock' },
    aggregatorOpenRound: { value: 'aggregatorOpenRound' },
    aggregatorRemoveJob: { value: 'aggregatorRemoveJob' },
    aggregatorSaveResult: { value: 'aggregatorSaveResult' },
    aggregatorSetAuthority: { value: 'aggregatorSetAuthority' },
    aggregatorSetBatchSize: { value: 'aggregatorSetBatchSize' },
    aggregatorSetHistoryBuffer: { value: 'aggregatorSetHistoryBuffer' },
    aggregatorSetMinJobs: { value: 'aggregatorSetMinJobs' },
    aggregatorSetMinOracles: { value: 'aggregatorSetMinOracles' },
    aggregatorSetQueue: { value: 'aggregatorSetQueue' },
    aggregatorSetUpdateInterval: { value: 'aggregatorSetUpdateInterval' },
    aggregatorSetVarianceThreshold: { value: 'aggregatorSetVarianceThreshold' },
    crankInit: { value: 'crankInit' },
    crankPop: { value: 'crankPop' },
    crankPush: { value: 'crankPush' },
    jobInit: { value: 'jobInit' },
    leaseExtend: { value: 'leaseExtend' },
    leaseInit: { value: 'leaseInit' },
    leaseWithdraw: { value: 'leaseWithdraw' },
    leaseSetAuthority: { value: 'leaseSetAuthority' },
    oracleHeartbeat: { value: 'oracleHeartbeat' },
    oracleInit: { value: 'oracleInit' },
    oracleQueueInit: { value: 'oracleQueueInit' },
    oracleQueueSetRewards: { value: 'oracleQueueSetRewards' },
    oracleQueueVrfConfig: { value: 'oracleQueueVrfConfig' },
    oracleWithdraw: { value: 'oracleWithdraw' },
    permissionInit: { value: 'permissionInit' },
    permissionSet: { value: 'permissionSet' },
    programConfig: { value: 'programConfig' },
    programInit: { value: 'programInit' },
    vaultTransfer: { value: 'vaultTransfer' },
    vrfInit: { value: 'vrfInit' },
    vrfProve: { value: 'vrfProve' },
    vrfProveAndVerify: { value: 'vrfProveAndVerify' },
    vrfRequestRandomness: { value: 'vrfRequestRandomness' },
    vrfVerify: { value: 'vrfVerify' },
  },
})

const commonEventFields = {
  id: { type: new GraphQLNonNull(GraphQLString) },
  timestamp: { type: GraphQLLong },
  type: { type: new GraphQLNonNull(InstructionTypes) },
}

const Event = new GraphQLInterfaceType({
  name: 'Event',
  fields: {
    ...commonEventFields,
  },
})
`
    if(instructions){
        for(const instruction of instructions.instructions){
            apiTypes +=
`export const Event${instruction.name} = new GraphQLObjectType({
  name: '${instruction.name}',
  interfaces: [Event],
  isTypeOf: (item) => item.type === InstructionType.${instruction.name},
  fields: {
    ...commonEventFields,`
            for(const account of instruction.accounts){
                apiTypes +=
`       
      ${account.name.toLowerCase()}: { type: new GraphQLNonNull(GraphQLString) },`
            }
            apiTypes += `
  }
})

`
        }
        apiTypes += 
`export const Events = new GraphQLList(Event)

export const types = [`
        for(const instruction of instructions.instructions){
            apiTypes += 
`   
  Event${instruction.name},`
        }
        if(accounts){
          for(const account of accounts.accounts){
            apiTypes += 
  `   
  ${account.name},`
          }
        }
        apiTypes += 
`
  ParsedAccountsData
]
`
    }
    return { apiTypes }
}