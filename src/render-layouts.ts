import { ViewInstructions } from './types'
import { sha256 } from 'js-sha256'

export function renderLayoutsFiles(instructionsView: ViewInstructions | undefined){
    const accountLayouts: string = 
`export { AccountType, ACCOUNTS_CODE, ACCOUNTS_DATA_LAYOUT } from '../../../ts/accounts.js'
`
  
    let ixLayouts: string =
`
import { InstructionType } from '../types.js'
export { IX_METHOD_CODE, IX_DATA_LAYOUT, IX_ACCOUNTS_LAYOUT } from '../../../ts/instructions.js'

export function getInstructionType(data: Buffer): InstructionType | undefined {
    const method = data.slice(0, 1).readUInt8()
    let bufferHumanReadable=[];
    //Extract data from buffer into humanreadable instructiondecriminator
    for (let i = 0; i < 8; i++) {
      bufferHumanReadable.push(data.slice(i, i+1).readUInt8().toString())
    }
    let concatenatedInstruCode = bufferHumanReadable.toString()
  
    //const buffer = new Buffer([123, ..., 69])
    //buffer.encode('ascii')
  
    return ixMap.get(concatenatedInstruCode)
   // return IX_METHOD_CODE[method]
}

export const IX_MAP_DISCRIMINATOR = new Map<string, InstructionType | undefined >([
`
    if(instructionsView != undefined) {
        for(let i = 0; i < instructionsView.instructions.length; i++){
            const ixDiscriminator = Array.from(instructionDiscriminator(instructionsView.instructions[i].name))
            ixLayouts += 
`   ["${ixDiscriminator}", InstructionType.${instructionsView.instructions[i].name}],
`
        }
    }
    ixLayouts += 
`])
`;

    return { accountLayouts, ixLayouts }
  }

  const SIGHASH_GLOBAL_NAMESPACE = 'instruction'

  function instructionDiscriminator(name: string): Buffer {
    return sighash(SIGHASH_GLOBAL_NAMESPACE, name)
  }

  function sighash(nameSpace: string, ixName: string): Buffer {
    let preimage = `${nameSpace}:${ixName}`
    return Buffer.from(sha256.digest(preimage)).slice(0, 8)
  }