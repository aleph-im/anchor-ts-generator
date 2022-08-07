export function renderParsersFiles(name: string){
    const Name = name.charAt(0).toUpperCase().concat(name.slice(1))
    const NAME = name.toUpperCase()
    name = name.toLowerCase()

    let parser: string = 
`import { InstructionContext, AlephParsedEvent } from '@aleph-indexer/core'
import { InstructionEvent, InstructionType, ${Name}AccountInfo } from '../types.js'

export class AccountEventParser {
  constructor() {}

  parse(ixCtx: InstructionContext, info: ${Name}AccountInfo): InstructionEvent {
    const { ix, parentIx, parentTx } = ixCtx

    const id = \`\${parentTx.signature}\${
      parentIx ? \`:\${parentIx.index.toString().padStart(2, '0')}\` : ''
    }:\${ix.index.toString().padStart(2, '0')}\`

    const timestamp = parentTx.blockTime
      ? parentTx.blockTime * 1000
      : parentTx.slot

    let parsed
    if(parentIx !== undefined)
      parsed = (parentIx as AlephParsedEvent<InstructionType, any>).parsed
    else
      parsed = (ix as AlephParsedEvent<InstructionType, any>).parsed

    return {
      id,
      timestamp,
      type: parsed?.type,
      account: info.address,
      programId: ixCtx.parentIx?.programId ?? info.programId,
      accounts: parsed.info.accounts,
      data: parsed.info.data
    }
  }
}

export const accountEventParser = new AccountEventParser()
export default accountEventParser`

const instructionParser: string = 
`import {
  Parsers,
  PARSERS as _PARSERS,
  InstructionParser,
  RawInstruction,
  AlephParsedInstruction,
  AlephParsedParsedInstruction
} from '@aleph-indexer/core'
import { ProgramName, ${NAME}_PROGRAM_ID } from '../constants.js'
import {
  getInstructionType,
  IX_ACCOUNTS_LAYOUT,
  IX_DATA_LAYOUT,
} from '../layouts/instructions.js'
import { InstructionType } from '../types.js'

export const PARSERS = _PARSERS

export class BeetInstructionParser<EventTypeEnum extends string>
  extends InstructionParser<EventTypeEnum>
{
  parse(
    rawIx: RawInstruction | AlephParsedInstruction
  ): RawInstruction | AlephParsedInstruction {
    if (!this.isCompatibleInstruction(rawIx)) return rawIx

    const decoded = this.getInstructionData(rawIx)
    if (!decoded) return rawIx

    const type = this.getInstructionType(decoded)
    if (!type) return rawIx

    const parsedIx: AlephParsedParsedInstruction = rawIx as any
    parsedIx.program = this.programName

    parsedIx.parsed = {
      type,
      info: {
        ...(rawIx as any).parsed?.info,
        data: {
        ...this.parseInstructionData(type, decoded),
        },
        accounts: {
          ...this.parseInstructionAccounts(type, parsedIx)
        },
      },
    }

    return parsedIx
  }
  
  protected parseInstructionData(type: EventTypeEnum, data: Buffer): any {
    try {
      const template = this.dataLayouts[type]
      if (!template) return {}

      return this.dataLayouts[type].deserialize(data)
    } catch (e) {
      console.error(e)
    }
  }
}

export function initParsers(): void {
  const PROGRAMS = PARSERS['PROGRAMS'] as Parsers
  PROGRAMS[${NAME}_PROGRAM_ID] = new BeetInstructionParser<InstructionType>(
    ${NAME}_PROGRAM_ID,
    ProgramName.${Name},
    PARSERS,
    getInstructionType,
    IX_ACCOUNTS_LAYOUT,
    IX_DATA_LAYOUT,
  )
}
`
    return { parser, instructionParser }
}