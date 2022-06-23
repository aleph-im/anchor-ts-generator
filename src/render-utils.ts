export function renderUtilsFiles(fileName: string){
    const NAME = fileName.toUpperCase()
    const utilsIndex: string = 
`export * from './utils'`

    const utils: string = 
`import {
    AlephParsedInnerInstruction,
    AlephParsedInstruction,
    AlephParsedParsedInstruction,
    RawInstruction,
} from '@aleph-indexer/core'
import { InstructionEvent } from '../types'
import { ${NAME}_PROGRAM_ID } from '../constants'
  
export function isParsedIx(
    ix: RawInstruction | AlephParsedInstruction | AlephParsedInnerInstruction,
): ix is AlephParsedParsedInstruction {
    return 'parsed' in ix
}
  
export function isOracleProgramInstruction(
    ix: RawInstruction | AlephParsedInstruction | AlephParsedInnerInstruction,
    account: string = ${NAME}_PROGRAM_ID,
): ix is InstructionEvent {
    return ix.programId === account
}
  
export function filterZeroBytes(buffer: Buffer): Buffer {
    return buffer.filter((value) => value != 0) as Buffer
}`
    return { utilsIndex, utils }
}