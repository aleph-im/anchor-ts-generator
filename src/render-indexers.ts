export function renderIndexersFiles(name: string){
    const dollar = '$'
    const com = '`'
    const Name = name.charAt(0).toUpperCase().concat(name.slice(1))
    const aggregatorIndexers: string = 
`
import {
    SolanaRPC,
    TransactionFetcher,
    FetcherStateLevelStorage,
    InstructionContext,
    EntityStorage,
} from '@aleph-indexer/core'
import { AggregatorInfo, OracleEvent } from '../types.js'
import { AggregatorEventParser } from '../parsers/aggregator.js'
import { Aggregator } from '../domain/aggregator.js'
import { oracleEventDAL } from '../dal/event.js'

export class ${Name}AggregatorIndexer extends TransactionFetcher {
    constructor(
        protected info: AggregatorInfo,
        protected solanaRpc: SolanaRPC,
        protected solanaMainPublicRpc: SolanaRPC,
        protected domain: Aggregator,
        protected eventDAL: EntityStorage<OracleEvent> = oracleEventDAL,
        protected fetcherStateDAL: FetcherStateLevelStorage,
        protected eventParser: AggregatorEventParser,
        public id = aggregatorAccount:${com}${dollar}{info.address}${com},
    ) {
        super(
        {
            id,
            fetcherAddresses: [info.address],
            forwardJobOptions: {
                intervalMax: 1000 * 60 * 5,
                iterationFetchLimit: Number.MAX_SAFE_INTEGER,
            },
            backwardJobOptions: {
                interval: 1000 * 120,
                iterationFetchLimit: 1000,
                jitter: 1000 * 60,
            },
        },
        fetcherStateDAL,
        solanaRpc,
        solanaMainPublicRpc,
        )
    }

    async run(): Promise<boolean> {
        console.log(
            ${com}[${dollar}{this.info.address} | ${dollar}{this.info.name}] aggregator indexer started...${com},
        )
        await super.run()
        return true
    }

    protected async filterInstructions(
        ixsContext: InstructionContext[],
    ): Promise<InstructionContext[]> {
        return ixsContext // @note: Do not filter, we need all interactions
    }

    protected async indexInstructions(
        ixsCtx: InstructionContext[],
    ): Promise<void> {
        const parsedIxs: OracleEvent[] = []

        for (const ixCtx of ixsCtx) {
            const parsed = this.eventParser.parse(ixCtx, this.info)
            parsedIxs.push(parsed)
        }

        await this.eventDAL.save(parsedIxs)

        for (const event of parsedIxs) {
            if (!event) continue
            await this.domain.computeAggregatorEvent(event)
        }
    }
}  
`
  
    return aggregatorIndexers
  }