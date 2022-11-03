import { ViewInstructions, ViewAccounts } from './types'

export function renderLayoutsFiles(filename: string, instructionsView: ViewInstructions | undefined, accountsView: ViewAccounts | undefined){
    const NAME = filename.toUpperCase()
    const name = filename.toLowerCase()

    let accountLayouts: string = ""

    if(accountsView != undefined && accountsView.length > 0) {
        accountLayouts = 
`import {
` 

        for(const account of accountsView){
            accountLayouts += 
`  ${account.name.charAt(0).toLowerCase().concat(account.name.slice(1))}Discriminator,
  ${account.name.charAt(0).toLowerCase().concat(account.name.slice(1))}Beet,
`
        }  
        accountLayouts +=
`} from './solita/index.js'

export enum AccountType {
        `
        for(const account of accountsView){
            accountLayouts += 
`   ${account.name} = '${account.name}',
`
        }
        accountLayouts += 
`}

export const ACCOUNT_DISCRIMINATOR: Record<AccountType, Buffer> = {
`
        for(const account of accountsView){
            accountLayouts += 
`   [AccountType.${account.name}]: Buffer.from(${account.name.charAt(0).toLowerCase().concat(account.name.slice(1))}Discriminator),
`
        }
        accountLayouts += 
`}

export const ACCOUNTS_DATA_LAYOUT: Record<
    AccountType,
    any
> = {
`
        for(const account of accountsView){
            accountLayouts += 
`   [AccountType.${account.name}]: ${account.name.charAt(0).toLowerCase().concat(account.name.slice(1))}Beet,
`
        }
        accountLayouts += 
`}`
    }

    let ixLayouts: string = ''
    if(instructionsView != undefined && instructionsView.length > 0) {
        ixLayouts += `import { EventBase } from '@aleph-indexer/core'
import * as solita from './solita/index.js'
`

        ixLayouts += `
export enum InstructionType { 
` 
        for(const instruction of instructionsView){
                if(instruction.name == "ConfigLp") continue
                ixLayouts += 
`   ${instruction.name} = '${instruction.name}',
`
        }
        ixLayouts += `}

export type InstructionBase = EventBase<InstructionType> & {
        account: string
}

` 
        for(const instruction of instructionsView){
                if(instruction.name == "ConfigLp") continue
                ixLayouts += 
`export type ${instruction.name}Info = `
                /*if(instruction.args.length != 0){
                        ixLayouts += `solita.${instruction.name}InstructionArgs &`
                }*/
                ixLayouts += 
`   {
        accounts: solita.${instruction.name}InstructionAccounts
        data: solita.${instruction.name}Instruction
`

ixLayouts += `
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
        for(const instruction of instructionsView){
                if(instruction.name == "ConfigLp") continue
            ixLayouts += 
`   [Buffer.from(solita.${instruction.name.charAt(0).toLowerCase().concat(instruction.name.slice(1))}InstructionDiscriminator).toString('ascii'), InstructionType.${instruction.name}],
`
        }
        ixLayouts +=
`
])
export const IX_DATA_LAYOUT: Partial<Record<InstructionType, any>> = {
`
        for(const instruction of instructionsView){
                if(instruction.name == "ConfigLp") continue
            ixLayouts += 
`   [InstructionType.${instruction.name}]: solita.${instruction.name.charAt(0).toLowerCase().concat(instruction.name.slice(1))}Struct,
`
        }

        ixLayouts += 
`}

export const IX_ACCOUNTS_LAYOUT: Partial<Record<InstructionType, any>> = {
`
        for(const instruction of instructionsView){
                if(instruction.name == "ConfigLp") continue
            ixLayouts += 
`   [InstructionType.${instruction.name}]: solita.${instruction.name}Accounts,
`
        }

        ixLayouts += 
`}
    
export type ParsedEventsInfo = 
`
        for(const instruction of instructionsView){
                if(instruction.name == "ConfigLp") continue
            ixLayouts += 
`   | ${instruction.name}Info
`
        }

        ixLayouts += 
`       
export type ParsedEvents = 
`
        for(const instruction of instructionsView){
                if(instruction.name == "ConfigLp") continue
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
    const layoutLayouts =
`import { ${NAME}_PROGRAM_ID } from '../../constants.js'
import { ACCOUNTS_DATA_LAYOUT } from './accounts.js'
import {
  InstructionType,
  IX_DATA_LAYOUT,
  getInstructionType,
  IX_ACCOUNTS_LAYOUT,
} from './instructions.js'

export default {
  [${NAME}_PROGRAM_ID]: {
    name: '${name}',
    programID: ${NAME}_PROGRAM_ID,
    accountLayoutMap: IX_ACCOUNTS_LAYOUT,
    dataLayoutMap: new Proxy(IX_DATA_LAYOUT, {
        get(target: Partial<Record<InstructionType, any>>, p: string | symbol): any {
          const schema = target[p as InstructionType]
          return new Proxy(schema, {get: (target2, p2) => {
            switch (p2) {
              case 'decode':
                return target2.deserialize.bind(target2)
              case 'encode':
                return target2.serialize.bind(target2)
            }
            return target2[p2]
            }
          })
        }
      }),
    accountDataLayoutMap: ACCOUNTS_DATA_LAYOUT,
    eventType: InstructionType,
    getInstructionType,
  },
}`

    return { accountLayouts, ixLayouts, indexLayouts, layoutLayouts }
}