import { ViewInstructions, ViewAccounts } from './types'

export function renderLayoutsFiles(instructionsView: ViewInstructions | undefined, accountsView: ViewAccounts | undefined){

    let accountLayouts: string = 
`import { 
` 
    if(accountsView != undefined) {
      for(let i = 0; i < accountsView.accounts.length; i++){
        accountLayouts += 
`  ${accountsView.accounts[i].name.charAt(0).toLowerCase().concat(accountsView.accounts[i].name.slice(1))}Discriminator,
`
      }  

    }
    accountLayouts +=
`} from '../../../ts-solita'
export { AccountType, ACCOUNTS_DATA_LAYOUT } from '../../../ts/accounts.js'
import { AccountType } from '../types.js'

export const ACCOUNT_METHOD_CODE: Map<string, AccountType | undefined > = 
  new Map<string, AccountType | undefined > ([
`
    if(accountsView != undefined) {
        for(let i = 0; i < accountsView.accounts.length; i++){
            accountLayouts += 
`   [Buffer.from(${accountsView.accounts[i].name.charAt(0).toLowerCase().concat(accountsView.accounts[i].name.slice(1))}Discriminator).toString('ascii'), AccountType.${accountsView.accounts[i].name}],
`
        }
    }
    accountLayouts += 
`])`

    let ixLayouts: string =
`import { 
` 
    if(instructionsView != undefined) {
      for(let i = 0; i < instructionsView.instructions.length; i++){
          ixLayouts += 
`  ${instructionsView.instructions[i].name.charAt(0).toLowerCase().concat(instructionsView.instructions[i].name.slice(1))}InstructionDiscriminator,
`
      }
    }
    ixLayouts +=
`} from '../../../ts-solita'
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
            ixLayouts += 
`   [Buffer.from(${instructionsView.instructions[i].name.charAt(0).toLowerCase().concat(instructionsView.instructions[i].name.slice(1))}InstructionDiscriminator).toString('ascii'), InstructionType.${instructionsView.instructions[i].name}],
`
        }
    }
    ixLayouts += 
`])
`;

    return { accountLayouts, ixLayouts }
  }