# anchor-ts-generator

Aleph Indexer Generator for Solana programs, using Anchor's IDLs. It generates all boilerplate necessary for starting your own Solana indexer on our [open-source, multi-threaded node.js framework](https://github.com/aleph-im/solana-indexer-framework), using [moleculer](https://moleculer.services/).

Currently, you can run the indexer generator CLI here from source:
1. `npm run build` to build the CLI
2. You have three options, generating your indexer either from a local Anchor IDL file or from a remote one:
  1. Providing the IDL path:`node ./dist/index.js -f ./path/to/idl/marinade_finance.json`
  2. Providing your program address `node ./dist/index.js -a MarBmsSgKXdrN1egZf5sqe1TMai9K1rChYNDJgjq7aD`
     (For this option you need to have anchor installed and your program published on https://www.apr.dev/)
  3. If you provide both, the local IDL will be used and the address will be inserted into the generated code, where
     necessary.

## Example Usage
Clone the solana-indexer-framework repo, in which you run the generated indexer:
```bash
cd ../
git clone https://github.com/aleph-im/solana-indexer-framework.git
```

Generate a new indexer for the Marinade Finance program into the cloned repo:
```bash
node ./dist/index.js -a MarBmsSgKXdrN1egZf5sqe1TMai9K1rChYNDJgjq7aD -o ../solana-indexer-framework/packages/marinade_finance
```

Run the generated indexer:
```bash
cd ../solana-indexer-framework/
npm run start marinade_finance
```

It is now running a GraphQL server on http://localhost:8080.

## Supported Queries
### Total program accounts and instruction invocations
Return global stats about the amount of accounts and total amount of instructions processed by the indexer:
```graphql
{
    globalStats {
        totalAccounts {
            State
            TicketAccountData
        }
        totalAccesses
        totalAccessesByProgramId
    }
}
```

### Accounts
Get all accounts, their addresses, Anchor type and contents:
```graphql
{
  accounts {
    address
    type
    data {
      ...on State {
        msolMint
        adminAuthority
        liqPool {
          lpLiquidityTarget
          lpMaxFee {
            basisPoints
          }
          lpMinFee {
            basisPoints
          }
          treasuryCut {
            basisPoints
          }
        }
        # and other fields, see generated GraphQL schema
      }
    }
  }
}
```

### Indexing state
Get the current progress of the indexer. Accurate means that the indexer fetched all transaction signatures belonging to
that account, progress tells you how much percent of all transactions have been fetched and processed.
```graphql
{
  accountState(account: "8szGkuLTAux9XMgZ2vtY39jVSowEcpBfFfD8hXSEqdGC") {
    accurate
    progress
    pending
    processed
  }
}
```

### General account stats
Get accesses in the last hour, day, week or in total:
```graphql
{
  accountStats(account: "8szGkuLTAux9XMgZ2vtY39jVSowEcpBfFfD8hXSEqdGC") {
    stats {
      last1h {
        accesses
      }
      last24h {
        accesses
      }
      last7d {
        accesses
      }
      total {
        accesses
      }
    }
  }
}
```

### Account time series stats
Get aggregated accesses by signing wallet and month:
```graphql
{
  accountTimeSeriesStats(timeFrame:Month, account: "8szGkuLTAux9XMgZ2vtY39jVSowEcpBfFfD8hXSEqdGC", type: "access") {
    series {
      date
      value {
        ...on MarinadeFinanceInfo {
          accessesByProgramId
        }
      }
    }
  }
}
```

### Processed instructions (Events)
Get the latest 1000 processed instructions:
```graphql
{
  events(account: "8szGkuLTAux9XMgZ2vtY39jVSowEcpBfFfD8hXSEqdGC", limit: 10) {
    id
    timestamp
    type
    signer
    ...on OrderUnstakeEvent {
      data {
        msolAmount
      }
    }
    ...on AddLiquidityEvent {
      data {
        lamports
      }
    }
    ...on DepositEvent {
      data {
        lamports
      }
    }
    ...on LiquidUnstakeEvent {
      data {
        msolAmount
      }
    }
    ...on RemoveLiquidityEvent {
      data {
        tokens
      }
    }
  }
}
```

## Deploying an Indexer to Aleph.im
For an example deployment, see this PR: https://github.com/aleph-im/anchor-ts-generator/pull/20/files
- Make a fork of this project in your GitHub Workspace.
- Build the indexer using the anchor address or the IDL.
- Substitute the `INDEXER` variable inside `.github/workflows/main.yml` file, changing it by your project's name:
```yml
- name: Build and export
  uses: docker/build-push-action@v3
  with:
    context: .
    tags: aleph-framework:latest
    outputs: type=docker,dest=/tmp/aleph-framework.tar
    build-args: |
      INDEXER=XXXXXX
```
- Once your indexer code is finished and working, create a PR on GitHub and push it.
- The GitHub action will be triggered, and you will be able to download the final root filesystem of your indexer, ready to be pushed to Aleph network.
- You will find this rootfs file inside `Actions` -> `"Name of your last commit"` -> `Artifacts` -> `rootfs.squashfs`.
- Download it, **upload this `rootfs.squashfs` runtime file to IPFS, pin it,** and you will be ready to proceed with the deployment.

### Deploying with GitHub Actions

**_Using this method you will need to store you wallet private key's inside GitHub Secrets._**

- Go to repository `Secrets` tab and add a new one like `WALLET_PRIVATE_KEY`.
- Inside `.github/workflows/main.yml` file, uncomment the last action that is commented and ensure to replace `XXXXXX` with the IPFS hash of your `rootfs.squashfs` file uploaded:
```yml
- uses: aleph-im/aleph-github-actions/publish-runtime@main
  id: publish-runtime
  with:
    fs_path: ./rootfs.squashfs
    private-key: ${{ secrets.WALLET_PRIVATE_KEY }}
    runtime_hash: XXXXXX
    indexer: your-indexer-directory-name
```
- Pushing this new changes with a PR or a simple commit to the repository, the GitHub action will be triggered.
- Once the action finishes successfully, inside `Actions` -> `"Name of your last commit"` -> `Generate runtime` job -> `Publish runtime` step, you will be able to see the VM address:
```
https://aleph-vm-lab.aleph.cloud/vm/XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

### Deploying in Local Machine

#### Requirements

- Have installed `aleph-client` (See https://github.com/aleph-im/aleph-client).

#### Steps

- Pin your `rootfs.squashfs` runtime file hash (that is already uploaded to IPFS) inside Aleph network:
```shell
aleph pin RUNTIME_HASH --private-key WALLET_PRIVATE_KEY
```
- Download the program files in the current directory through [here](https://github.com/aleph-im/aleph-github-actions/tree/main/publish-runtime).
- Deploy the program inside a persistent VM at Aleph network (changing INDEXER by your indexer name):
```shell
aleph program ./program "run.sh INDEXER" --persistent --private-key WALLET_PRIVATE_KEY --runtime RUNTIME_HASH
```
- Once command finishes, you will be able to see the VM address:
```
https://aleph-vm-lab.aleph.cloud/vm/XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```
