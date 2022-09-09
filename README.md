# anchor-ts-generator
Multipurpose .ts file generator, using Anchor's IDLs.

For now to run the indexer generator 'CLI' as for the moment isn't a npm package: 
1. npm run build
2. from root folder (from root folder):
    - node ./dist/index.js -f ./idl/switchboard_v2.json
or
    - node ./dist/index.js -a JUP3c2Uh3WA4Ng34tw6kPd2G4C5BB21Xo36Je1s32Ph


```graphql endpoint
scalar Date

enum InstructionType {
    Create,
    Update,
    Delete
}

enum AccountType {
    Foo,
    Bar
}

schema {
  query: Query
}

type Query {
  instructions: [Instruction]
  accounts(type: AccountType, address: String): [Account]
}

interface Instruction {
    id: String
    type: InstructionType
    timestamp: Int
    programId: String
    account: String
}

type CreateInstruction implements Instruction {
    foo: String
    bar: String
}

interface Account {
    stats: AccessStats
}

type AccountFoo implements Account {
    bar: String
}

type AccessStats {
    accesses1h: InstructionStats
    accesses24h: InstructionStats
    accesses7d: InstructionStats
    accessesTotal: InstructionStats
}

type InstructionStats {
  create: Int
  update: Int
  delete: Int
  unknown: Int
  total: Int
}
```
