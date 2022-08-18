export function renderGraphQLFiles(filename: string){
  const Name = filename.charAt(0).toUpperCase().concat(filename.slice(1))
  const name = filename.toLowerCase()

  const index: string = 
`import { ${Name}GraphQLResolvers } from './resolvers.js'
import { ${name}Program } from '../domain/${name}.js'
import { instructionEventDAL } from '../dal/instruction.js'
import { ApolloServer } from 'apollo-server'
import {
  ApolloServerPluginLandingPageGraphQLPlayground
} from 'apollo-server-core'
import path from 'path'
import { readFileSync } from 'fs'
import { makeExecutableSchema } from 'graphql-tools'

const schemaPath = path.resolve('./packages/${name}/dist/src/graphql/schema.graphql')
console.log(path.resolve(schemaPath))

const typeDefs = readFileSync(schemaPath, 'utf8')

// @note: resolver methods in resolver object need to have the same name as the query they resolve
const resolvers = {
  Account: {
    __resolveType(obj: any, context: any, info: any){
      return obj.type;
    },
  },
  Instruction: {
    __resolveType(obj: any, context: any, info: any){
      return obj.type;
    },
  },
  Query: new ${Name}GraphQLResolvers(instructionEventDAL, ${name}Program)
}

const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
  resolverValidationOptions: {
    requireResolversToMatchSchema: "ignore"
  }})

export const graphQLServer = new ApolloServer({
  schema,
  csrfPrevention: true,
  cache: "bounded",
  introspection: true,

  plugins: [
    ApolloServerPluginLandingPageGraphQLPlayground(),
  ],
 })
export default graphQLServer`


    const resolvers: string =
`import { EntityStorage } from '@aleph-indexer/core'
import { Account } from '../domain/account.js'
import { ${Name}Program } from '../domain/${name}.js'
import {
  AccountType,
  GlobalStats,
  HourlyStats,
  InstructionEvent, InstructionType, ${Name}AccountInfo
} from '../types.js'

export type AccountFilters = {
  types?: AccountType[]
  accounts?: string[]
}

export type InstructionFilters = {
  account?: string
  types?: InstructionType[]
  startDate?: number
  endDate?: number
  limit?: number
  skip?: number
  reverse?: boolean
}

export type GlobalStatsFilters = AccountFilters

export class ${Name}GraphQLResolvers {
  constructor(
    protected instructionDAL: EntityStorage<InstructionEvent>,
    protected domain: ${Name}Program,
  ) {}

  public async accounts(
    parent: any,
    args: AccountFilters,
    context: any,
    info: any): Promise<${Name}AccountInfo[]>
  {
    const result = await this.filterAccounts(args)

    return result.map((account) => ( {...account.info, stats: account.stats }))
  }

  public async instructionHistory(
    parent: any,
    {
      account,
      types,
      startDate = 0,
      endDate = Date.now(),
      limit = 1000,
      skip = 0,
      reverse = true,
    }: InstructionFilters = {
      account: undefined,
      types: undefined,
      startDate: 0,
      endDate: Date.now(),
      limit: 1000,
      skip: 0,
      reverse: true,
    },
    context: any,
    info: any
  ): Promise<InstructionEvent[]> {
    if (limit < 1 || limit > 1000)
      throw new Error('400 Bad Request: 1 <= limit <= 1000')

    const result: InstructionEvent[] = []

    let events;
    if (!!account) {
      events = this.instructionDAL
        .useIndex('account_timestamp')
        .getAllFromTo([account, startDate], [account, endDate], {
          reverse,
          limit: limit + skip,
        })
    } else {
      events = this.instructionDAL
        .useIndex('timestamp')
        .getAllFromTo([startDate], [endDate], {
          reverse,
          limit: limit + skip,
        })
    }

    for await (const { value } of events) {
      // @note: Skip first N events
      if (--skip >= 0) continue

      // @note: Filter by type
      if(!types || (!!value.type && (types as InstructionType[])?.includes(value.type)))
        result.push(value)

      // @note: Stop when after reaching the limit
      if (limit > 0 && result.length >= limit) return result
    }

    return result
  }

  public async hourlyStats(
    parent: any,
    { address }: {address: string},
    context: any,
    info: any
  ): Promise<HourlyStats> {
    const account = await this.getAccountByAddress(address)
    return account.getHourlyStats()
  }

  public async globalStats(
    parent: any,
    args: GlobalStatsFilters,
    context: any,
    info: any
  ): Promise<GlobalStats> {
    const result = await this.filterAccounts(args)
    const addresses = result.map(({ info }) => info.address)
    return this.domain.getGlobalStats(addresses)
  }


  // -------------------------------- PROTECTED --------------------------------
  protected async getAccountByAddress(address: string): Promise<Account> {
    const account = await this.domain.getAccountStats(address)
    if (!account) throw new Error(\`Account \${address} does not exist\`)
    return account
  }

  protected async filterAccounts({
    types,
    accounts
  }: AccountFilters = {types: undefined, accounts: undefined}): Promise<Account[]> {
    const accountMap = await this.domain.getAllAccountStats()

    accounts =
      accounts ||
      Object.values(accountMap).map((account) => account.info.address)

    let result = accounts
      .map((address) => accountMap[address])
      .filter((aggregator) => !!aggregator)

    if (types !== undefined) {
      result = result.filter(({ info }) => types!.includes(info.type))
    }

    return result
  }
}`
  return { index, resolvers }
}