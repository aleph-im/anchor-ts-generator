export function renderIndexersFiles(name: string){
    const dollar = '$'
    const com = '`'
    const Name = name.charAt(0).toUpperCase().concat(name.slice(1))

    const indexerAccount = 
`import {
  SolanaRPC,
  TransactionFetcher,
  FetcherStateLevelStorage,
  InstructionContext,
  EntityStorage,
} from '@aleph-indexer/core'
import { InstructionEvent, ${Name}AccountInfo } from "../types.js";
import { AggregatorEventParser } from '../parsers/aggregator.js'
import { Account } from '../domain/account.js'
import { oracleEventDAL } from '../dal/event.js'

export class AccountIndexer extends TransactionFetcher {
  constructor(
    protected info: ${Name}AccountInfo,
    protected solanaRpc: SolanaRPC,
    protected domain: Account,
    protected eventDAL: EntityStorage<InstructionEvent> = oracleEventDAL,
    protected fetcherStateDAL: FetcherStateLevelStorage,
    protected eventParser: AggregatorEventParser,
    public id = ${com}${dollar}{info.type}:${dollar}{info.address}${com},
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
      solanaRpc
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
    const parsedIxs: InstructionEvent[] = []

    for (const ixCtx of ixsCtx) {
      const parsed = this.eventParser.parse(ixCtx, this.info)
      parsedIxs.push(parsed)
    }

    await this.eventDAL.save(parsedIxs)

    for (const event of parsedIxs) {
      if (!event) continue
      await this.domain.computeEvent(event)
    }
  }
}`
    

const customIndexer =
`import {
  SolanaRPCRoundRobin,
  Utils,
  FetcherStateLevelStorage,
  EntityStorage,
  solanaPrivateRPCRoundRobin,
} from '@aleph-indexer/core'
import { AccountIndexer } from './accountIndexer.js'
import { ProgramName } from '../constants.js'
import { fetcherStateLevelStorage } from '../dal/fetcherState.js'
import {
  aggregatorEventParser,
  AggregatorEventParser,
} from '../parsers/aggregator.js'
import { InstructionEvent } from '../types.js'
import {
  ${name}Program,
  ${Name}Program,
} from '../domain/${name}.js'
import { oracleEventDAL } from '../dal/event.js'
import { Account } from '../domain/account.js'
import { initParsers } from "../parsers/instruction.js";

export class ${Name}Indexer {
  constructor(
    protected domain: ${Name}Program = ${name}Program,
    protected solanaRpcRR: SolanaRPCRoundRobin = solanaPrivateRPCRoundRobin,
    //protected solanaMainRpcRR: SolanaRPCRoundRobin = solanaMainPublicRPCRoundRobin,
    protected eventDAL: EntityStorage<InstructionEvent> = oracleEventDAL,
    protected fetcherStateDAL: FetcherStateLevelStorage = fetcherStateLevelStorage,
    protected oracleParser: AggregatorEventParser = aggregatorEventParser,
    protected aggregatorIndexers: Record<
      string,
      AccountIndexer
    > = {},
  ) {}

  async init(): Promise<void> {
    // @note: Force resolve DNS and cache it before starting fetchers
    await Promise.all(
      [
        ...this.solanaRpcRR.getAllClients(),
        //...this.solanaMainRpcRR.getAllClients(),
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
        this.addAccountIndexer(aggregator)),
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
    const newAccounts = await this.domain.discoverAllAccounts()
    await Promise.allSettled(
      newAccounts.map(async (domain: any) => {
        const indexer = await this.addAccountIndexer(domain)
        if (run) await indexer.run()
      }),
    )
  }

  protected async addAccountIndexer(
    account: Account,
  ): Promise<AccountIndexer> {
    const { address } = account.info

    if (this.aggregatorIndexers[address])
      return this.aggregatorIndexers[address]

    const indexer = new AccountIndexer(
      account.info,
      this.solanaRpcRR.getClient(),
      account,
      this.eventDAL,
      this.fetcherStateDAL,
      this.oracleParser,
    )

    await indexer.init()

    this.aggregatorIndexers[address] = indexer

    return indexer
  }
}`
    return { indexerAccount, customIndexer }
  }