export function renderDALFiles(){

  const eventDal = `import { EntityStorage } from '@aleph-indexer/core'
import { ParsedEvents } from '../types.js'

export type EventStorage = EntityStorage<ParsedEvents>

export enum EventDALIndex {
  AccoountTimestamp = 'timestamp',
  AccounTypeTimestamp = 'account_timestamp',
}

const idKey = {
  get: (e: ParsedEvents) => e.id,
  length: EntityStorage.VariableLength,
}

const typeKey = {
  get: (e: ParsedEvents) => e.type,
  length: EntityStorage.VariableLength,
}

const timestampKey = {
  get: (e: ParsedEvents) => e.timestamp,
  length: EntityStorage.TimestampLength,
}

export function createEventDAL(path: string): EventStorage {
  return new EntityStorage<ParsedEvents>({
    name: 'event',
    path,
    primaryKey: [idKey],
    indexes: [
      {
        name: EventDALIndex.AccoountTimestamp,
        key: [idKey, timestampKey],
      },
      {
        name: EventDALIndex.AccounTypeTimestamp,
        key: [idKey, typeKey, timestampKey],
      },
    ],
  })
}
`
  
  return { eventDal }
}