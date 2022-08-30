export function renderApiFiles(filename: string){
  const dollar = '$'
  const com = '`'
  const Name = filename.charAt(0).toUpperCase().concat(filename.slice(1))
  const name = filename.toLowerCase()

  const indexApi: string = `export { default } from './schema.js'`

  const resolversApi: string = `import MainDomain from '../domain/main.js'
import {
  AccountType,
  Global${Name}Stats,
  ParsedEvents,
  InstructionType,
  ${Name}AccountInfo,
  ${Name}ProgramData,
} from '../types.js'
import { AccountStats } from '@aleph-indexer/framework'

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

  async accounts(args: AccountsFilters): Promise<${Name}AccountInfo[]> {
    const result = await this.filterAccounts(args)
    return result.map(({ info, stats }) => ({ ...info, stats }))
  }

  async instructionHistory({
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

    const result: ParsedEvents[] = []

    const events = await this.domain.getAccountEventsByTime(
      account,
      startDate,
      endDate,
      {
        reverse,
        limit: !typesMap ? limit + skip : undefined,
      },
    )

    // const events = this.eventDAL
    //   .useIndex('reserve_timestamp')
    //   .getAllFromTo([reserve, startDate], [reserve, endDate], {
    //     reverse,
    //     limit: !typesMap ? limit + skip : undefined,
    //   })

    for await (const { value } of events) {
      // @note: Filter by type
      if (typesMap && !typesMap.has(value.type)) continue

      // @note: Skip first N events
      if (--skip >= 0) continue

      result.push(value)

      // @note: Stop when after reaching the limit
      if (limit > 0 && result.length >= limit) return result
    }

    return result
  }

  public async globalStats(
    parent: any,
    args: GlobalStatsFilters,
    context: any,
    info: any,
  ): Promise<Global${Name}Stats> {
    const result = await this.filterAccounts(args)
    const addresses = result.map(({ info }) => info.address)
    return this.domain.getGlobalStats(addresses)
  }

  // -------------------------------- PROTECTED --------------------------------
  protected async getAccountByAddress(address: string): Promise<AccountStats> {
    const add: string[] = [address]
    const account = await this.domain.getAccountStats(add)
    if (!account) throw new Error(${com}Account ${dollar}{address} does not exist${com})
    return account[0]
  }

  protected async filterAccounts(
    { types, accounts, includeStats }: AccountsFilters = {
      types: undefined,
      accounts: undefined,
      includeStats: undefined,
    },
  ): Promise<${Name}ProgramData[]> {
    const accountMap = await this.domain.getAccounts(includeStats)

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

    const schemaApi: string = `import { GraphQLSchema } from 'graphql'
import { APIResolvers } from './resolvers.js'
import MainDomain from '../domain/main.js'
import { makeExecutableSchema } from 'graphql-tools'
import { readFileSync } from 'fs'
import path from 'path'
import { APISchemaBase } from '@aleph-indexer/framework'

export default class APISchema extends APISchemaBase {
  constructor(
    protected domain: MainDomain,
    protected resolver: APIResolvers = new APIResolvers(domain),
    protected schema = getSchema(resolver),
  ) {
    super(domain, schema)
  }
}

function getSchema(resolver: APIResolvers): GraphQLSchema {
  const schemaPath = path.resolve(
    './packages/${name}/dist/src/api/schema.graphql',
  )
  const typeDefs = readFileSync(schemaPath, 'utf8')

  // @note: resolver methods in resolver object need to have the same name as the query they resolve
  const resolvers = {
    Account: {
      __resolveType(obj: any, context: any, info: any) {
        return obj.type
      },
    },
    Instruction: {
      __resolveType(obj: any, context: any, info: any) {
        return obj.type
      },
    },
    Query: resolver,
  }

  return makeExecutableSchema({
    typeDefs,
    resolvers,
    resolverValidationOptions: {
      requireResolversToMatchSchema: 'ignore',
    },
  })
}`
    return { indexApi, resolversApi, schemaApi }
}