export function renderGraphQLFiles(name: string){
  const dollar = '$'
  const com = '`'
  const Name = name.charAt(0).toUpperCase().concat(name.slice(1))
  const index: string = 
`
import { ApolloServer } from 'apollo-server'
import { readFileSync } from 'fs'
import { ${name}Resolvers } from './resolvers'

const typeDefs = readFileSync('./schema/schema.graphql', 'utf8')

export const graphQLServer = new ApolloServer({ typeDefs, ${name}Resolvers })
export default graphQLServer
`

    const resolvers: string =
`
import { EntityStorage } from '@aleph-indexer/core'
import { Account } from '../domain/account'
import { ${name}Program } from '../domain/${name}'
import {
  GlobalOracleStats,
  HourlyStats,
  InstructionEvent, 
  ${Name}AccountInfo
} from "../types";

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
    getPools({
      oracleQueue,
      pools,
    }: PoolFilters): Promise<PoolInfo[]> {
      const result = await this.filterPools({
        oracleQueue,
        pools,
      })
  
      return result.map(({ info, stats }) => ({ ...info, stats }))
    }

    getEvents({
      pool,
      startDate = 0,
      endDate = Date.now(),
      limit = 1000,
      skip = 0,
      reverse = true,
    }: EventsFilters): Promise<RawEvent[]> {
      if (limit < 1 || limit > 1000)
        throw new Error('400 Bad Request: 1 <= limit <= 1000')
  
      const result: RawEvent[] = []
  
      const events = this.eventDAL
        .useIndex('pool_timestamp')
        .getAllFromTo([pool, startDate], [pool, endDate], {
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

    getPoolHourlyStats(
      reserveAddress: string,
    ): Promise<HourlyOracleStats> {
      const reserve = await this.getPoolByAddress(reserveAddress)
      return reserve.getHourlyStats()
    }

    getGlobalStats({
      oracleQueue,
      pools,
    }: GlobalStatsFilters): Promise<GlobalOracleStats> {
      const result = await this.filterPools({
        oracleQueue,
        pools,
      })
  
      const addresses = result.map(({ info }) => info.address)
  
      return this.domain.getGlobalStats(addresses)
    }
  }

  getPoolByAddress(address: string): Promise<Pool> {
    const pool = await this.domain.getPool(address)
    if (!pool) throw new Error(${com}Pool ${dollar}{address} does not exists${com})
    return pool
  }
}
`

  return { index, resolvers }
}