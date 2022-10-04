import { ViewInstructions } from "./types"

export function renderParsersFiles(instructions: ViewInstructions | undefined){

  let event: string = 
`import { InstructionContextV1, AlephParsedEvent } from '@aleph-indexer/core'

import {
  ParsedEvents,
  ParsedEventsInfo,
  InstructionType,
  `
  if(instructions != undefined){
    for (const instruction of instructions.instructions) {
      event += 
` ${instruction.name}Event,
`
    }
  }


event += `
} from '../types.js'

export class EventParser {
  parse(ixCtx: InstructionContextV1): ParsedEvents {
    const { ix, parentIx, parentTx } = ixCtx
    const parsed = (ix as AlephParsedEvent<InstructionType, ParsedEventsInfo>)
      .parsed

    const id = \`\${parentTx.signature}\${
      parentIx ? \` :\${parentIx.index.toString().padStart(2, '0')}\` : ''
    }:\${ix.index.toString().padStart(2, '0')}\` 

    const timestamp = parentTx.blockTime
      ? parentTx.blockTime * 1000
      : parentTx.slot

    const baseEvent = {
      ...parsed.info,
      id,
      timestamp,
      type: parsed.type,
      account: parentTx.account
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
          } as ${instruction.name}Event

`
  }
}

event += `

        default: {
          console.log('default -> ', parsed.type, id)
          return baseEvent as ParsedEvents
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