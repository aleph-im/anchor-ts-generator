export function renderParsersFiles(name: string){
    const dollar = '$'
    const com = '`'
    const Name = name.charAt(0).toUpperCase().concat(name.slice(1))
    const event: string = 
`import { InstructionContext } from '@aleph-indexer/core'
import { ${name}EventStorage, ${name}EventDAL } from '../dal/event.js'
import { solana } from '../solanaRpc.js'
import {
  ParsedEvent
} from '../types.js'

export class ${name}EventParser {
    constructor(
      protected rpc = solana,
      protected eventDAL: ${name}EventStorage = ${name}EventDAL,
      protected cache: Record<string, { validator: string; owner: string }> = {},
      protected domain: ${name}Programs = ${Name}Programs,
    ) {}
  
    async parse(ixCtx: InstructionContext): Promise<${name}Event | undefined> {
      const { ix, parentIx, parentTx } = ixCtx
      const id = ${com}${dollar}{parentTx.signature}${dollar}{
        parentIx ? ${com}:${dollar}{parentIx.index.toString().padStart(2, '0')}${com} : ''
      }:${dollar}{ix.index.toString().padStart(2, '0')}${com}

      const timestamp = parentTx.blockTime
        ? parentTx.blockTime * 1000
        : parentTx.slot
  
      const type = parsed.type
  
      switch (type) {
        case ParsedEvent.Initialize: {
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
        case StakingEventType.Delegate: {
          const { stakeAuthority, voteAccount, stakeAccount } = parsed.info
  
          const res: StakingEventDelegate = {
            id,
            timestamp,
            type: StakingEventType.Delegate,
            account: stakeAccount,
            stakeAuthority,
            validator: voteAccount,
          }
  
          return res
        }
        case StakingEventType.Deactivate: {
          const { stakeAuthority, stakeAccount } = parsed.info
  
          const res: StakingEventDeactivate = {
            id,
            timestamp,
            type: StakingEventType.Deactivate,
            account: stakeAccount,
            stakeAuthority,
          }
  
          return res
        }
        case StakingEventType.Withdraw: {
          const { destination, lamports, withdrawAuthority, stakeAccount } =
            parsed.info
  
          const res: StakingEventWithdraw = {
            id,
            timestamp,
            type: StakingEventType.Withdraw,
            account: stakeAccount,
            destination,
            lamports,
            withdrawAuthority,
          }
  
          return res
        }
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

    return event
}