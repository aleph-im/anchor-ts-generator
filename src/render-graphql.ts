export function renderGraphQLFiles(name: string){
  const dollar = '$'
  const com = '`'
  const Name = name.charAt(0).toUpperCase().concat(name.slice(1))
  const index: string = 
`import { ${Name}GraphQLResolvers } from './resolvers.js'
import { ${name}Program } from '../domain/${name}.js'
import { instructionEventDAL } from '../dal/instruction.js'
import { ApolloServer } from 'apollo-server'
import {
  ApolloServerPluginLandingPageGraphQLPlayground
} from "apollo-server-core";
import path from "path";
import { readFileSync } from "fs";

const schemaPath = path.resolve('./packages/${name}/dist/src/graphql/schema.graphql')
console.log(path.resolve(schemaPath))

const typeDefs = readFileSync(schemaPath, 'utf8')

// @note: resolver methods in resolver object need to have the same name as the query they resolve
const resolverObj = new ${Name}GraphQLResolvers(instructionEventDAL, ${name}Program)
const resolvers = {
  Query: {
    accounts: resolverObj.accounts,
    instructionHistory: resolverObj.instructionHistory
  }
}

export const graphQLServer = new ApolloServer({
  typeDefs,
  resolvers,
  csrfPrevention: true,
  cache: "bounded",
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
  InstructionEvent, 
  InstructionType, 
  ${Name}AccountInfo
} from "../types.js";

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

  public async accounts(filter: AccountFilters): Promise<${Name}AccountInfo[]> {
    const result = await this.filterAccounts(filter)

    return result.map(({ info, stats }) => ({ ...info, stats }))
  }

  public async instructionHistory({
    account,
    startDate = 0,
    endDate = Date.now(),
    limit = 1000,
    skip = 0,
    reverse = true,
  }: InstructionFilters): Promise<InstructionEvent[]> {
    if (limit < 1 || limit > 1000)
      throw new Error('400 Bad Request: 1 <= limit <= 1000')

    const result: InstructionEvent[] = []

    const events = this.instructionDAL
      .useIndex('account_timestamp')
      .getAllFromTo([account, startDate], [account, endDate], {
        reverse,
        limit: limit + skip,
      })

    for await (const { value } of events) {
      // @note: Filter by type

      // @note: Skip first N events
      if (--skip >= 0) continue

      result.push(value)

      // @note: Stop when after reaching the limit
      if (limit > 0 && result.length >= limit) return result
    }

    return result
  }

  public async getAccountHourlyStats(
    address: string,
  ): Promise<HourlyStats> {
    const account = await this.getAccountByAddress(address)
    return account.getHourlyStats()
  }

  public async getGlobalStats(filters: GlobalStatsFilters): Promise<GlobalStats> {
    const result = await this.filterAccounts(filters)
    const addresses = result.map(({ info }) => info.address)
    return this.domain.getGlobalStats(addresses)
  }


  // -------------------------------- PROTECTED --------------------------------
  protected async getAccountByAddress(address: string): Promise<Account> {
    const account = await this.domain.getAccountStats(address)
    if (!account) throw new Error(${com}Account ${dollar}{address} does not exist${com})
    return account
  }

  protected async filterAccounts(
    filter: AccountFilters): Promise<Account[]> {
    const accountMap = await this.domain.getAllAccountStats()

    filter.accounts =
      filter.accounts ||
      Object.values(accountMap).map((account) => account.info.address)

    let result = filter.accounts
      .map((address) => accountMap[address])
      .filter((aggregator) => !!aggregator)

    if (filter.types !== undefined) {
      result = result.filter(({ info }) => filter.types!.includes(info.type))
    }

    return result
  }
}
`

const apolloServer = `import { ApolloServer } from 'apollo-server'
import { graphQlData } from '../../../src/apolloServer/data.js'   //hardcoded data
import { Resolvers } from './resolvers.js'
import { readFileSync } from 'fs'

const typeDefs = readFileSync('./schema.graphql', 'utf8')   //schema

// Resolver map
const resolvers: Resolvers = {
    Query: {
       books() {
            return graphQlData;
        }
    },
};


// Pass schema definition and resolvers to the
// ApolloServer constructor
const server = new ApolloServer({ typeDefs, resolvers })

// Launch the server
server.listen().then( url =>
    console.log(${com}🚀  Server ready at ${dollar}{url.port}${com}))`

  return { index, resolvers, apolloServer }
}