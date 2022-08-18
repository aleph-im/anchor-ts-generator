export function renderDALFiles(filename: string){
  const Name = filename.charAt(0).toUpperCase().concat(filename.slice(1))

  const dollar = '$'
  const com = '`'

  const main: string = 
`export * from './common.js'
export * from './fetcherState.js'
`
  
  const common: string =
`import { config } from '@aleph-indexer/core'
import { ProgramName } from '../constants.js'

export enum InstructionDAL {
  Instruction = 'instruction',
}

export const dbPath = ${com}${dollar}{config.DB_FOLDER}/${dollar}{ProgramName.${Name}}${com}`

  const instruction: string = 
`import { EntityStorage } from '@aleph-indexer/core'
import { InstructionEvent } from '../types.js'
import { dbPath as path, InstructionDAL } from './common.js'

export type InstructionStorage = EntityStorage<InstructionEvent>

export const instructionEventDAL = new EntityStorage<InstructionEvent>({
  name: InstructionDAL.Instruction,
  path,
  primaryKey: [{ get: (e) => e.id, length: EntityStorage.VariableLength }],
  indexes: [
    {
      name: 'timestamp',
      key: [{ get: (e) => e.timestamp, length: EntityStorage.TimestampLength }],
    },
    {
      name: 'account_timestamp',
      key: [
        { get: (e) => e.account, length: EntityStorage.AddressLength },
        { get: (e) => e.timestamp, length: EntityStorage.TimestampLength },
      ],
    }
  ],
})`

  const fetcherState: string = 
`import { FetcherStateLevelStorage } from '@aleph-indexer/core'
import { dbPath as path } from './common.js'

export const fetcherStateLevelStorage = new FetcherStateLevelStorage({ path })`
  
    return { main, common, instruction, fetcherState }
  }