import { ViewInstructions, ViewAccounts } from './types'
import { sha256 } from 'js-sha256'
import { snakeCase } from 'snake-case'
import camelcase from 'camelcase'

export function renderLayoutsFiles(instructionsView: ViewInstructions | undefined, accountsView: ViewAccounts | undefined){
    let accountLayouts: string = 
`export { AccountType, ACCOUNTS_DATA_LAYOUT } from '../../../ts/accounts.js'
import { AccountType } from '../types.js'

export const ACCOUNT_METHOD_CODE: Map<string, AccountType | undefined > = 
  new Map<string, AccountType | undefined > ([
`
    if(accountsView != undefined) {
        for(let i = 0; i < accountsView.accounts.length; i++){
            const discriminator = Array.from(instructionDiscriminator(accountsView.accounts[i].name))
            accountLayouts += 
`     [Buffer.from([${discriminator}]).toString('ascii'), AccountType.${accountsView.accounts[i].name}],
`
        }
    }
    accountLayouts += 
`])`
  
    let ixLayouts: string =
`
import { InstructionType } from '../types.js'
export { IX_DATA_LAYOUT, IX_ACCOUNTS_LAYOUT } from '../../../ts/instructions.js'

export function getInstructionType(data: Buffer): InstructionType | undefined {
  const discriminator = new Buffer(data.slice(0, 8).readUInt8())
  return IX_METHOD_CODE.get(discriminator.toString('ascii'))
}

export const IX_METHOD_CODE: Map<string, InstructionType | undefined > = 
  new Map<string, InstructionType | undefined > ([
`
    if(instructionsView != undefined) {
        for(let i = 0; i < instructionsView.instructions.length; i++){
            const ixDiscriminator = Array.from(instructionDiscriminator(instructionsView.instructions[i].name))
            ixLayouts += 
`     [Buffer.from([${ixDiscriminator}]).toString('ascii'), InstructionType.${instructionsView.instructions[i].name}],
`
        }
    }
    ixLayouts += 
`])
`;

    return { accountLayouts, ixLayouts }
  }

  const SIGHASH_GLOBAL_NAMESPACE = 'global'

  function instructionDiscriminator(name: string): Buffer {
    return sighash(SIGHASH_GLOBAL_NAMESPACE, name)
  }

  function sighash(nameSpace: string, ixName: string): Buffer {
    let name = snakeCase(ixName)
    let preimage = `${nameSpace}:${name}`
    return Buffer.from(sha256.digest(preimage)).slice(0, 8)
  }

  export const ACCOUNT_DISCRIMINATOR_SIZE = 8

  export function accountDiscriminator(name: string): Buffer {
    return Buffer.from(
      sha256.digest(`account:${camelcase(name, { pascalCase: true })}`)
    ).slice(0, ACCOUNT_DISCRIMINATOR_SIZE)
  }