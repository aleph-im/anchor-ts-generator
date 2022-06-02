export function renderSrcFiles(){

    let constants: string = "" //Insert code here

    let solanarpc: string = 
`import config from '../config.js'
import { PARSERS, SolanaRPCRoundRobin } from '@aleph-indexer/core'

export const solanaRPCRoundRobin = new SolanaRPCRoundRobin(
  [...(config.SOLANA_RPC || '').split(','), 'https://aleph.genesysgo.net'],
  PARSERS,
  false,
)

export const solanaMainPublicRPCRoundRobin = new SolanaRPCRoundRobin(
  config.SOLANA_MAIN_PUBLIC_RPC
    ? config.SOLANA_MAIN_PUBLIC_RPC.split(',')
    : [
        // @note: All pools has historical data
        'https://api.mainnet-beta.solana.com',
        // 'https://free.rpcpool.com', this is the same cluster than "api.mainnet-beta.solana.com"
      ],
  PARSERS,
  true,
)

export const solana = solanaRPCRoundRobin.getProxy()
export const solanaMainPublic = solanaMainPublicRPCRoundRobin.getProxy()`

    let types: string = `export * from "../../ts/types"`

    return { constants, solanarpc, types }
  }