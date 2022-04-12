export const primitivesMap: Record<string, string> = {
  u8: "number",
  i8: "number",
  u16: "number",
  i16: "number",
  u32: "number",
  i32: "number",
  f32: "number",
  f64: "number",

  u64: "BN",
  i64: "BN",
  u128: "BN",
  i128: "BN",

  bool: "boolean",
  string: "string",
  publicKey: "PublicKey",
  bytes: "Buffer"
};

export const PACKAGE_ROOT: string = "./"