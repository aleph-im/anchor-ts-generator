# anchor-ts-generator
Multipurpose .ts file generator, using Anchor's IDLs.

For now to run the indexer generator 'CLI' as for the moment isn't a npm package: 
1. npm run build
2. You have two options, from root folder:
    - Providing the IDL path: node ./dist/index.js -f ./path/to/idl/marinade_finance.json

    - Providing your program address: node ./dist/index.js -a JUP3c2Uh3WA4Ng34tw6kPd2G4C5BB21Xo36Je1s32Ph
    (For this option you need to have anchor installed and your program published on https://www.apr.dev/)

## Generate the indexer
To generate the indexer, you need to have the Anchor IDL file, or the program ID of the Anchor program.
```bash
# Generate the indexer from the IDL file
alix generate -f ./path/to/idl.json

# Or generate the indexer from the program ID
alix generate -a <program_id>
```

## Deploy the indexer
To deploy the indexer to the Aleph network, you need:
- your indexer source code
- the [GitHub CLI](https://cli.github.com/) installed
- a GitHub account
- an account and its private key for any of the Aleph-supported blockchains (Solana, Ethereum, Tezos, EOS, Cosmos, Polkadot, Kusama, NULS)
- ALEPH tokens on your account

```bash
# Deploy the indexer to the Aleph network
alix deploy -f ./path/to/indexer-package -l ./path/to/solana-indexer-library -k /path/to/key.json
```

The `deploy` command will:
- fork the [solana-indexer-library](https://github.com/aleph-im/solana-indexer-library) repository, if it doesn't exist yet
- set up GitHub Secrets with your private key
- create a new branch with the indexer source code
- create a new PR, which will trigger the GitHub Actions workflow
- the workflow will build the indexer rootfs, and deploy it to the Aleph network
- print the indexer's address like this: `https://aleph-vm-lab.aleph.cloud/vm/XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX`

Directions on how to deploy the indexer manually on your machine (without using GitHub workflows) are available in the [documentation](https://docs.aleph.im/developers/aleph-ts-generator).