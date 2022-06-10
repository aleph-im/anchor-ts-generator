import {
  ViewEvents,
} from "./types.js";

export function renderParsersFiles(name: string, eventsView: ViewEvents | undefined){
    const dollar = '$'
    const com = '`'
    const Name = name.charAt(0).toUpperCase().concat(name.slice(1))
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

    return event
}