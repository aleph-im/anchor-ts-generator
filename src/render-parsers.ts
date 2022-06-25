import {
  ViewEvents,
} from "./types";

export function renderParsersFiles(name: string, eventsView: ViewEvents | undefined){
    const dollar = '$'
    const com = '`'
    const Name = name.charAt(0).toUpperCase().concat(name.slice(1))
    const NAME = name.toUpperCase()
    let parser: string = 
`import { InstructionContext, AlephParsedEvent } from '@aleph-indexer/core'
import * as types from "../types";
import { ${NAME}_PROGRAM_ID } from "../constants";

export class EventParser {
  constructor(
    /*protected rpc = solana,
    protected dalFactory: ${Name}DALFactory = ${name}DALFactory,
    protected ${name}DAL: ${Name}LevelStorage = ${name}LevelStorage,
    protected cache: Record<string, { mint: string; owner: string }> = {},*/
  ) {}

  async parse(ixCtx: InstructionContext, info: types.AccountData) {
    const { ix, parentIx, parentTx } = ixCtx
    if(ix.programId.toString() === ${NAME}_PROGRAM_ID){
      const id = ${com}${dollar}{parentTx.signature}${dollar}{
        parentIx ? ${com}:${dollar}{parentIx.index.toString().padStart(2, '0')}${com} : ''
      }:${dollar}{ix.index.toString().padStart(2, '0')}${com}

      const timestamp = parentTx.blockTime
        ? parentTx.blockTime * 1000
        : parentTx.slot
      
      const parsed = (ix as AlephParsedEvent<types.InstructionType, any>)

      const baseEvent: types.InstructionEvent = {
        ...parsed.info,
        id,
        timestamp,
        type: parsed?.type,
        account: info.address,
        programId: ixCtx.parentIx?.programId ?? info.programId,
      }

      try {
        switch (parsed.type) {
`
    if(eventsView != undefined){
      for(let i = 0; i < eventsView.events.length; i++){
        parser += 
`          case types.EventType.${eventsView.events[i].name}: {
            const {`
        let eventFields = ''
        for(let j = 0; j < eventsView.events[i].fields.length; j++){
          eventFields += ` ${eventsView.events[i].fields[j].name},`
        }
        parser += eventFields.slice(0, eventFields.length - 1) + ` } = parsed.info
            const res: types.${eventsView.events[i].name} = {
`
        eventFields = 
`              ...baseEvent,
`
        for(let j = 0; j < eventsView.events[i].fields.length; j++){
          eventFields += 
`              ${eventsView.events[i].fields[j].name},
`
        }

        parser += eventFields.slice(0, eventFields.length - 2) +
`
            }
            return res
          }
`
      }
    } 
    parser += `
          default: {
            console.log('NOT PARSED IX TYPE', (parsed as any).type)
            console.log(id)
            //return
          }
        }
      } catch (e) {
        console.log('error -> ', parsed.type, id, e)
        throw e
      }
    }
  } 
}

export const eventParser = new EventParser()
export default eventParser`

const instructionParser: string = 
`import {
  Parsers,
  PARSERS as _PARSERS,
  InstructionParser,
} from '@aleph-indexer/core'
import { ProgramName, ${NAME}_PROGRAM_ID } from '../constants'
import {
  getInstructionType,
  IX_ACCOUNTS_LAYOUT,
  IX_DATA_LAYOUT,
} from '../layouts/instructions'
import { InstructionType } from '../types'

export const PARSERS = _PARSERS

export function initParsers(): void {
  const PROGRAMS = PARSERS['PROGRAMS'] as Parsers
  PROGRAMS[${NAME}_PROGRAM_ID] = new InstructionParser<InstructionType>(
    ${NAME}_PROGRAM_ID,
    ProgramName.${Name},
    PARSERS,
    getInstructionType,
    IX_ACCOUNTS_LAYOUT,
    IX_DATA_LAYOUT,
  )
}
`
    return { parser, instructionParser }
}