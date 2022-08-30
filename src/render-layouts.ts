import { ViewInstructions, ViewAccounts } from './types'

export function renderLayoutsFiles(instructionsView: ViewInstructions | undefined, accountsView: ViewAccounts | undefined){
    const set = new Set(['string', 'number', 'boolean', 'Buffer', 'PublicKey', 'BN'])
    let accountLayouts: string = ""

    if(accountsView != undefined && accountsView.accounts.length > 0) {
        accountLayouts = 
`import {
` 

        for(const account of accountsView.accounts){
            accountLayouts += 
`  ${account.name.charAt(0).toLowerCase().concat(account.name.slice(1))}Discriminator,
  ${account.name.charAt(0).toLowerCase().concat(account.name.slice(1))}Beet,
`
        }  
        accountLayouts +=
`} from './solita/index.js'
import { ParsedAccounts, ParsedAccountsData } from './solita/index.js'
import { BeetStruct, FixableBeetStruct } from '@aleph-indexer/beet'

export enum AccountType {
        `
        for(const account of accountsView.accounts){
            accountLayouts += 
`   ${account.name} = '${account.name}',
`
        }
        accountLayouts += 
`}

export const ACCOUNT_DISCRIMINATOR: Record<AccountType, Buffer> = {
`
        for(const account of accountsView.accounts){
            accountLayouts += 
`   [AccountType.${account.name}]: Buffer.from(${account.name.charAt(0).toLowerCase().concat(account.name.slice(1))}Discriminator),
`
        }
        accountLayouts += 
`}

export const ACCOUNTS_DATA_LAYOUT: Record<
    AccountType,
    BeetStruct<ParsedAccounts, ParsedAccountsData> |
    FixableBeetStruct<ParsedAccounts, ParsedAccountsData>
> = {
`
        for(const account of accountsView.accounts){
            accountLayouts += 
`   [AccountType.${account.name}]: ${account.name.charAt(0).toLowerCase().concat(account.name.slice(1))}Beet,
`
        }
        accountLayouts += 
`}`
    }

    let ixLayouts: string = ''
    if(instructionsView != undefined && instructionsView.instructions.length > 0) {
        ixLayouts += `import { EventBase } from '@aleph-indexer/core'
import * as solita from './solita/index.js'
import { PublicKey } from '@solana/web3.js'
import BN from 'bn.js'
`

        ixLayouts += `
export enum InstructionType { 
` 
        for(const instruction of instructionsView.instructions){
                ixLayouts += 
`   ${instruction.name} = '${instruction.name}',
`
        }
        ixLayouts += `}

export type InstructionBase = EventBase<InstructionType>

` 
        for(const instruction of instructionsView.instructions){
                ixLayouts += 
`export type ${instruction.name}Info = {
        ` 
                for(const field of instruction.data.fields){
                        if(set.has(field.type)){
                                ixLayouts += `${field.name}: ${field.type},
`                       }
                        else{
                                ixLayouts += `${field.name}: solita.${field.type},
`  
                        }
                }
                ixLayouts += 
`       accounts: solita.${instruction.name}InstructionAccounts
}

export type ${instruction.name}Event = InstructionBase &
    ${instruction.name}Info & {
    type: InstructionType.${instruction.name}
  }

`
        }

        ixLayouts +=
`
export function getInstructionType(data: Buffer): InstructionType | undefined {
  const discriminator = data.slice(0, 8)
  return IX_METHOD_CODE.get(discriminator.toString('ascii'))
}

export const IX_METHOD_CODE: Map<string, InstructionType | undefined > = 
  new Map<string, InstructionType | undefined >([
`
        for(const instruction of instructionsView.instructions){
            ixLayouts += 
`   [Buffer.from(solita.${instruction.name.charAt(0).toLowerCase().concat(instruction.name.slice(1))}InstructionDiscriminator).toString('ascii'), InstructionType.${instruction.name}],
`
        }
        ixLayouts +=
`
])
export const IX_DATA_LAYOUT: Partial<Record<InstructionType, any>> = {
`
        for(const instruction of instructionsView.instructions){
            ixLayouts += 
`   [InstructionType.${instruction.name}]: solita.${instruction.name.charAt(0).toLowerCase().concat(instruction.name.slice(1))}Struct,
`
        }

        ixLayouts += 
`}

export const IX_ACCOUNTS_LAYOUT: Partial<Record<InstructionType, any>> = {
`
        for(const instruction of instructionsView.instructions){
            ixLayouts += 
`   [InstructionType.${instruction.name}]: solita.${instruction.name}Accounts,
`
        }

        ixLayouts += 
`}
    
export type ParsedEventsInfo = 
`
        for(const instruction of instructionsView.instructions){
            ixLayouts += 
`   | ${instruction.name}Info
`
        }

        ixLayouts += 
`       
export type ParsedEvents = 
`
        for(const instruction of instructionsView.instructions){
                ixLayouts += 
`   | ${instruction.name}Event
`
        }
    }

    const indexLayouts = 
`export * from './accounts.js'
export * from './instructions.js'
export * from './solita/index.js'
`

    return { accountLayouts, ixLayouts, indexLayouts }
}