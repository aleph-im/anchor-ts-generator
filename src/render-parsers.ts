import { ViewInstructions } from "./types"

export function renderParsersFiles(name: string, instructions: ViewInstructions | undefined){
  name = name.toLowerCase()
  const dollar = '$'
  const com = '`'

  let event: string = 
`import { InstructionContextV1, AlephParsedEvent } from '@aleph-indexer/core'

import {
  UnionInstructions,
  UnionInstructionsInfo,
  InstructionType,
  `
  if(instructions != undefined){
    for (const instruction of instructions.instructions) {
      event += 
` ${instruction.name}Instruction,
`
    }
  }


event += `
} from '../types.js'

export class EventParser {
  parse(ixCtx: InstructionContextV1): UnionInstructions {
    const { ix, parentIx, parentTx } = ixCtx
    const parsed = (
      ix as AlephParsedEvent<InstructionType, UnionInstructionsInfo>
    ).parsed

    const id = ${com}${dollar}{parentTx.signature}${dollar}{
      parentIx ? ${com}:${dollar}{parentIx.index.toString().padStart(2, '0')}${com} : ''
    }:${dollar}{ix.index.toString().padStart(2, '0')}${com}

    const timestamp = parentTx.blockTime
      ? parentTx.blockTime * 1000
      : parentTx.slot

    const baseEvent = {
      ...parsed.info,
      id,
      timestamp,
      type: parsed.type,
    }

    try {
      switch (parsed.type) {
`

if(instructions != undefined){
  for (const instruction of instructions.instructions) {
    event += 
`       case InstructionType.${instruction.name}:
          return {
            ...baseEvent,
          } as ${instruction.name}Instruction

`
  }
}

event += `

        default: {
          console.log('default -> ', parsed.type, id)
          return baseEvent as UnionInstructions
        }
      }
    } catch (e) {
      console.log('error -> ', parsed.type, id, e)
      throw e
    }
  }
}

export const eventParser = new EventParser()
export default eventParser
`
    return { event }
}