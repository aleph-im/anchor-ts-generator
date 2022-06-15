import {
  ViewEvents,
} from "./types.js";

export function renderParsersFiles(name: string, eventsView: ViewEvents | undefined){
    const dollar = '$'
    const com = '`'
    const Name = name.charAt(0).toUpperCase().concat(name.slice(1))
    const NAME = name.toUpperCase()
    let poolParser: string = 
`import { InstructionContext, AlephParsedEvent } from '@aleph-indexer/core'
import * as types from "../types.js";
import { ${NAME}_PROGRAM_ID } from "../constants.js";

export class PoolEventParser {
  constructor(
    /*protected rpc = solana,
    protected dalFactory: ${Name}DALFactory = ${name}DALFactory,
    protected ${name}DAL: ${Name}LevelStorage = ${name}LevelStorage,
    protected cache: Record<string, { mint: string; owner: string }> = {},*/
  ) {}

  async parse(ixCtx: InstructionContext, info: types.PoolInfo) {
    const { ix, parentIx, parentTx } = ixCtx
    if(ix.programId.toString() === ${NAME}_PROGRAM_ID){
      const id = ${com}${dollar}{parentTx.signature}${dollar}{
        parentIx ? ${com}:${dollar}{parentIx.index.toString().padStart(2, '0')}${com} : ''
      }:${dollar}{ix.index.toString().padStart(2, '0')}${com}

      const timestamp = parentTx.blockTime
        ? parentTx.blockTime * 1000
        : parentTx.slot
      
      const parsed = (ix as AlephParsedEvent<types.InstructionType, any>)

      const baseEvent: types.RawEvent = {
        ...parsed.info,
        id,
        timestamp,
        type: parsed?.type,
        aggregator: info.address,
        programId: ixCtx.parentIx?.programId ?? info.programId,
        queue: info.oracleQueue,
      }

      try {
        switch (parsed.type) {
`
    if(eventsView != undefined){
      for(let i = 0; i < eventsView.events.length; i++){
        poolParser += 
`          case types.EventType.${eventsView.events[i].name}: {
            const {`
        let eventFields = ''
        for(let j = 0; j < eventsView.events[i].fields.length; j++){
          eventFields += ` ${eventsView.events[i].fields[j].name},`
        }
        poolParser += eventFields.slice(0, eventFields.length - 1) + ` } = parsed.info
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

        poolParser += eventFields.slice(0, eventFields.length - 2) +
`
            }
            return res
          }
`
      }
    } 
    poolParser += `
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

export const poolEventParser = new PoolEventParser()
export default poolEventParser`

const instructionParser: string = 
`import {
  Parsers,
  PARSERS as _PARSERS,
  InstructionParser,
} from '@aleph-indexer/core'
import { ProgramName, ${NAME}_PROGRAM_ID } from '../constants.js'
import {
  getInstructionType,
  IX_ACCOUNTS_LAYOUT,
  IX_DATA_LAYOUT,
} from '../layouts/instructions.js'
import { InstructionType } from '../types.js'

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
    return { poolParser, instructionParser }
}

/*
let event: string = 
`import { InstructionContext, AlephParsedEvent } from '@aleph-indexer/core'
import { ${name}EventStorage, ${name}EventDAL } from '../dal/event.js'
import { solana } from '../solanaRpc.js'
import { ParsedEvent } from '../types.js'

export class ${name}EventParser {
    constructor(
      protected rpc = solana,
      protected dalFactory: ${Name}DALFactory = ${name}DALFactory,
      protected ${name}DAL: ${Name}LevelStorage = ${name}LevelStorage,
      protected cache: Record<string, { mint: string; owner: string }> = {}, // bad
    ) {}
  
    async parse(ixCtx: InstructionContext): Promise<ParsedEvent | undefined> {
      const { ix, parentIx, parentTx } = ixCtx
      const id = ${com}${dollar}{parentTx.signature}${dollar}{
        parentIx ? ${com}:${dollar}{parentIx.index.toString().padStart(2, '0')}${com} : ''
      }:${dollar}{ix.index.toString().padStart(2, '0')}${com}

      const timestamp = parentTx.blockTime
        ? parentTx.blockTime * 1000
        : parentTx.slot
  
      const type = parsed.type
      switch (type) {
`
    if(eventsView != undefined){
      for(let i = 0; i < eventsView.events.length; i++){
        event += 
`       case ParsedEvent.${eventsView.events[i]}: {
          const { authorized, lockup, stakeAccount } = parsed.info
          const res: StakingEventInitialize = {
            id,
            timestamp,
            type: StakingEventType.Initialize,
            account: stakeAccount,
            authorizedStaker: authorized.staker,
            authorizedWithdrawer: authorized.withdrawer,
            lockupCustodian: lockup.custodian,
            lockupEpoch: lockup.epoch,
            lockupUnixTimestamp: lockup.unixTimestamp,
          }
          return res
        }
`
      }
    } 

const end: string = `
        default: {
          console.log('NOT PARSED IX TYPE', (parsed as any).type)
          console.log(id)
          return
        }
      }
    }
  }
  
  export const stakingEventParser = new StakingEventParser()
  export default stakingEventParser  
`
    event += end
*/