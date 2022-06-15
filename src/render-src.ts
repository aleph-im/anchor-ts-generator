export function renderSrcFiles(name: string){
  const Name = name.charAt(0).toUpperCase().concat(name.slice(1))
  const NAME = name.toUpperCase()
  let constants: string = 
`export enum ProgramName {
  ${Name} = '${name}',
}

export const ${NAME}_PROGRAM_ID =
  'SW1TCH7qEPTdLsDHRgPuMQjbQxKdH2aBStViMFnt64f'`

    let types: string = 
`export * from "../../ts/types.js"
export * from "../../ts/events.js"
export * from "../../ts/instructions.js"
export * from "../../ts/accounts.js"

import { InstructionType } from "../../ts/instructions.js"

export type RawEvent = {
  programId: string,
  timestamp: number,
  instructionType: InstructionType
}

export type RawEventStats = {

}`

    return { constants, types }
  }