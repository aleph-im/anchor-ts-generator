import { ViewInstructions } from './types'
import { sha256 } from 'js-sha256'
import bs58 from "bs58"

export function renderLayoutsFiles(instructionsView: ViewInstructions | undefined){
    const accountLayouts: string = 
`export { AccountType, ACCOUNTS_CODE, ACCOUNTS_DATA_LAYOUT } from '../../../ts/accounts.js'
`
  
    let ixLayouts: string =
`
import { InstructionType } from '../types.js'
export { IX_DATA_LAYOUT, IX_ACCOUNTS_LAYOUT } from '../../../ts/instructions.js'

export function getInstructionType(data: Buffer): InstructionType | undefined {
  const discriminator = new Buffer(data.slice(0, 8).readUInt8())
  return IX_METHOD_CODE.get(discriminator.toString('ascii'))
}

export const IX_METHOD_CODE = new Map<string, InstructionType | undefined >([
`
    if(instructionsView != undefined) {
        for(let i = 0; i < instructionsView.instructions.length; i++){
            const ixDiscriminator = Buffer.from(sha256.digest(`instruction:${instructionsView.instructions[i].name}`)).slice(0, 8)
            ixLayouts += 
`   ["${bs58.encode(ixDiscriminator)}", InstructionType.${instructionsView.instructions[i].name}],
`
        }
    }
    ixLayouts += 
`])
`;

    return { accountLayouts, ixLayouts }
  }