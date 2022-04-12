import Mustache from "mustache";
import * as fs from "fs";
import {
  IdlType,
  IdlTypeDef, IdlTypeDefined,
  IdlTypeDefTyStruct,
  IdlTypeOption,
  ViewStruct,
  ViewField,
  ViewTypes,
  IdlTypeVec,
  IdlTypeArray,
  ViewEnum,
  IdlTypeDefTyEnum
} from "../../types.js";
import { PACKAGE_ROOT, primitivesMap } from "../../constants.js";

function toTypeScriptType(type: IdlType): string | undefined {
  if(type === undefined) return undefined;

  if (typeof type === 'string') {
    return primitivesMap[type]
  }

  // @note: Ascii encoded strings
  if ((type as IdlTypeArray).array && (type as IdlTypeArray).array[0] == 'u8')
    return "string"

  return (type as IdlTypeDefined).defined ??
    toTypeScriptType((type as IdlTypeOption).option) ??
    toTypeScriptType(
      (type as IdlTypeVec).vec ?? (type as IdlTypeArray).array[0]
    ) + "[]"
}

function generateViewStruct(type: IdlTypeDef): ViewStruct {
  let fields: ViewField[] = []
  for (let field of (type.type as IdlTypeDefTyStruct).fields) {
    fields.push({
      name: field.name,
      type: toTypeScriptType(field.type) as string,
      rustType: field.type,
      optional: !!(field.type as IdlTypeOption).option,
      length: (field.type as IdlTypeArray).array[1] ?? undefined
  })
  }
  return {
    name: type.name,
    fields: fields
  }
}

function generateViewEnum(type: IdlTypeDef): ViewEnum {
  return {
    name: type.name,
    variants: (type.type as IdlTypeDefTyEnum).variants
      .map((value, index) => value.name)
  }
}

export function generateTypes(idl: IdlTypeDef[]): string {
  let view: ViewTypes = {
    enums: [],
    types: []
  }
  for (const type of idl) {
    if (type.type.kind === "struct") 
      view.types = [...view.types, generateViewStruct(type)]
    else if (type.type.kind === "enum")
      view.enums = [...view.enums, generateViewEnum(type)]
  }

  const template = fs.readFileSync(
    `${PACKAGE_ROOT}/src/generators/types/template.mustache`,'utf8');
  return Mustache.render(template, view)
}