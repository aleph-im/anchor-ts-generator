export function renderIndexersFiles(name: string){
    const dollar = '$'
    const com = '`'
    const Name = name.charAt(0).toUpperCase().concat(name.slice(1))
    const poolIndexers: string = 
`
import {
    SolanaRPC,
    TransactionFetcher,
    FetcherStateLevelStorage,
    InstructionContext,
    EntityStorage,
} from '@aleph-indexer/core'
import { RawEvent, PoolInfo } from '../types.js'
import { PoolEventParser } from '../parsers/poool.js'
import { Pool } from '../domain/pool.js'
import { rawEventDAL } from '../dal/event.js'

export class ${Name}PoolIndexer extends TransactionFetcher {
    constructor(
        protected info: PoolInfo,
        protected solanaRpc: SolanaRPC,
        protected solanaMainPublicRpc: SolanaRPC,
        protected domain: Pool,
        protected eventDAL: EntityStorage<RawEvent> = rawEventDAL,
        protected fetcherStateDAL: FetcherStateLevelStorage,
        protected eventParser: PoolEventParser,
        public id = pooolAccount:${com}${dollar}{info.address}${com},
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
            ${com}[${dollar}{this.info.address} | ${dollar}{this.info.name}] pool indexer started...${com},
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
        const parsedIxs: RawEvent[] = []

        for (const ixCtx of ixsCtx) {
            const parsed = this.eventParser.parse(ixCtx, this.info)
            parsedIxs.push(parsed)
        }

        await this.eventDAL.save(parsedIxs)

        for (const event of parsedIxs) {
            if (!event) continue
            await this.domain.computePoolEvent(event)
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
  import { ${Name}PoolIndexer } from './poolIndexer.js'
  import { ProgramName } from '../constants.js'
  import { fetcherStateLevelStorage } from '../dal/fetcherState.js'
  import {
    poolEventParser,
    poolEventParser,
  } from '../parsers/pool.js'
  import { RawEvent } from '../types.js'
  import {
    ${name}Program,
    ${Name}Program,
  } from '../domain/${name}.js'
  import { rawEventDAL } from '../dal/event.js'
  import { Pool } from '../domain/pool.js'
  import { initParsers } from "../parsers/instruction.js";
  
  export class ${Name}Indexer {
    constructor(
      protected domain: ${Name}Program = ${name}Program,
      protected solanaRpcRR: SolanaRPCRoundRobin = solanaRPCRoundRobin,
      protected solanaMainRpcRR: SolanaRPCRoundRobin = solanaMainPublicRPCRoundRobin,
      protected eventDAL: EntityStorage<RawEvent> = rawEventDAL,
      protected fetcherStateDAL: FetcherStateLevelStorage = fetcherStateLevelStorage,
      protected oracleParser: PoolEventParser = poolEventParser,
      protected poolIndexers: Record<
        string,
        ${Name}PoolIndexer
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
      const poolMap = await this.domain.getPools()
  
      const pools = Object.values(poolMap)
  
      await Promise.all(
        pools.map(async (pool) =>
          this.addPoolIndexer(pool)),
      )
    }
  
    async run(): Promise<void> {
      await Promise.all(
        Object.entries(this.poolIndexers)
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
      const newPools = await this.domain.discoverPools()
      console.log(newPools.length)
      await Promise.allSettled(
        newPools.map(async (domain: any) => {
          const indexer = await this.addPoolIndexer(domain)
          if (run) await indexer.run()
        }),
      )
    }
  
    protected async addPoolIndexer(
      pool: Pool,
    ): Promise<${Name}PoolIndexer> {
      const { address } = pool.info
  
      if (this.poolIndexers[address])
        return this.poolIndexers[address]
  
      const indexer = new ${Name}PoolIndexer(
        pool.info,
        this.solanaRpcRR.getClient(),
        this.solanaMainRpcRR.getClient(),
        pool,
        this.eventDAL,
        this.fetcherStateDAL,
        this.oracleParser,
      )
  
      await indexer.init()
  
      this.poolIndexers[address] = indexer
  
      return indexer
    }
  }`
    return { poolIndexers, customIndexer }
  }