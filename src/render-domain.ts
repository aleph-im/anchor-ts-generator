export function renderDomainFiles(name: string){
    const Name = name.charAt(0).toUpperCase().concat(name.slice(1))
    const NAME = name.toUpperCase()

    const aggregator: string = 
`
import { DateTime, Interval } from 'luxon'
import { Utils, SolanaPool, EntityStorage } from '@aleph-indexer/core'
import {
  OracleEvent,
  AggregatorInfo,
  HourlyOracleStats,
  AggregatorStats,
} from '../types.js'
import oracleEventProcessor, { OracleEventProcessor } from './processor.js'

const { sortTimeStatsMap } = Utils

export class Aggregator extends SolanaPool<AggregatorInfo, AggregatorStats> {
  private _shouldUpdate = true

  constructor(
    public info: AggregatorInfo,
    protected startDate: number,
    protected eventDAL: EntityStorage<OracleEvent>,
    protected processor: OracleEventProcessor = oracleEventProcessor,
  ) {
    super(info, {
      requestsStatsByHour: {},

      requests1h: 0,
      requests24h: 0,
      requests7d: 0,
      requestsTotal: 0,

      updates1h: 0,
      updates24h: 0,
      updates7d: 0,
      updatesTotal: 0,

      activelyUsed: false,
      accessingPrograms: new Set<string>([]),
    })
  }

  async init(): Promise<void> {
    console.log('Init program ', this.info.name, this.info.address)
    await this.initEvents()
  }

  protected async initEvents(): Promise<void> {
    const events = this.eventDAL
      .useIndex('aggregator_timestamp')
      .getAllFromTo([this.info.address, this.startDate], [this.info.address], {
        reverse: false,
      })

    let count = 0
    for await (const { value: event } of events) {
      await this.computeAggregatorEvent(event)

      count++
      if (!(count % 1000))
        console.log(
          'Init oracle aggregator',
          this.info.name,
          this.info.address,
          count,
          'events loaded...'
        )
    }
  }

  async computeAggregatorEvent(event: OracleEvent): Promise<void> {
    if (event.timestamp <= this.startDate) return

    if(!this.stats.accessingPrograms.has(event.programId))
      this.stats.accessingPrograms.add(event.programId)

    this.processor.processAggregatorEvent(
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

    const timeStats = this.processor.sortAggregatorTimeStats(
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

    const timeStats = this.processor.sortAggregatorTimeStats(
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
}
`
  
    const processor: string =
`
import { Utils } from '@aleph-indexer/core'
import { DateTimeUnit } from 'luxon'
import { ${NAME}_PROGRAM_ID } from '../constants.js'
import { AggregatorStats, AggregatorTimeStat, OracleEvent } from "../types.js";

const splitIt = Utils.splitDurationIntoIntervals

export class OracleEventProcessor {
  processAggregatorEvent(
    event: OracleEvent,
    intervalUnit: DateTimeUnit,
    intervalSize = 1,
    stats: AggregatorStats,
  ): Record<string, AggregatorTimeStat> {
    const [interval] = splitIt(
      event.timestamp,
      event.timestamp + 1,
      intervalUnit,
      intervalSize,
    )
    const intervalISO = interval.toISO()

    const map = stats.requestsStatsByHour
    let stat = (map[intervalISO] =
      map[intervalISO] || ({} as AggregatorTimeStat))

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

  sortAggregatorTimeStats(
    timeStatsMap: Record<string, AggregatorTimeStat>,
    reverse = false,
  ): AggregatorTimeStat[] {
    const op = reverse ? -1 : 1
    return Object.values(timeStatsMap).sort(
      (a, b) => a.interval.localeCompare(b.interval) * op,
    )
  }
}

const oracleEventProcessor = new OracleEventProcessor()
export default oracleEventProcessor
`
  
    const custom: string = 
`
import {
    DOMAIN_CACHE_START_DATE,
    ${NAME}_PROGRAM_ID_PK,
  } from '../constants.js'
  import {
    AggregatorAccountDataRaw,
    AggregatorInfo,
    GlobalOracleStats,
    OracleEvent,
    OracleQueueAccountDataRaw,
  } from '../types.js'
  import { sha256 } from 'js-sha256'
  import { ACCOUNT_DATA_LAYOUT } from '../layouts/accounts.js'
  import {
    Utils,
    SolanaRPC,
    SolanaRPCRoundRobin,
    SolanaPools,
    EntityStorage,
  } from '@aleph-indexer/core'
  import { DateTime } from 'luxon'
  import { Aggregator } from './aggregator.js'
  import { solanaRPCRoundRobin } from '../solanaRpc.js'
  import { oracleEventDAL } from '../dal/event.js'
  import bs58 from 'bs58'
  import { filterZeroBytes } from '../utils/utils.js'
  
  export class ${Name}Program extends SolanaPools<Aggregator> {
    private _stats: GlobalOracleStats = this.getNewGlobalStats()
  
    public queues?: Map<string, OracleQueueAccountDataRaw>
    public aggregators?: Map<string, AggregatorAccountDataRaw[]>
  
    constructor(
      protected startDate: number,
      protected eventDAL: EntityStorage<OracleEvent>,
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
  
    async getAggregatorAccounts(solana: SolanaRPC): Promise<AggregatorInfo[]> {
      if (!this.queues) await this.getOracleQueueAccounts(solana)
  
      const aggregatorAccountDiscriminator = Buffer.from(
        sha256.digest('account:AggregatorAccountData'),
      ).slice(0, 8)
      const connection = await solana.getConnection()
      const resp = await connection.getProgramAccounts(
        ${NAME}_PROGRAM_ID_PK,
        {
          filters: [
            {
              memcmp: {
                bytes: bs58.encode(aggregatorAccountDiscriminator),
                offset: 0,
              },
            },
          ],
        },
      )
  
      return resp.map((value) => {
        const decoded = ACCOUNT_DATA_LAYOUT.AggregatorAccountData.decode(
          value.account.data,
        ) as AggregatorAccountDataRaw
  
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
      }).filter(value => value !== undefined) as AggregatorInfo[]
    }
  
    addAggregator(info: AggregatorInfo): Aggregator {
      if (this.poolExists(info.address)) return this.pools[info.address]
  
      const reserve = new Aggregator(info, this.startDate, this.eventDAL)
  
      this.addPool(reserve)
  
      return reserve
    }
  
    async discoverAggregators(
      index?: number,
      total?: number,
    ): Promise<Aggregator[]> {
      const newAggregators = await this.getAggregatorAccounts(
        this.solanaRpcRR.getClient(),
      )
      console.log(newAggregators)
      const result: Aggregator[] = []
  
      for (const aggregatorInfo of newAggregators) {
        if (index !== undefined && total !== undefined) {
          const hash = Utils.murmur(aggregatorInfo.address) % total
          if (index !== hash) continue
        }
  
        const alreadyExists = this.poolExists(aggregatorInfo.address)
        if (alreadyExists) continue
  
        const aggregator = this.addAggregator(aggregatorInfo)
        result.push(aggregator)
      }
  
      return result
    }
  
    async getGlobalStats(
      aggregatorAddresses?: string[],
    ): Promise<GlobalOracleStats> {
      if (!aggregatorAddresses || aggregatorAddresses.length === 0) {
        return this._stats
      }
  
      return this.computeGlobalStats(aggregatorAddresses)
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
          }, [] as Aggregator[])
  
      const globalStats: GlobalOracleStats = this.getNewGlobalStats()
      let uniqueProgramIds = new Set<string>([])
  
      for (const aggregator of aggregators) {
        // @note: Calculate last stats from reserves
        const { requestsTotal, accessingPrograms, updatesTotal, activelyUsed } = aggregator.stats
  
        globalStats.totalRequests += requestsTotal //L -updatesTotal
        uniqueProgramIds = new Set([
          ...[...accessingPrograms].filter(value => !uniqueProgramIds.has(value)),
          ...uniqueProgramIds
        ])
        globalStats.totalUpdates += updatesTotal
        globalStats.totalAggregators++
        if(activelyUsed)
          globalStats.totalActivelyUsedAggregators++
      }
  
  
      //globalStats.totalRequests -= globalStats.totalUpdates //L
  
      globalStats.totalUniqueAccessingPrograms += uniqueProgramIds.size
      return globalStats
    }
  
    protected getNewGlobalStats(): GlobalOracleStats {
      return {
        totalRequests: 0,
        totalAggregators: 0,
        totalActivelyUsedAggregators: 0,
        totalUpdates: 0,
        totalUniqueAccessingPrograms: 0
      }
    }
  
    protected async _loadPools(index?: number, total?: number): Promise<void> {
      await this.discoverAggregators(index, total)
    }
  }
  
  export const ${name}Program = new ${Name}Program(
    DOMAIN_CACHE_START_DATE,
    oracleEventDAL,
  )
  export default ${name}Program
`
  
    return { aggregator, processor, custom }
  }