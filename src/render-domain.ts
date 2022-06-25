export function renderDomainFiles(name: string){
    const Name = name.charAt(0).toUpperCase().concat(name.slice(1))
    const NAME = name.toUpperCase()

    const account: string = 
`import { DateTime, Interval } from 'luxon'
import { Utils, SolanaPool, EntityStorage } from '@aleph-indexer/core'
import {
  InstructionEvent,
  HourlyStats,
  ${Name}AccountInfo, 
  ${Name}AccountStats
} from "../types";
import eventProcessor, { EventProcessor } from './processor'

const { sortTimeStatsMap } = Utils

export class Account extends SolanaPool<${Name}AccountInfo, ${Name}AccountStats> {
  private _shouldUpdate = true

  constructor(
    public info: ${Name}AccountInfo,
    protected startDate: number,
    protected eventDAL: EntityStorage<InstructionEvent>,
    protected processor: EventProcessor = eventProcessor
  ) {
    super(info, {
      requestsStatsByHour: {},

      requests1h: 0,
      requests24h: 0,
      requests7d: 0,
      requestsTotal: 0,

      accessingPrograms: new Set<string>([]),
    })
  }

  async init(): Promise<void> {
    console.log('Init program ', this.info.name, this.info.address)
    await this.initEvents()
  }

  protected async initEvents(): Promise<void> {
    const events = this.eventDAL
      .useIndex('account_timestamp')
      .getAllFromTo([this.info.address, this.startDate], [this.info.address], {
        reverse: false,
      })

    let count = 0
    for await (const { value: event } of events) {
      await this.computeEvent(event)

      count++
      if (!(count % 1000))
        console.log(
          'Init address domain',
          this.info.name,
          this.info.address,
          count,
          'events loaded...'
        )
    }
  }

  async computeEvent(event: InstructionEvent): Promise<void> {
    if (event.timestamp <= this.startDate) return

    if(!this.info.stats.accessingPrograms.has(event.programId))
      this.info.stats.accessingPrograms.add(event.programId)

    this.processor.processEvent(
      event,
      'hour',
      1,
      this.info.stats
    )

    this._shouldUpdate = true
  }

  async updateStats(now: DateTime = DateTime.now()): Promise<void> {
    if (!this._shouldUpdate) return
    this._shouldUpdate = false

    console.log('Updating stats for', this.info.name, this.info.address)

    const endOfCurrentHour = now.plus({ hours: 1 }).startOf('hour')
    const it1h = Interval.before(endOfCurrentHour, { hours: 1 })
    const it24h = Interval.before(endOfCurrentHour, { hours: 24 })
    const it7d = Interval.before(endOfCurrentHour, { hours: 24 * 7 })

    const timeStats = this.processor.sortTimeStats(
      this.info.stats.requestsStatsByHour,
    )

    if (timeStats.length) {
      this.info.stats.requests1h = 0
      this.info.stats.requests24h = 0
      this.info.stats.requests7d = 0

      for (const stats of timeStats) {
        const it = Interval.fromISO(stats.interval)

        if (it1h.engulfs(it))
          this.info.stats.requests1h += stats.requests

        if (it24h.engulfs(it))
          this.info.stats.requests24h += stats.requests

        if (it7d.engulfs(it))
          this.info.stats.requests7d += stats.requests

        this.info.stats.requestsTotal += stats.requests
      }
    }

    this.info.stats.lastRequest = await this.eventDAL.getLastValue()
  }

  clearStatsCache(now: DateTime = DateTime.now()): void | Promise<void> {
    console.log('Cleaning stats cache for', this.info.name, this.info.address)

    const startOfCache = now
      .minus({ hours: 24 * 7 })
      .startOf('hour')
      .toMillis()

    const timeStats = this.processor.sortTimeStats(
      this.info.stats.requestsStatsByHour,
    )
    const leftBound = DateTime.fromMillis(startOfCache)

    for (const stats of timeStats) {
      if (Interval.fromISO(stats.interval).isAfter(leftBound)) break
      delete this.info.stats.requestsStatsByHour[stats.interval]
    }

    this._shouldUpdate = true
  }

  async getHourlyStats(): Promise<HourlyStats> {
    const statsMap = this.info.stats.requestsStatsByHour
    const stats = sortTimeStatsMap(statsMap)

    return {
      stats,
      statsMap,
    }
  }
}`
  
    const processor: string =
`import { Utils } from '@aleph-indexer/core'
import { DateTimeUnit } from 'luxon'
import { AccountTimeStat, InstructionEvent, ${Name}AccountStats } from "../types";

const splitIt = Utils.splitDurationIntoIntervals

export class EventProcessor {
  processEvent(
    event: InstructionEvent,
    intervalUnit: DateTimeUnit,
    intervalSize = 1,
    stats: ${Name}AccountStats,
  ): Record<string, AccountTimeStat> {
    const [interval] = splitIt(
      event.timestamp,
      event.timestamp + 1,
      intervalUnit,
      intervalSize,
    )
    const intervalISO = interval.toISO()

    const map = stats.requestsStatsByHour
    let stat = (map[intervalISO] =
      map[intervalISO] || ({} as AccountTimeStat))

    stat.interval = intervalISO
    stat.uniqueProgramIds = stats.accessingPrograms.size
    stat.requests = (stat.requests || 0) + 1 //L
    return map
  }

  sortTimeStats(
    timeStatsMap: Record<string, AccountTimeStat>,
    reverse = false,
  ): AccountTimeStat[] {
    const op = reverse ? -1 : 1
    return Object.values(timeStatsMap).sort(
      (a, b) => a.interval.localeCompare(b.interval) * op,
    )
  }
}

const eventProcessor = new EventProcessor()
export default eventProcessor`
  
    const custom: string = 
`import { DOMAIN_CACHE_START_DATE, ${NAME}_PROGRAM_ID, ${NAME}_PROGRAM_ID_PK } from "../constants";
import { AccountType, GlobalOracleStats, InstructionEvent, ${Name}AccountInfo } from "../types";
import { ACCOUNT_DISCRIMINATOR, ACCOUNTS_DATA_LAYOUT } from "../layouts/accounts";
import {
  EntityStorage,
  SolanaPools,
  solanaPrivateRPCRoundRobin,
  SolanaRPC,
  SolanaRPCRoundRobin,
  Utils
} from "@aleph-indexer/core";
import { DateTime } from "luxon";
import { Account } from "./account";
import { oracleEventDAL } from "../dal/event";
import bs58 from "bs58";
import { AccountInfo, PublicKey } from "@solana/web3";

export class ${Name}Program extends SolanaPools<Account> {
  private _stats: GlobalOracleStats = this.getNewGlobalStats()

  constructor(
    protected accountTypes: Set<AccountType> = new Set(Object.values(AccountType)),
    protected startDate: number,
    protected eventDAL: EntityStorage<InstructionEvent>,
    protected solanaRpcRR: SolanaRPCRoundRobin = solanaPrivateRPCRoundRobin,
  ) {
    super()
  }

  async getAllAccountsOfType(
    type: AccountType
  ): Promise<${Name}AccountInfo[]> {
    const connection = await this.solanaRpcRR.getClient().getConnection()
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
    return resp.map((value) =>
      this.deserializeAccountResponse(value, type)
    )
  }

  deserializeAccountResponse(
    resp: {pubkey: PublicKey, account: AccountInfo<Buffer>},
    type: AccountType
  ): ${Name}AccountInfo {
    const data = ACCOUNTS_DATA_LAYOUT[type].deserialize(
      resp.account.data,
    )[0]
    const address = resp.pubkey.toBase58()
    // Parsing names from on-chain account data can be complicated at times...
    let name: string = address
    if (Object.hasOwn(data, "name")) {
      if((data as any).name instanceof Uint8Array)
        name = ((data as any).name as Uint8Array).toString()
      if((data as any).name instanceof String)
        name = (data as any).name
    }
    return {
      name,
      type,
      address: address,
      programId: ${NAME}_PROGRAM_ID,
      data: data
    }
  }

  addAccount(info: ${Name}AccountInfo): Account {
    if (this.poolExists(info.address)) return this.pools[info.address]

    // TODO: Generalize Account
    const account = new Account(info, this.startDate, this.eventDAL)

    this.addPool(account)

    return account
  }

  /**
   * Discovers all accounts of a certain type and adds domain objects for them.
   * @param type
   * @param index
   * @param total
   */
  async discoverAccounts(
    type: AccountType,
    index?: number,
    total?: number,
  ): Promise<Account[]> {
    const newAccounts = await this.getAllAccountsOfType(
      type
    )
    const result: Account[] = []

    for (const accountInfo of newAccounts) {
      if (index !== undefined && total !== undefined) {
        const hash = Utils.murmur(accountInfo.address) % total
        if (index !== hash) continue
      }

      const alreadyExists = this.poolExists(accountInfo.address)
      if (alreadyExists) continue

      const domain = this.addAccount(accountInfo)
      result.push(domain)
    }

    return result
  }

  async discoverAllAccounts(): Promise<Account[]> {
    return await Promise.all([...this.accountTypes].map((type) =>
      this.discoverAccounts(type)
    )).then(allAccounts => allAccounts.flat())
  }

  async getGlobalStats(
    addresses?: string[],
  ): Promise<GlobalOracleStats> {
    //TODO: Generalize
    if (!addresses || addresses.length === 0) {
      return this._stats
    }

    return this.computeGlobalStats(addresses)
  }

  // --------------------- PROTECTED ----------------------

  protected async updateStats(now: DateTime = DateTime.now()): Promise<void> {
    console.log('Updating global stats')
    this._stats = await this.computeGlobalStats()
  }

  protected async computeGlobalStats(
    aggregatorAddresses?: string[],
  ): Promise<GlobalOracleStats> {
    const aggregatorMap = await this.getPools()

    const aggregators = !aggregatorAddresses
      ? Object.values(aggregatorMap)
      : aggregatorAddresses.reduce((acc, address) => {
          const market = aggregatorMap[address]
          if (market) acc.push(market)
          return acc
        }, [] as Account[])

    const globalStats: GlobalOracleStats = this.getNewGlobalStats()
    let uniqueProgramIds = new Set<string>([])

    for (const aggregator of aggregators) {
      // @note: Calculate last stats from reserves
      const { requestsTotal, accessingPrograms } = aggregator.stats

      globalStats.totalRequests += requestsTotal //L -updatesTotal
      uniqueProgramIds = new Set([
        ...[...accessingPrograms].filter(value => !uniqueProgramIds.has(value)),
        ...uniqueProgramIds
      ])
    }

    globalStats.totalUniqueAccessingPrograms += uniqueProgramIds.size
    return globalStats
  }

  protected getNewGlobalStats(): GlobalOracleStats {
    return {
      totalRequests: 0,
      totalAccounts: {
        [AccountType.SbState]: 0,
        [AccountType.AggregatorAccountData]: 0,
        [AccountType.PermissionAccountData]: 0,
        [AccountType.LeaseAccountData]: 0,
        [AccountType.OracleQueueAccountData]: 0,
        [AccountType.CrankAccountData]: 0,
        [AccountType.OracleAccountData]: 0,
        [AccountType.JobAccountData]: 0,
        [AccountType.VrfAccountData]: 0,
      },
      totalUniqueAccessingPrograms: 0
    }
  }

  protected async _loadPools(index?: number, total?: number): Promise<void> {
    await Promise.all([...this.accountTypes].map((type) =>
      this.discoverAccounts(type, index, total)
    ))
  }
}

export const ${name}Program = new ${Name}Program(
  new Set([AccountType.AggregatorAccountData]),
  DOMAIN_CACHE_START_DATE,
  oracleEventDAL,
)
export default ${name}Program`
  
    return { account, processor, custom }
  }