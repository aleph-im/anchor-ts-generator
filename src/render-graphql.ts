export function renderGraphQLFiles(name: string){
    const index: string = 
`
import { GraphQLServer } from '@aleph-indexer/core'

import { ${name}GraphQLSchema } from './schema.js'
import { ${name}GraphQLResolvers } from './resolvers.js'
import { ${name}EventDAL } from '../dal/event.js'
import { ${name} } from '../domain/validator.js'

const portSchema = new ${name}GraphQLSchema(
  new ${name}GraphQLResolvers(${name}EventDAL, ${name}),
)

export const graphQLServer = new GraphQLServer([portSchema])
export default graphQLServer
`

    const resolvers: string =
`

`

    const schema: string = 
`

`

    const GQLtypes: string = 
`
    
`

    return { index, resolvers, schema, GQLtypes }
}