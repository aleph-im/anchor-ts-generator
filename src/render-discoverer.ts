export function renderDiscovererFiles(Name: string, filename: string){
    const NAME = filename.toUpperCase()
    const naMe = Name.charAt(0).toUpperCase() + Name.slice(1)

    let discoverer: string = 
`import {
    ${NAME}_PROGRAM_ID,
    ${NAME}_PROGRAM_ID_PK,
} from '../../constants.js'
import { AccountType, ${Name}AccountInfo } from '../../types.js'
import {
    ACCOUNT_DISCRIMINATOR,
    ACCOUNTS_DATA_LAYOUT,
} from '../../utils/layouts/accounts.js'
import { solanaPrivateRPCRoundRobin, Utils } from '@aleph-indexer/core'
import bs58 from 'bs58'
import { AccountInfo, PublicKey } from '@solana/web3.js'

export default class ${Name}Discoverer {
    constructor(
        public accountTypes: Set<AccountType> = new Set(Object.values(AccountType)),
        protected cache: Record<string, ${Name}AccountInfo> = {},
    ) {}

    async discoverAccounts(
        type: AccountType,
        index?: number,
        total?: number,
    ): Promise<${Name}AccountInfo[]> {
        const newAccounts = await this.getAllAccountsOfType(type)
        const result: ${naMe}AccountInfo[] = []

        for (const ${naMe}AccountInfo of newAccounts) {
            if (index !== undefined && total !== undefined) {
                const hash = Utils.murmur(${naMe}AccountInfo.address) % total
                if (index !== hash) continue
            }
    
            if (this.cache[${naMe}AccountInfo.address]) continue
    
            this.cache[${naMe}AccountInfo.address] = ${naMe}AccountInfo
            result.push(this.cache[${naMe}AccountInfo.address])
        }

        return result
    }

    getAccountType(address: string): AccountType {
        return this.cache[address].type
    }

    async getAllAccountsOfType(
        type: AccountType,
    ): Promise<${Name}AccountInfo[]> {
        const connection = solanaPrivateRPCRoundRobin.getClient().getConnection()
        const resp = await connection.getProgramAccounts(
        ${NAME}_PROGRAM_ID_PK,
        {
            filters: [
            {
                memcmp: {
                bytes: bs58.encode(ACCOUNT_DISCRIMINATOR[type]),
                offset: 0,
                },
            },
            ],
        },
        )
        return resp.map(
            (value: { pubkey: PublicKey; account: AccountInfo<Buffer> }) =>
                this.deserializeAccountResponse(value, type),
            )
    }

    deserializeAccountResponse(
        resp: { pubkey: PublicKey; account: AccountInfo<Buffer> },
        type: AccountType,
    ): ${Name}AccountInfo {
        const data = ACCOUNTS_DATA_LAYOUT[type].deserialize(resp.account.data)[0]
        const address = resp.pubkey.toBase58()
        // Parsing names from on-chain account data can be complicated at times...
        let name: string = address
        if (Object.hasOwn(data, 'name')) {
        if ((data as any).name instanceof Uint8Array)
            name = ((data as any).name as Uint8Array).toString()
        if ((data as any).name instanceof String) name = (data as any).name
        }
        return {
            name,
            programId: ${NAME}_PROGRAM_ID,
            type,
            address: address,
            data: data,
        }
    }

    async discoverAllAccounts(): Promise<${Name}AccountInfo[]> {
        return await Promise.all(
        [...this.accountTypes].map((type) => this.discoverAccounts(type)),
        ).then((allAccounts) => allAccounts.flat())
    }
}
`
    return { discoverer }
}