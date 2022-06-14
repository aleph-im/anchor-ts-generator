export function renderGraphQLFiles(name: string){
  const dollar = '$'
  const com = '`'
  const index: string = 
`
import { ApolloServer } from 'apollo-server'
import { readFileSync } from 'fs'
import { ${name}Resolvers } from './resolvers'

const typeDefs = readFileSync('./schema/schema.graphql', 'utf8')

export const ${name}server = new ApolloServer({ typeDefs, ${name}Resolvers })
export default ${name}server
`

    const resolvers: string =
`
import { EntityStorage } from '@aleph-indexer/core'
import { Aggregator } from '../domain/aggregator.js'
import { ${name}Program } from '../domain/${name}.js'
import {
  GlobalOracleStats,
  HourlyOracleStats,
  AggregatorInfo,
  OracleEvent,
} from '../types.js'

export type AggregatorFilters = {
  oracleQueue: string
  aggregators?: string[]
}

export type EventsFilters = {
  aggregator: string
  startDate?: number
  endDate?: number
  limit?: number
  skip?: number
  reverse?: boolean
}


export const ${name}Resolvers = {
  Query: {

    getAggregators({
      oracleQueue,
      aggregators,
    }: AggregatorFilters): Promise<AggregatorInfo[]> {
      const result = await this.filterAggregators({
        oracleQueue,
        aggregators,
      })
  
      return result.map(({ info, stats }) => ({ ...info, stats }))
    }

    getEvents({
      aggregator,
      startDate = 0,
      endDate = Date.now(),
      limit = 1000,
      skip = 0,
      reverse = true,
    }: EventsFilters): Promise<OracleEvent[]> {
      if (limit < 1 || limit > 1000)
        throw new Error('400 Bad Request: 1 <= limit <= 1000')
  
      const result: OracleEvent[] = []
  
      const events = this.eventDAL
        .useIndex('aggregator_timestamp')
        .getAllFromTo([aggregator, startDate], [aggregator, endDate], {
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

    getAggregatorHourlyStats(
      reserveAddress: string,
    ): Promise<HourlyOracleStats> {
      const reserve = await this.getAggregatorByAddress(reserveAddress)
      return reserve.getHourlyStats()
    }

    getGlobalStats({
      oracleQueue,
      aggregators,
    }: GlobalStatsFilters): Promise<GlobalOracleStats> {
      const result = await this.filterAggregators({
        oracleQueue,
        aggregators,
      })
  
      const addresses = result.map(({ info }) => info.address)
  
      return this.domain.getGlobalStats(addresses)
    }
  }

  getAggregatorByAddress(address: string): Promise<Aggregator> {
    const aggregator = await this.domain.getPool(address)
    if (!aggregator) throw new Error(${com}Aggregator ${dollar}{address} does not exists${com})
    return aggregator
  }
}
`

  const schema: string = ``
  const GQLtypes: string = ``

  return { index, resolvers, schema, GQLtypes }
}