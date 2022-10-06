import { ViewAccounts } from "./types"

export function renderDomainFiles(Name: string, filename: string, accounts: ViewAccounts | undefined){
  const NAME = filename.toUpperCase()

  const account = `import { StorageStream } from '@aleph-indexer/core'
import {
  AccountTimeSeriesStatsManager,
  AccountTimeSeriesStats,
  AccountStatsFilters,
  AccountStats,
} from '@aleph-indexer/framework'
import { EventDALIndex, EventStorage } from '../dal/event.js'
import { ParsedEvents, ${Name}AccountInfo } from '../types.js'

export class AccountDomain {
  constructor(
    public info: ${Name}AccountInfo,
    protected eventDAL: EventStorage,
    protected timeSeriesStats: AccountTimeSeriesStatsManager,
  ) {}

  async updateStats(now: number): Promise<void> {
    await this.timeSeriesStats.process(now)
  }

  async getTimeSeriesStats(
    type: string,
    filters: AccountStatsFilters,
  ): Promise<AccountTimeSeriesStats> {
    return this.timeSeriesStats.getTimeSeriesStats(type, filters)
  }

  async getStats(): Promise<AccountStats> {
    return this.timeSeriesStats.getStats()
  }

  getEventsByTime(
    startDate: number,
    endDate: number,
    opts: any,
  ): Promise<StorageStream<string, ParsedEvents>> {
    return this.eventDAL
      .useIndex(EventDALIndex.AccoountTimestamp)
      .getAllFromTo(
        [this.info.address, startDate],
        [this.info.address, endDate],
        opts,
      )
  }
}
`
  const worker = `import { StorageStream, Utils } from '@aleph-indexer/core'
import {
  IndexerDomainContext,
  AccountIndexerConfigWithMeta,
  InstructionContextV1,
  IndexerWorkerDomain,
  IndexerWorkerDomainWithStats,
  createStatsStateDAL,
  createStatsTimeSeriesDAL,
  AccountTimeSeriesStats,
  AccountStatsFilters,
  AccountStats,
} from '@aleph-indexer/framework'
import { eventParser as eParser } from '../parsers/event.js'
import { createEventDAL } from '../dal/event.js'
import { ParsedEvents, ${Name}AccountInfo } from '../types.js'
import { AccountDomain } from './account.js'
import { createAccountStats } from './stats/timeSeries.js'
import { ${NAME}_PROGRAM_ID } from '../constants.js'

const { isParsedIx } = Utils

export default class IndexerDomain
  extends IndexerWorkerDomain
  implements IndexerWorkerDomainWithStats
{
  protected accounts: Record<string, AccountDomain> = {}

  constructor(
    protected context: IndexerDomainContext,
    protected eventParser = eParser,
    protected eventDAL = createEventDAL(context.dataPath),
    protected statsStateDAL = createStatsStateDAL(context.dataPath),
    protected statsTimeSeriesDAL = createStatsTimeSeriesDAL(context.dataPath),
    protected programId = ${NAME}_PROGRAM_ID,
  ) {
    super(context)
  }

  async init(): Promise<void> {
    return
  }

  async onNewAccount(
    config: AccountIndexerConfigWithMeta<${Name}AccountInfo>,
  ): Promise<void> {
    const { account, meta } = config
    const { apiClient } = this.context

    const accountTimeSeries = await createAccountStats(
      account,
      apiClient,
      this.eventDAL,
      this.statsStateDAL,
      this.statsTimeSeriesDAL,
    )

    this.accounts[account] = new AccountDomain(meta, this.eventDAL, accountTimeSeries)

    console.log('Account indexing', this.context.instanceName, account)
  }

  async updateStats(account: string, now: number): Promise<void> {
    const actual = this.getAccount(account)
    await actual.updateStats(now)
  }

  async getTimeSeriesStats(
    account: string,
    type: string,
    filters: AccountStatsFilters,
  ): Promise<AccountTimeSeriesStats> {
    const oracle = this.getAccount(account)
    return oracle.getTimeSeriesStats(type, filters)
  }

  async getStats(account: string): Promise<AccountStats> {
    return this.getAccountStats(account)
  }

  // ------------- Custom impl methods -------------------

  async getAccountInfo(reserve: string): Promise<${Name}AccountInfo> {
    const res = this.getAccount(reserve)
    return res.info
  }

  async getAccountStats(reserve: string): Promise<AccountStats> {
    const res = this.getAccount(reserve)
    return res.getStats()
  }

  getAccountEventsByTime(
    account: string,
    startDate: number,
    endDate: number,
    opts: any,
  ): Promise<StorageStream<string, ParsedEvents>> {
    const res = this.getAccount(account)
    return res.getEventsByTime(startDate, endDate, opts)
  }

  protected async filterInstructions(
    ixsContext: InstructionContextV1[],
  ): Promise<InstructionContextV1[]> {
    return ixsContext.filter(({ ix }) => {
      return isParsedIx(ix) && ix.programId === this.programId
    })
  }

  protected async indexInstructions(
    ixsContext: InstructionContextV1[],
  ): Promise<void> {
    const parsedIxs = ixsContext.map((ix) => this.eventParser.parse(ix))

    console.log(\`indexing \${ixsContext.length} parsed ixs\`)

    await this.eventDAL.save(parsedIxs)
  }

  private getAccount(account: string): AccountDomain {
    const accountInstance = this.accounts[account]
    if (!accountInstance) throw new Error(\`Account \${account} does not exist\`)
    return accountInstance
  }
}
`

  let mainDomain = `import { StorageStream } from '@aleph-indexer/core'
import {
  IndexerMainDomain,
  IndexerMainDomainWithDiscovery,
  IndexerMainDomainWithStats,
  AccountIndexerConfigWithMeta,
  IndexerMainDomainContext,
  AccountStats,
} from '@aleph-indexer/framework'
import {
  Global${Name}Stats,
  ${Name}Stats,
  ${Name}ProgramData,
  AccountType,
  ${Name}AccountInfo,
  ParsedEvents,
} from '../types.js'
import ${Name}Discoverer from './discoverer/${filename}.js'

export default class MainDomain
  extends IndexerMainDomain
  implements IndexerMainDomainWithDiscovery, IndexerMainDomainWithStats
{
  protected stats!: Global${Name}Stats

  constructor(
    protected context: IndexerMainDomainContext,
    protected discoverer: ${Name}Discoverer = new ${Name}Discoverer(),
  ) {
    super(context, {
      discoveryInterval: 1000 * 60 * 60 * 1,
      stats: 1000 * 60 * 5,
    })
  }

  async discoverAccounts(): Promise<
    AccountIndexerConfigWithMeta<${Name}AccountInfo>[]
  > {
    const accounts = await this.discoverer.loadAccounts()

    return accounts.map((meta) => {
      return {
        account: meta.address,
        meta,
        index: {
          transactions: {
            chunkDelay: 0,
            chunkTimeframe: 1000 * 60 * 60 * 24,
          },
          content: false,
        },
      }
    })
  }

  async getAccounts(
    includeStats?: boolean,
  ): Promise<Record<string, ${Name}ProgramData>> {
    const accounts: Record<string, ${Name}ProgramData> = {}

    await Promise.all(
      Array.from(this.accounts || []).map(async (account) => {
        const actual = await this.getAccount(account, includeStats)
        accounts[account] = actual as ${Name}ProgramData
      }),
    )

    return accounts
  }

  async getAccount(
    account: string,
    includeStats?: boolean,
  ): Promise<${Name}ProgramData> {
    const info = (await this.context.apiClient.invokeDomainMethod({
      account,
      method: 'getAccountInfo',
    })) as ${Name}AccountInfo

    if (!includeStats) return { info }

    const { stats } = (await this.context.apiClient.invokeDomainMethod({
      account,
      method: 'get${Name}Stats',
    })) as AccountStats<${Name}Stats>

    return { info, stats }
  }

  async getAccountEventsByTime(
    account: string,
    startDate: number,
    endDate: number,
    opts: any,
  ): Promise<StorageStream<string, ParsedEvents>> {
    const stream = await this.context.apiClient.invokeDomainMethod({
      account,
      method: 'getAccountEventsByTime',
      args: [startDate, endDate, opts],
    })

    console.log('getAccountEventsByTime stream', typeof stream)
    return stream as StorageStream<string, ParsedEvents>
  }

  async updateStats(now: number): Promise<void> {
    this.stats = await this.computeGlobalStats()
  }

  async getGlobalStats(addresses?: string[]): Promise<Global${Name}Stats> {
    if (!addresses || addresses.length === 0) {
      if (!this.stats) {
        await this.updateStats(Date.now())
      }

      return this.stats
    }

    return this.computeGlobalStats(addresses)
  }

  async computeGlobalStats(
    accountAddresses?: string[],
  ): Promise<Global${Name}Stats> {
    const accountsStats = await this.getAccountStats(accountAddresses)
    const globalStats: Global${Name}Stats = this.getNewGlobalStats()

    for (const accountStats of accountsStats) {
      if (!accountStats.stats) continue

      const { totalRequests, totalUniqueAccessingPrograms, totalAccounts } =
      accountStats.stats

      const type = this.discoverer.getAccountType(accountStats.account)

      globalStats.totalAccounts[type] += totalAccounts[type]
      globalStats.totalRequests += totalRequests
      globalStats.totalUniqueAccessingPrograms += totalUniqueAccessingPrograms

    }
    return globalStats
  }

  getNewGlobalStats(): Global${Name}Stats {
    return {
      totalRequests: 0,
      totalAccounts: {`
  if(accounts){
    for(const account of accounts.accounts){
      mainDomain += `
        [AccountType.${account.name}]: 0,`
    }
  }
  mainDomain += `
      },
      totalUniqueAccessingPrograms: 0,
    }
  }
}
`
  
  return { account, worker, mainDomain }
  }