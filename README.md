# anchor-ts-generator
Aleph Indexer Generator for Solana programs, using Anchor's IDLs.

Currently, you can run the indexer generator CLI here from source: 
1. `npm run build`
2. You have two options, generating your indexer from a local Anchor IDL, or from a remote one:
   1. Providing the IDL path:`node ./dist/index.js -f ./path/to/idl/marinade_finance.json`
   2. Providing your program address `node ./dist/index.js -a MarBmsSgKXdrN1egZf5sqe1TMai9K1rChYNDJgjq7aD`
       (For this option you need to have anchor installed and your program published on https://www.apr.dev/)

## Deploying a new Indexer
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