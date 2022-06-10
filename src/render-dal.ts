export function renderDALFiles(name: string){
    const dollar = '$'
    const com = '`'
    const Name = name.charAt(0).toUpperCase().concat(name.slice(1))
    const main: string = 
`
export * from './common.js'
export * from './event.js
export * from './fetcherPool.js'
export * from './fetcherState.js'
`
  
    const common: string =
`
import config from '../../config.js'
import { ProgramName } from '../constants.js'

exoport enum EventDAL {
  Event = 'event'
}

export const dbFolder = ${com}${dollar}{config.DB_FOLDER}/${dollar}{ProgramName.${Name}}${com}
`
  
    const eventDAL: string = 
`
import { EntityStorage } from '@aleph-indexer/core'
import { OracleEvent } from '../types.js'
import { dbPath as path, EventDAL } from './common.js'

export type OracleEventStorage = EntityStorage<OracleEvent>

export const oracleEventDAL = new EntityStorage<OracleEvent>({
  name: EventDAL.Event,
  path,
  primaryKey: [{ get: (e) => e.id, length: EntityStorage.VariableLength }],
  indexes: [
    {
      name: 'timestamp',
      key: [{ get: (e) => e.timestamp, length: EntityStorage.TimestampLength }],
    },
    {
      name: 'aggregator_timestamp',
      key: [
        { get: (e) => e.aggregator, length: EntityStorage.AddressLength },
        { get: (e) => e.timestamp, length: EntityStorage.TimestampLength },
      ],
    }
  ],
})
`

const fetcherPool: string = 
`
import { FetcherPoolLevelStorage } from '@aleph-indexer/core'
import { OracleInitInstruction } from '../types.js'
import { dbPath as path } from './common.js'

export const fetcherPoolDAL =
  new FetcherPoolLevelStorage<OracleInitInstruction>({
    name: 'fetcher_pool',
    path,
  })
`

    const fetcherState: string = 
`
import { FetcherStateLevelStorage } from '@aleph-indexer/core'
import { dbFolder as path } from './common.js'

export const fetcherStateDAL = new FetcherStateLevelStorage({ path })
`
  
    return { main, common, eventDAL, fetcherPool, fetcherState }
  }