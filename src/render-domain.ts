export function renderDomainFiles(name: string){
    const Name = name.charAt(0).toUpperCase().concat(name.slice(1))
    const NAME = name.toUpperCase()

    const pool: string = 
`import { DateTime, Interval } from 'luxon'
import { Utils, SolanaPool, EntityStorage } from '@aleph-indexer/core'
import { RawEvent, RawEventStats } from '../types.js'
import rawEventProcessor, { RawEventProcessor } from './processor.js'

const { sortTimeStatsMap } = Utils

export class Pool extends SolanaPool<RawEventInfo, RawEventStats> {
  private _shouldUpdate = true

  constructor(
    public info: RawEventInfo,
    protected startDate: number,
    protected eventDAL: EntityStorage<RawEvent>,
    protected processor: rawEventProcessor = RawEventProcessor,
  ) {
    super(info, {

    })
  }

  async init(): Promise<void> {
    console.log('Init program ', this.info.name, this.info.address)
    await this.initEvents()
  }

  protected async initEvents(): Promise<void> {
    const events = this.eventDAL
      .useIndex('pool_timestamp')
      .getAllFromTo([this.info.address, this.startDate], [this.info.address], {
        reverse: false,
      })

    let count = 0
    for await (const { value: event } of events) {
      await this.computePoolEvent(event)

      count++
      if (!(count % 1000))
        console.log(
          'Init oracle pool',
          this.info.name,
          this.info.address,
          count,
          'events loaded...'
        )
    }
  }

  async computePoolEvent(event: RawEvent): Promise<void> {
    if (event.timestamp <= this.startDate) return

    if(!this.stats.accessingPrograms.has(event.programId))
      this.stats.accessingPrograms.add(event.programId)

    this.processor.processPoolEvent(
      event,
      'hour',
      1,
      this.stats
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

    const timeStats = this.processor.sortPoolTimeStats(
      this.stats.requestsStatsByHour,
    )

    if (timeStats.length) {
      this.stats.requests1h = 0
      this.stats.requests24h = 0
      this.stats.requests7d = 0
      this.stats.updates1h = 0
      this.stats.updates24h = 0
      this.stats.updates7d = 0

      for (const stats of timeStats) {
        const it = Interval.fromISO(stats.interval)

        if (it1h.engulfs(it)) {
          this.stats.requests1h += stats.requests
          this.stats.updates1h += stats.updates
        }

        if (it24h.engulfs(it)) {
          this.stats.requests24h += stats.requests
          this.stats.updates24h += stats.updates
        }

        if (it7d.engulfs(it)) {
          this.stats.requests7d += stats.requests
          this.stats.updates7d += stats.updates
        }

        this.stats.requestsTotal += stats.requests
        this.stats.updatesTotal += stats.updates
      }
    }

    this.stats.activelyUsed = this.stats.requestsTotal !== 0

    this.stats.lastRequest = await this.eventDAL.getLastValue()
  }

  clearStatsCache(now: DateTime = DateTime.now()): void | Promise<void> {
    console.log('Cleaning stats cache for', this.info.name, this.info.address)

    const startOfCache = now
      .minus({ hours: 24 * 7 })
      .startOf('hour')
      .toMillis()

    const timeStats = this.processor.sortPoolTimeStats(
      this.stats.requestsStatsByHour,
    )
    const leftBound = DateTime.fromMillis(startOfCache)

    for (const stats of timeStats) {
      if (Interval.fromISO(stats.interval).isAfter(leftBound)) break
      delete this.stats.requestsStatsByHour[stats.interval]
    }

    this._shouldUpdate = true
  }

  async getHourlyStats(): Promise<HourlyOracleStats> {
    const statsMap = this.stats.requestsStatsByHour
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
import { ${NAME}_PROGRAM_ID } from '../constants.js'
import { RawEvent } from "../types.js";

const splitIt = Utils.splitDurationIntoIntervals

export class RawEventProcessor {
  processPoolEvent(
    event: RawEvent,
    intervalUnit: DateTimeUnit,
    intervalSize = 1,
    stats: PoolStats,
  ): Record<string, PoolTimeStat> {
    const [interval] = splitIt(
      event.timestamp,
      event.timestamp + 1,
      intervalUnit,
      intervalSize,
    )
    const intervalISO = interval.toISO()

    const map = stats.requestsStatsByHour
    let stat = (map[intervalISO] =
      map[intervalISO] || ({} as PoolTimeStat))

    const isInvokedByOwnerProgram = (event.programId === ${NAME}_PROGRAM_ID)
    //stat.requests = (stat.requests || 0) + 1
    if(stat.requests === undefined)
      stat.requests = 0
    stat.interval = intervalISO
    stat.uniqueProgramIds = stats.accessingPrograms.size
    if (isInvokedByOwnerProgram)
      stat.updates = (stat.updates || 0) + 1
    else
      stat.requests = (stat.requests || 0) + 1 //L
    return map
  }

  sortPoolTimeStats(
    timeStatsMap: Record<string, PoolTimeStat>,
    reverse = false,
  ): PoolTimeStat[] {
    const op = reverse ? -1 : 1
    return Object.values(timeStatsMap).sort(
      (a, b) => a.interval.localeCompare(b.interval) * op,
    )
  }
}

const rawEventProcessor = new RawEventProcessor()
export default rawEventProcessor`
  
    const custom: string = 
`import {
    DOMAIN_CACHE_START_DATE,
    ${NAME}_PROGRAM_ID_PK,
  } from '../constants.js'
  import { RawEvent } from '../types.js'
  import { sha256 } from 'js-sha256'
  import { ACCOUNTS_DATA_LAYOUT } from '../layouts/accounts.js'
  import {
    Utils,
    SolanaRPC,
    SolanaRPCRoundRobin,
    SolanaPools,
    EntityStorage,
  } from '@aleph-indexer/core'
  import { DateTime } from 'luxon'
  import { Pool } from './pool.js'
  import { solanaRPCRoundRobin } from '../solanaRpc.js'
  import { rawEventDAL } from '../dal/event.js'
  import bs58 from 'bs58'
  import { filterZeroBytes } from '../utils/utils.js'
  
  export class ${Name}Program extends SolanaPools<Pool> {
    private _stats: GlobalOracleStats = this.getNewGlobalStats()
  
    public queues?: Map<string, OracleQueueAccountDataRaw>
    public pools?: Map<string, PoolAccountDataRaw[]>
  
    constructor(
      protected startDate: number,
      protected eventDAL: EntityStorage<RawEvent>,
      protected solanaRpcRR: SolanaRPCRoundRobin = solanaRPCRoundRobin,
    ) {
      super()
    }
  
    async getOracleQueueAccounts(
      solana: SolanaRPC,
    ): Promise<OracleQueueAccountDataRaw[]> {
      const oracleQueueAccountDiscriminator = Buffer.from(
        sha256.digest('account:OracleQueueAccountData'),
      ).slice(0, 8)
      const connection = await solana.getConnection()
      const resp = await connection.getProgramAccounts(
        ${NAME}_PROGRAM_ID_PK,
        {
          filters: [
            {
              memcmp: {
                bytes: bs58.encode(oracleQueueAccountDiscriminator),
                offset: 0,
              },
            },
          ],
        },
      )
      this.queues = new Map(
        resp.map((value) => [
          value.pubkey.toBase58(),
          ACCOUNT_DATA_LAYOUT.OracleQueueAccountData.decode(
            value.account.data,
          ) as OracleQueueAccountDataRaw,
        ]),
      )
      return [...this.queues.values()]
    }
  
    async getPoolAccounts(solana: SolanaRPC): Promise<PoolInfo[]> {
      if (!this.queues) await this.getOracleQueueAccounts(solana)
  
      const poolAccountDiscriminator = Buffer.from(
        sha256.digest('account:PoolAccountData'),
      ).slice(0, 8)
      const connection = await solana.getConnection()
      const resp = await connection.getProgramAccounts(
        ${NAME}_PROGRAM_ID_PK,
        {
          filters: [
            {
              memcmp: {
                bytes: bs58.encode(poolAccountDiscriminator),
                offset: 0,
              },
            },
          ],
        },
      )
  
      return resp.map((value) => {
        const decoded = ACCOUNT_DATA_LAYOUT.PoolAccountData.decode(
          value.account.data,
        ) as PoolAccountDataRaw
  
        if (this.queues?.get(decoded.queuePubkey.toBase58()) === undefined) {
          return undefined
        }
        return {
          name: filterZeroBytes(decoded.name).toString('ascii'),
          address: value.pubkey.toBase58(),
          programId: value.account.owner.toBase58(),
          oracleQueue: decoded.queuePubkey.toBase58(),
          permissioned: !(
            this.queues?.get(
              decoded.queuePubkey.toBase58(),
            ) as OracleQueueAccountDataRaw
          ).unpermissionedFeedsEnabled,
        }
      }).filter(value => value !== undefined) as PoolInfo[]
    }
  
    addPool(info: PoolInfo): Pool {
      if (this.poolExists(info.address)) return this.pools[info.address]
  
      const reserve = new Pool(info, this.startDate, this.eventDAL)
  
      this.addPool(reserve)
  
      return reserve
    }
  
    async discoverPools(
      index?: number,
      total?: number,
    ): Promise<Pool[]> {
      const newPools = await this.getPoolAccounts(
        this.solanaRpcRR.getClient(),
      )
      console.log(newPools)
      const result: Pool[] = []
  
      for (const poolInfo of newPools) {
        if (index !== undefined && total !== undefined) {
          const hash = Utils.murmur(poolInfo.address) % total
          if (index !== hash) continue
        }
  
        const alreadyExists = this.poolExists(poolInfo.address)
        if (alreadyExists) continue
  
        const pool = this.addPool(poolInfo)
        result.push(pool)
      }
  
      return result
    }
  
    async getGlobalStats(
      poolAddresses?: string[],
    ): Promise<GlobalOracleStats> {
      if (!poolAddresses || poolAddresses.length === 0) {
        return this._stats
      }
  
      return this.computeGlobalStats(poolAddresses)
    }
  
    // --------------------- PROTECTED ----------------------
  
    protected async updateStats(now: DateTime = DateTime.now()): Promise<void> {
      console.log('Updating global stats')
      this._stats = await this.computeGlobalStats()
    }
  
    protected async computeGlobalStats(
      poolAddresses?: string[],
    ): Promise<GlobalOracleStats> {
      const poolMap = await this.getPools()
  
      const pools = !poolAddresses
        ? Object.values(poolMap)
        : poolAddresses.reduce((acc, address) => {
            const market = poolMap[address]
            if (market) acc.push(market)
            return acc
          }, [] as pool[])
  
      const globalStats: GlobalOracleStats = this.getNewGlobalStats()
      let uniqueProgramIds = new Set<string>([])
  
      for (const pool of pools) {
        // @note: Calculate last stats from reserves
        const { requestsTotal, accessingPrograms, updatesTotal, activelyUsed } = pool.stats
  
        globalStats.totalRequests += requestsTotal //L -updatesTotal
        uniqueProgramIds = new Set([
          ...[...accessingPrograms].filter(value => !uniqueProgramIds.has(value)),
          ...uniqueProgramIds
        ])
        globalStats.totalUpdates += updatesTotal
        globalStats.totalPools++
        if(activelyUsed)
          globalStats.totalActivelyUsedPools++
      }
  
  
      //globalStats.totalRequests -= globalStats.totalUpdates //L
  
      globalStats.totalUniqueAccessingPrograms += uniqueProgramIds.size
      return globalStats
    }
  
    protected getNewGlobalStats(): GlobalOracleStats {
      return {
        totalRequests: 0,
        totalPools: 0,
        totalActivelyUsedPools: 0,
        totalUpdates: 0,
        totalUniqueAccessingPrograms: 0
      }
    }
  
    protected async _loadPools(index?: number, total?: number): Promise<void> {
      await this.discoverPools(index, total)
    }
  }
  
  export const ${name}Program = new ${Name}Program(
    DOMAIN_CACHE_START_DATE,
    rawEventDAL,
  )
  export default ${name}Program`
  
    return { pool, processor, custom }
  }