import * as fs from 'fs';
//const dir = './graphql';


export function generateIndexGraphql(){
    //generate the exportfile for the generated resolvers and types
    fs.writeFileSync('./output/switchboard_v2/graphql/index.ts',
        'export * from \'./resolvers.js\'\n' +
        'export * from \'./types.js\'\n' );
    console.log("Wrote index file")

}


/*
if (!fs.existsSync(dir)){
    fs.mkdirSync(dir);
    fs.writeFileSync('./graphql/types.js','');
    //fs.writeFileSync('./graphql/schema.ts','utf8');
    fs.writeFileSync('./graphql/resolvers.js','');

       // 'export * from \'./schema\'');
}
*/


