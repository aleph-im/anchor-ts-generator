//var Mustache = require('mustache');
import Mustache from 'mustache';
import fs from "fs";
import { queryData } from "./../apolloServer/query.js";

//Fuse in the variable query
//TODO: Needs to be imported later
const view = {
query: queryData
};

//All the hardcoded nonechanging infos for apolloServer
const outputTemplate= "\n" +
"import { ApolloServer } from 'apollo-server'\n" +
"import { graphQlData } from '../../../src/apolloServer/data.js'   //hardcoded data\n" +
"import { Resolvers } from './resolvers.js'\n" +
"import { readFileSync } from 'fs'\n" +
"\n" +
    "const typeDefs = readFileSync('./src/apolloServer/schema.graphql', 'utf8')   //schema\n" +
"\n" +
"// Resolver map\n" +
"const resolvers: Resolvers = {\n" +
"    Query: {\n" +
"   {{query}}" +
"        }\n" +
"    },\n" +
"};\n" +
"\n" +
"\n" +
//    "export function startServer() {\n" +
"// Pass schema definition and resolvers to the\n" +
"// ApolloServer constructor\n" +
"const server = new ApolloServer({ typeDefs, resolvers })\n" +
"\n" +
"// Launch the server\n" +
"server.listen().then( url =>\n" +
"    console.log(`🚀  Server ready at ${url.port}`))\n"
//"} "

const output = Mustache.render(outputTemplate, view);


export function generateApolloServer(){
    fs.writeFileSync('./output/switchboard_v2/graphql/apolloServerGenerated.ts',output);
    //fs.writeFileSync('./src/apolloServer/apolloServerGenerated.ts',output);
}

/*
var view = {
title: "Joe",
calc: function () {
return 2 + 4;
}
};
//const outputTemplate= "{{title}} spends {{calc}}"

const query = "books() {\n" +
"            return books;\n"
*/