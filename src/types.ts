export enum TemplateType {
  Types = "types",
  Instructions = "instructions",
  Events = "events",
  Accounts = "accounts"
}

// -------------------- VIEW --------------------
export type ViewPrimitive =
  | "boolean"
  | "number"
  | "BN"
  | "string"
  | "PublicKey"
  | "Buffer";

export type ViewField = {
  name: string
  type: ViewPrimitive | string
  rustType: string
  optional: boolean
  multiple: boolean
  length?: number
}

export type ViewEnum = {
  name: string
  variants: string[]
}

export type ViewStruct = {
  name: string | undefined
  fields: ViewField[]
}

export type ViewTypes = {
  enums: ViewEnum[],
  types: ViewStruct[]
}

export type ViewAccount = {
  name: string
  multiple: boolean
}

export type ViewInstruction = {
  name: string
  code: number
  data: ViewStruct
  accounts: ViewAccount[]
  beet: string
}

export type ViewInstructions = {
  typeImports: string[]
  beetImports: string[]
  rustTypeImports: string[]
  eventTypeEnum: ViewEnum
  instructions: ViewInstruction[]
}

export type ViewEvent = ViewStruct

export type ViewEvents = {
  typeImports: string[]
  events: ViewStruct[]
}

export type ViewAccounts = {
  accounts: _ViewAccount[]
}

export type _ViewAccount = {
  name: string
  data: ViewStruct
}
// -------------------- RAW IDL --------------------
export type Idl = {
  version: string;
  name: string;
  instructions: IdlInstruction[];
  state?: IdlState;
  accounts?: IdlTypeDef[];
  types?: IdlTypeDef[];
  events?: IdlEvent[];
  errors?: IdlErrorCode[];
  constants?: IdlConstant[];
};

export type IdlConstant = {
  name: string;
  type: IdlType;
  value: string;
};

export type IdlEvent = {
  name: string;
  fields: IdlEventField[];
};

export type IdlEventField = {
  name: string;
  type: IdlType;
  index: boolean;
};

export type IdlInstruction = {
  name: string;
  accounts: IdlAccountItem[];
  args: IdlField[];
};

export type IdlState = {
  struct: IdlTypeDef;
  methods: IdlStateMethod[];
};

export type IdlStateMethod = IdlInstruction;

export type IdlAccountItem = IdlAccount | IdlAccounts;

export type IdlAccount = {
  name: string;
  isMut: boolean;
  isSigner: boolean;
};

// A nested/recursive version of IdlAccount.
export type IdlAccounts = {
  name: string;
  accounts: IdlAccountItem[];
};

export type IdlField = {
  name: string;
  type: IdlType;
};

export type IdlTypeDef = {
  name: string;
  type: IdlTypeDefTy;
};

export type IdlTypeDefTyStruct = {
  kind: "struct";
  fields: IdlTypeDefStruct;
};

export type IdlTypeDefTyEnum = {
  kind: "enum";
  variants: IdlEnumVariant[];
};

export type IdlTypeDefTy = IdlTypeDefTyEnum | IdlTypeDefTyStruct;

type IdlTypeDefStruct = Array<IdlField>;

export type IdlType =
  | "bool"
  | "u8"
  | "i8"
  | "u16"
  | "i16"
  | "u32"
  | "i32"
  | "u64"
  | "i64"
  | "u128"
  | "i128"
  | "bytes"
  | "string"
  | "publicKey"
  | IdlTypeDefined
  | IdlTypeOption
  | IdlTypeVec
  | IdlTypeArray;

// User defined type.
export type IdlTypeDefined = {
  defined: string;
};

export type IdlTypeOption = {
  option: IdlType;
};

export type IdlTypeVec = {
  vec: IdlType;
};

export type IdlTypeArray = {
  array: [IdlType, number];
};

export type IdlEnumVariant = {
  name: string;
  fields?: IdlEnumFields;
};

type IdlEnumFields = IdlEnumFieldsNamed | IdlEnumFieldsTuple;

type IdlEnumFieldsNamed = IdlField[];

type IdlEnumFieldsTuple = IdlType[];

export type IdlErrorCode = {
  code: number;
  name: string;
  msg?: string;
};