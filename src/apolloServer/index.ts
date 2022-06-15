import * as fs from 'fs';
//const dir = './graphql';
/*
if (!fs.existsSync(dir)){
    fs.mkdirSync(dir);
    fs.writeFileSync('./graphql/types.js','');
    //fs.writeFileSync('./graphql/schema.ts','utf8');
    fs.writeFileSync('./graphql/resolvers.js','');

       // 'export * from \'./schema\'');
}
*/
fs.writeFileSync('./output/switchboard_v2/graphql/index.ts',
    'export * from \'./resolvers\'\n' +
    'export * from \'./types\'\n' );

