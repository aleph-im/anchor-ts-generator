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
    const customIndexer: string = 
`import {
    SolanaRPCRoundRobin,
    Utils,
    FetcherStateLevelStorage,
    EntityStorage,
  } from '@aleph-indexer/core'
  import { solanaRPCRoundRobin, solanaMainPublicRPCRoundRobin } from '../solanaRpc.js'
  import { ${Name}AggregatorIndexer } from './aggregatorIndexer.js'
  import { ProgramName } from '../constants.js'
  import { fetcherStateLevelStorage } from '../dal/fetcherState.js'
  import {
    aggregatorEventParser,
    AggregatorEventParser,
  } from '../parsers/aggregator.js'
  import { OracleEvent } from '../types.js'
  import {
    ${name}Program,
    ${Name}Program,
  } from '../domain/${name}.js'
  import { oracleEventDAL } from '../dal/event.js'
  import { Aggregator } from '../domain/aggregator.js'
  import { initParsers } from "../parsers/instruction.js";
  
  export class ${Name}Indexer {
    constructor(
      protected domain: ${Name}Program = ${name}Program,
      protected solanaRpcRR: SolanaRPCRoundRobin = solanaRPCRoundRobin,
      protected solanaMainRpcRR: SolanaRPCRoundRobin = solanaMainPublicRPCRoundRobin,
      protected eventDAL: EntityStorage<OracleEvent> = oracleEventDAL,
      protected fetcherStateDAL: FetcherStateLevelStorage = fetcherStateLevelStorage,
      protected oracleParser: AggregatorEventParser = aggregatorEventParser,
      protected aggregatorIndexers: Record<
        string,
        ${Name}AggregatorIndexer
      > = {},
    ) {}
  
    async init(): Promise<void> {
      // @note: Force resolve DNS and cache it before starting fetchers
      await Promise.all(
        [
          ...this.solanaRpcRR.getAllClients(),
          ...this.solanaMainRpcRR.getAllClients(),
        ].map(async (client) => {
            const conn = client.getConnection()
            const { result } = await (conn as any)._rpcRequest(
              'getBlockHeight',
              [],
            )
  
            console.log(${com}RPC ${dollar}{conn.endpoint} last height: ${dollar}{result}${com})
          },
        ),
      )
  
      initParsers()
  
      await this.domain.init()
      const aggregatorMap = await this.domain.getPools()
  
      const aggregators = Object.values(aggregatorMap)
  
      await Promise.all(
        aggregators.map(async (aggregator) =>
          this.addAggregatorIndexer(aggregator)),
      )
    }
  
    async run(): Promise<void> {
      await Promise.all(
        Object.entries(this.aggregatorIndexers)
          .map(async ([key, indexer]) =>
          {
            await indexer.run()
          }
        ),
      )
  
      new Utils.JobRunner({
        name: ${com}${dollar}{ProgramName.${Name}} oracle discovery${com},
        interval: 1000 * 60 * 60 * 1, // 1 hour
        startAfter: 1000 * 60 * 60 * 1, // 1 hour
        intervalFn: this.runDiscovery.bind(this, true),
      }).run()
    }
  
    protected async runDiscovery(run = true): Promise<void> {
      const newAggregators = await this.domain.discoverAggregators()
      console.log(newAggregators.length)
      await Promise.allSettled(
        newAggregators.map(async (domain: any) => {
          const indexer = await this.addAggregatorIndexer(domain)
          if (run) await indexer.run()
        }),
      )
    }
  
    protected async addAggregatorIndexer(
      aggregator: Aggregator,
    ): Promise<${Name}AggregatorIndexer> {
      const { address } = aggregator.info
  
      if (this.aggregatorIndexers[address])
        return this.aggregatorIndexers[address]
  
      const indexer = new ${Name}AggregatorIndexer(
        aggregator.info,
        this.solanaRpcRR.getClient(),
        this.solanaMainRpcRR.getClient(),
        aggregator,
        this.eventDAL,
        this.fetcherStateDAL,
        this.oracleParser,
      )
  
      await indexer.init()
  
      this.aggregatorIndexers[address] = indexer
  
      return indexer
    }
  }`
    return { aggregatorIndexers, customIndexer }
  }