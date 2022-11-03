import {
  ViewEnum,
  ViewField,
  ViewInstruction,
  ViewInstructions,
  ViewStruct,
  ViewTypes,
  _ViewAccount,
  ViewAccounts,
} from "./types" 
import { 
  Idl,
  IdlField,
  IdlInstruction,
  IdlAccount,
  IdlType,
  IdlTypeArray,
  IdlTypeDefined,
  IdlTypeOption,
  IdlTypeVec,
  IdlDefinedTypeDefinition,
  IdlTypeEnum,
  IdlInstructionArg,
  isIdlTypeDataEnum,
  IdlFieldsType
} from "@metaplex-foundation/solita" 
import { primitivesMap, primitivesMapGraphqQl } from "./constants.js" 

export default class IdlTransformer {

  constructor(
    protected idl: Idl,
    protected ignoreImports: Set<string> =
      new Set(["boolean", "number", "string", "BN", "PublicKey", "Buffer"])) {}
  // ------------------------------------------
  // ----------------- PUBLIC -----------------
  // ------------------------------------------

  public generateViewInstructions(
    idl?: IdlInstruction[],
    enumName: string = "InstructionType"
  ): ViewInstructions {
    if (idl === undefined)
      idl = this.idl.instructions

    let eventTypeEnum: ViewEnum = {
      name: enumName,
      variants: []
    } 
    
    let instructions: ViewInstruction[] = [] 
    let code = 0

    for (const ix of idl) {
      const name = ix.name.slice(0, 1).toUpperCase() + ix.name.slice(1) 
      eventTypeEnum.variants.push(name)
      const args = ix.args
      instructions.push({
        name,
        code,
        accounts: ix.accounts.map(account => {
          return {
            name: account.name,
            multiple: true//!!(account as IdlAccounts).accounts
          }
        }),
        args,
      }) 
      code++ 
    }

    return instructions
  }

  public generateViewTypes(idl?: IdlDefinedTypeDefinition[]): ViewTypes {
    if (idl === undefined)
      idl = this.idl.types as IdlDefinedTypeDefinition[]
    let view: ViewTypes = {
      enums: [],
      types: []
    } 
    for (const type of idl) {
      if (type.type.kind === "struct")
        view.types = [...view.types, this.toViewStruct(type)] 
      else if (isIdlTypeDataEnum(type.type))
        view.enums = [...view.enums, this.toViewEnum(type)] 
    }
    return view
  }

  public generateViewAccounts(idl?: IdlAccount[]): ViewAccounts {
    if (idl === undefined)
      idl = this.idl.accounts as IdlAccount[]

    let accounts: _ViewAccount[] = [] 
    
    for (const account of idl) {
      const name = account.name.slice(0, 1).toUpperCase() + account.name.slice(1) 
      const data = this.toViewStruct(account)

      accounts.push({
        name,
        data,
      }) 
    }
    
    return accounts
  }

  // ---------------------------------------------
  // ----------------- PROTECTED -----------------
  // ---------------------------------------------

  protected toTypeScriptType(type: IdlType): string | undefined {
    if (type === undefined) return undefined 

    if (typeof type === "string") {
      return primitivesMap[type] 
    }
    // @note: Ascii encoded strings
    if ((type as IdlTypeArray).array && (type as IdlTypeArray).array[0] === "u8")
      return "string" 

    return (type as IdlTypeDefined).defined ??
      this.toTypeScriptType((type as IdlTypeOption).option ??
      (type as IdlTypeVec).vec ??
      (type as IdlTypeArray).array[0]) 
  }

  protected toGraphQLTypes(type: IdlType): string {
    if (type === undefined) return "undefined" 

    if (typeof type === "string") {
      return primitivesMapGraphqQl[type] 
    }
    // @note: Ascii encoded strings
    if ((type as IdlTypeArray).array && (type as IdlTypeArray).array[0] === "u8")
      return "GraphQLString" 

    return (type as IdlTypeDefined).defined ??
      this.toGraphQLTypes((type as IdlTypeOption).option ??
      (type as IdlTypeVec).vec ??
      (type as IdlTypeArray).array[0]) 
  }

  protected toRustType(type: IdlType): string {
    let name = type as string
    let option = type as IdlTypeOption

    if ((type as IdlTypeArray).array) name = "blob"
    if ((type as IdlTypeVec).vec) name = "vec"
    if (this.isIdlTypeOption(type)) {
      option = (type as IdlTypeOption).option as IdlTypeOption
      if (this.isIdlDefined(option)) {
        name = (option as IdlTypeDefined).defined as string
      }
      else{
        name = (type as IdlTypeOption).option as string
      }
    }
    if (this.isIdlDefined(type)) name = ((type as IdlTypeDefined).defined)
    name = name.slice(0, 1).toLowerCase() + name.slice(1) 
    return name
  }

  protected isIdlTypeOption(type: IdlType): type is IdlTypeOption {
    return (type as IdlTypeOption).option !== undefined
  }
  protected isIdlDefined(type: IdlType): type is IdlTypeDefined {
    return (type as IdlTypeDefined).defined !== undefined
  }

  protected toViewField(field: IdlField ): ViewField {
    return {
      name: field.name,
      type: this.toTypeScriptType(field.type) as string,
      rustType: this.toRustType(field.type),
      graphqlType: this.toGraphQLTypes(field.type),
      optional: !!(field.type as IdlTypeOption).option,
      multiple: !!((field.type as IdlTypeVec).vec ?? (field.type as IdlTypeArray).array),
      length: (field.type as IdlTypeArray).array ?
        (field.type as IdlTypeArray).array[1] : undefined
    } 
  }

  protected toViewStruct(type: IdlDefinedTypeDefinition | IdlAccount | IdlInstructionArg): ViewStruct {
    let viewFields: ViewField[] = []

    const fields = ((type as IdlDefinedTypeDefinition)?.type as IdlFieldsType)?.fields ?? type;

    for (const field of fields)
      viewFields.push(this.toViewField(field))

    return {
      name: type.name,
      fields: viewFields
    } 
  }

  protected toViewEnum(type: IdlDefinedTypeDefinition): ViewEnum {
    return {
      name: type.name,
      variants: (type.type as IdlTypeEnum).variants
        .map(value => value.name)
    } 
  }
}