import { ViewInstructions, ViewAccounts } from './types'

export function renderLayoutsFiles(instructionsView: ViewInstructions | undefined, accountsView: ViewAccounts | undefined){
    let accountLayouts: string = ""

    if(accountsView != undefined && accountsView.accounts.length > 0) {
        accountLayouts = 
`import { 
` 

        for(let i = 0; i < accountsView.accounts.length; i++){
            accountLayouts += 
`  ${accountsView.accounts[i].name.charAt(0).toLowerCase().concat(accountsView.accounts[i].name.slice(1))}Discriminator,
  ${accountsView.accounts[i].name.charAt(0).toLowerCase().concat(accountsView.accounts[i].name.slice(1))}Beet,
`
       }  
    accountLayouts +=
`} from './solita/index.js'
import { AccountType } from '../types.js';
import { ParsedAccounts, ParsedAccountsData } from './solita/index.js'
import { BeetStruct, FixableBeetStruct } from '@aleph-indexer/beet'

export const ACCOUNT_DISCRIMINATOR: Record<AccountType, Buffer> = {
`
        for(let i = 0; i < accountsView.accounts.length; i++){
            accountLayouts += 
`   [AccountType.${accountsView.accounts[i].name}]: Buffer.from(${accountsView.accounts[i].name.charAt(0).toLowerCase().concat(accountsView.accounts[i].name.slice(1))}Discriminator),
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
        for(let i = 0; i < accountsView.accounts.length; i++){
            accountLayouts += 
`   [AccountType.${accountsView.accounts[i].name}]: ${accountsView.accounts[i].name.charAt(0).toLowerCase().concat(accountsView.accounts[i].name.slice(1))}Beet,
`
       }
        accountLayouts += 
`}`
    }

    let ixLayouts: string = ''
    if(instructionsView != undefined && instructionsView.instructions.length > 0) {
        ixLayouts += `import { 
            ` 
        for(let i = 0; i < instructionsView.instructions.length; i++){
          ixLayouts += 
`  ${instructionsView.instructions[i].name.charAt(0).toLowerCase().concat(instructionsView.instructions[i].name.slice(1))}InstructionDiscriminator,
`
        }

    ixLayouts +=
`} from './solita/index.js'
import { InstructionType } from '../types.js'
export { IX_DATA_LAYOUT, IX_ACCOUNTS_LAYOUT } from './ts/instructions.js'

export function getInstructionType(data: Buffer): InstructionType | undefined {
  const discriminator = data.slice(0, 8)
  return IX_METHOD_CODE.get(discriminator.toString('ascii'))
}

export const IX_METHOD_CODE: Map<string, InstructionType | undefined > = 
  new Map<string, InstructionType | undefined >([
`
    for(let i = 0; i < instructionsView.instructions.length; i++){
        ixLayouts += 
`   [Buffer.from(${instructionsView.instructions[i].name.charAt(0).toLowerCase().concat(instructionsView.instructions[i].name.slice(1))}InstructionDiscriminator).toString('ascii'), InstructionType.${instructionsView.instructions[i].name}],
`
    }

        ixLayouts += 
`]);
`;
    }

    return { accountLayouts, ixLayouts }
}