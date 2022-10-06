import { ViewAccounts, ViewInstructions, ViewTypes } from "./types"

export function renderApiFiles(Name: string, instructions: ViewInstructions | undefined, accounts: ViewAccounts | undefined, types: ViewTypes | undefined){
  const naMe = Name.charAt(0).toLowerCase() + Name.slice(1)

  const indexApi: string = `export { default } from './schema.js'`

  const resolversApi: string = `import MainDomain from '../domain/main.js'
import {
  AccountType,
  ParsedEvents,
  InstructionType,
} from '../utils/layouts/index.js'
import {
  Global${Name}Stats,
  ${Name}AccountInfo,
  ${Name}ProgramData,
} from '../types.js'

export type AccountsFilters = {
  types?: AccountType[]
  accounts?: string[]
  includeStats?: boolean
}

export type EventsFilters = {
  account: string
  types?: InstructionType[]
  startDate?: number
  endDate?: number
  limit?: number
  skip?: number
  reverse?: boolean
}

export type GlobalStatsFilters = AccountsFilters

export class APIResolvers {
  constructor(protected domain: MainDomain) {}

  async getAccounts(args: AccountsFilters): Promise<${Name}AccountInfo[]> {
    const acountsData = await this.filterAccounts(args)
    return acountsData.map(({ info, stats }) => ({ ...info, stats }))
  }

  async getEvents({
    account,
    types,
    startDate = 0,
    endDate = Date.now(),
    limit = 1000,
    skip = 0,
    reverse = true,
  }: EventsFilters): Promise<ParsedEvents[]> {
    if (limit < 1 || limit > 1000)
      throw new Error('400 Bad Request: 1 <= limit <= 1000')

    const typesMap = types ? new Set(types) : undefined

    const events: ParsedEvents[] = []

    const accountEvents = await this.domain.getAccountEventsByTime(
      account,
      startDate,
      endDate,
      {
        reverse,
        limit: !typesMap ? limit + skip : undefined,
      },
    )

    for await (const { value } of accountEvents) {
      // @note: Filter by type
      if (typesMap && !typesMap.has(value.type)) continue

      // @note: Skip first N events
      if (--skip >= 0) continue

      events.push(value)

      // @note: Stop when after reaching the limit
      if (limit > 0 && events.length >= limit) return events
    }

    return events
  }

  public async getGlobalStats(args: GlobalStatsFilters): Promise<Global${Name}Stats> {
    const acountsData = await this.filterAccounts(args)
    const addresses = acountsData.map(({ info }) => info.address)

    return this.domain.getGlobalStats(addresses)
  }

  // -------------------------------- PROTECTED --------------------------------
  /*protected async getAccountByAddress(address: string): Promise<AccountStats> {
    const add: string[] = [address]
    const account = await this.domain.getAccountStats(add)
    if (!account) throw new Error(\`Account \${address} does not exist\`)
    return account[0]
  }*/

  protected async filterAccounts({ 
    types, 
    accounts, 
    includeStats 
  }: AccountsFilters): Promise<${Name}ProgramData[]> {
    const accountMap = await this.domain.getAccounts(includeStats)

    accounts =
      accounts ||
      Object.values(accountMap).map((account) => account.info.address)

    let accountsData = accounts
      .map((address) => accountMap[address])
      .filter((account) => !!account)

    if (types !== undefined) {
      accountsData = accountsData.filter(({ info }) => types!.includes(info.type))
    }

    return accountsData
  }
}`

    const schemaApi: string = `import {
  GraphQLObjectType,
  GraphQLString,
  GraphQLList,
  GraphQLFloat,
  GraphQLInt,
  GraphQLBoolean,
  GraphQLNonNull,
} from 'graphql'
import { IndexerAPISchema } from '@aleph-indexer/framework'
import * as Types from './types.js'
import {
  EventsFilters,
  GlobalStatsFilters,
  APIResolvers,
  AccountsFilters,
} from './resolvers.js'
import MainDomain from '../domain/main.js'

export default class APISchema extends IndexerAPISchema {
  constructor(
      protected domain: MainDomain,
      protected resolver: APIResolvers = new APIResolvers(domain),
  ) {
    super(domain, {
      types: Types.types,

      customTimeSeriesTypesMap: { ${naMe}Info: Types.${Name}Info },
      customStatsType: Types.${Name}Stats,

      query: new GraphQLObjectType({
        name: 'Query',
        fields: {
          accounts: {
            type: Types.AccountsInfo,
            args: {
              types: { type: new GraphQLList(GraphQLString) },
              accounts: { type: new GraphQLList(GraphQLString) },
            },
            resolve: (_, ctx, __, info) => {
              ctx.includeStats =
                  !!info.fieldNodes[0].selectionSet?.selections.find(
                      (item) =>
                          item.kind === 'Field' && item.name.value === 'stats',
                  )

              return this.resolver.getAccounts(ctx as AccountsFilters)
            },
          },

          events: {
            type: Types.Events,
            args: {
              account: { type: new GraphQLNonNull(GraphQLString) },
              types: { type: new GraphQLList(Types.ParsedEvents) },
              startDate: { type: GraphQLFloat },
              endDate: { type: GraphQLFloat },
              limit: { type: GraphQLInt },
              skip: { type: GraphQLInt },
              reverse: { type: GraphQLBoolean },
            },
            resolve: (_, ctx) =>
                this.resolver.getEvents(ctx as EventsFilters),
          },

          globalStats: {
            type: Types.Global${Name}Stats,
            args: {
              types: { type: GraphQLString },
              accounts: { type: new GraphQLList(GraphQLString) },
            },
            resolve: (_, ctx) =>
                resolver.getGlobalStats(ctx as GlobalStatsFilters),
          },
        },
      }),
    })
  }
}
`
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
import { InstructionType } from '../utils/layouts/index.js'

// ------------------- TYPES ---------------------------

// if you have some errors here most probably will be solved by changing the order of types
`
  if(accounts && instructions && types){

    for(const type of types.enums){
      apiTypes += `
export const ${type.name} = new GraphQLEnumType({
  name: '${type.name}',
  values: {`
      for(const field of type.variants) {
          apiTypes += `
    ${field}: { value: '${field}' },`

      }
      apiTypes += `
        },
      })
`
    }

    for(const type of types.types){
      apiTypes += `
export const ${type.name} = new GraphQLObjectType({
  name: '${type.name}',
  fields: {`
      for(const field of type.fields) {
          apiTypes += `
    ${field.name}: { type: new GraphQLNonNull(${field.graphqlType}) },`

      }
      apiTypes += `
        },
      })
`
    }

    apiTypes += `

// ------------------- STATS ---------------------------

// look .src/domain/stats/statsAggregator & ./src/types.ts

export const ${Name}Info = new GraphQLObjectType({
  name: '${Name}Info',
  fields: {
    customProperties1: { type: new GraphQLNonNull(GraphQLInt) },
    customProperties2: { type: new GraphQLNonNull(GraphQLInt) },
  },
})

export const TotalAccounts = new GraphQLObjectType({
  name: 'TotalAccounts',
  fields: {`
    for(const account of accounts.accounts){
      apiTypes += `
      ${account.name}: { type: new GraphQLNonNull(GraphQLInt) },`
    }
    apiTypes += `
  },
})

export const Global${Name}Stats = new GraphQLObjectType({
  name: 'Global${Name}Stats',
  fields: {
    totalAccounts: { type: new GraphQLNonNull(TotalAccounts) },
    totalRequests: { type: new GraphQLNonNull(GraphQLInt) },
    totalUniqueAccessingPrograms: { type: new GraphQLNonNull(GraphQLInt) },
  },
})

export const ${Name}Stats = new GraphQLObjectType({
  name: '${Name}Stats',
  fields: {
    last1h: { type: ${Name}Info },
    last24h: { type: ${Name}Info },
    last7d: { type: ${Name}Info },
    total: { type: ${Name}Info },
  },
})

// ------------------- ACCOUNTS ---------------------------

export const AccountsEnum = new GraphQLEnumType({
  name: 'AccountsEnum',
  values: {`

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
  fields: {`
    for(const field of account.data.fields){
        apiTypes += `
    ${field.name}: { type: new GraphQLNonNull(${field.graphqlType}) },`
    }
    apiTypes +=
` },
})
`
    }

    apiTypes +=
`
export const ParsedAccountsData = new GraphQLUnionType({
    name: "ParsedAccountsData",
    types: [`
    for(const account of accounts.accounts){
      apiTypes += `
      ${account.name}, `
    }
    apiTypes += `
    ],
    resolveType: (obj) => {
      // here is selected a unique property of each account to discriminate between types`

    const uniqueAccountProperty: Record<string, string> = {}
    for(const account of accounts.accounts){
      for (const field of account.data.fields) {
        let checksRequired = accounts.accounts.length - 1
        for(const _account of accounts.accounts) {
          if(_account.name == account.name) continue
          if(_account.data.fields.includes(field)) continue
          checksRequired--
        }
        if(checksRequired == 0) {
          uniqueAccountProperty[account.name] = field.name
        }
      }
    }

    for (const [account, field] of Object.entries(uniqueAccountProperty)) {
      apiTypes += `
      if(obj.${field}) {
          return '${account}'
      }`
    }

    apiTypes += `
    }
});

const commonAccountInfoFields = {
  name: { type: new GraphQLNonNull(GraphQLString) },
  programId: { type: new GraphQLNonNull(GraphQLString) },
  address: { type: new GraphQLNonNull(GraphQLString) },
  type: { type: new GraphQLNonNull(AccountsEnum) },
}

const Account = new GraphQLInterfaceType({
  name: 'Account',
  fields: {
    ...commonAccountInfoFields,
  },
})

export const ${Name}AccountsInfo = new GraphQLObjectType({
  name: '${Name}AccountsInfo',
  interfaces: [Account],
  fields: {
    ...commonAccountInfoFields,
    data: { type: new GraphQLNonNull(ParsedAccountsData) },
  },
})

export const AccountsInfo = new GraphQLList(${Name}AccountsInfo)

// ------------------- EVENTS --------------------------

export const ParsedEvents = new GraphQLEnumType({
  name: 'ParsedEvents',
  values: {
`
    for(const instruction of instructions.instructions){
        apiTypes +=`${instruction.name}Event: { value: '${instruction.name}Event' },
`
    }

    apiTypes +=  `},
})

const commonEventFields = {
  id: { type: new GraphQLNonNull(GraphQLString) },
  timestamp: { type: GraphQLLong },
  type: { type: new GraphQLNonNull(ParsedEvents) },
  account: { type: new GraphQLNonNull(GraphQLString) },
}

const Event = new GraphQLInterfaceType({
  name: 'Event',
  fields: {
    ...commonEventFields,
  },
})

`

    for(const instruction of instructions.instructions){
      apiTypes +=  
`export const ${instruction.name}Event = new GraphQLObjectType({
  name: '${instruction.name}Event',
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
  ${instruction.name}Event,`
      }
      apiTypes += 
`]
`
  }
  return { indexApi, resolversApi, schemaApi, apiTypes }
}