# anchor-ts-generator
Multipurpose .ts file generator, using Anchor's IDLs.

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

type Instruction {
    
}

interface Account {
    some: String
    other: Int
    stuff: String
    from: Int
    chain: String
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