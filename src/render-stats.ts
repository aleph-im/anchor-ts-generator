import { ViewInstructions } from "./types"

export function renderStatsFiles(Name: string, filename: string, instructions: ViewInstructions | undefined){
    const name = filename.toLowerCase()

    const timeSeries =
`import {
    AccountTimeSeriesStatsManager,
    IndexerMsI,
    StatsStateStorage,
    StatsTimeSeriesStorage,
    TimeFrame,
    TimeSeriesStats,
} from '@aleph-indexer/framework'
import { EventDALIndex, EventStorage } from '../../dal/event.js'
import { ParsedEvents, ${Name}Info } from '../../types.js'
import statsAggregator from './statsAggregator.js'
import eventAggregator from './timeSeriesAggregator.js'

export async function createAccountStats(
    account: string,
    indexerApi: IndexerMsI,
    eventDAL: EventStorage,
    statsStateDAL: StatsStateStorage,
    statsTimeSeriesDAL: StatsTimeSeriesStorage,
): Promise<AccountTimeSeriesStatsManager> {
    
    const ${Name}TimeSeries = new TimeSeriesStats<ParsedEvents, ${Name}Info>(
        {
        type: '${name}',
        startDate: 0,
        timeFrames: [
            TimeFrame.Hour,
            TimeFrame.Day,
            TimeFrame.Week,
            TimeFrame.Month,
            TimeFrame.Year,
            TimeFrame.All,
        ],
        getInputStream: ({ account, startDate, endDate }) => {
            return eventDAL
            .useIndex(EventDALIndex.AccoountTimestamp)
            .getAllFromTo([account, startDate], [account, endDate])
        },
        aggregate: ({ input, prevValue }): ${Name}Info => {
            return eventAggregator.aggregate(input, prevValue)
        },
        },
        statsStateDAL,
        statsTimeSeriesDAL,
    )
    
    const accountTimeSeries = new AccountTimeSeriesStatsManager(
        {
            account,
            series: [${Name}TimeSeries],
            aggregate(args) {
                return statsAggregator.aggregate(args)
            },
        },
        indexerApi,
        statsStateDAL,
        statsTimeSeriesDAL,
    )
    
    return accountTimeSeries
}
`
    let timeSeriesAggregator = ''
    if(instructions){
        timeSeriesAggregator = 
`
import {
  ParsedEvents,
  ${Name}Info,
  EventType1Info,
  EventType2Info,
  ${instructions.instructions[0].name}Event,
  ${instructions.instructions[1].name}Event,
  ${instructions.instructions[2].name}Event,
  ${instructions.instructions[3].name}Event
} from '../../types.js'
import { collectionEvent1Whitelist, collectionEvent2Whitelist } from '../../constants.js' // @todo: set to discriminate different event collections

// @todo: This is just an example to group some related instructions and process the data together
type CollectionEvent1 = ${instructions.instructions[0].name}Event & ${instructions.instructions[1].name}Event
type CollectionEvent2 = ${instructions.instructions[2].name}Event & ${instructions.instructions[3].name}Event

export class ${Name}EventTimeSeriesAggregator {
  aggregate(curr: ParsedEvents | ${Name}Info, prev?: ${Name}Info): ${Name}Info {
    prev = this.prepare${Name}InfoItem(prev)

    if (this.is${Name}Event(curr)) {
        if (this.isCollectionEvent1(curr)) {
            const info = this.prepareEventType1Info(curr)
            this.processEventType1Info(prev, info)
        }

        if (this.isCollectionEvent1(curr)) {
            const info = this.prepareEventType2Info(curr)
            this.processEventType2Info(prev, info)
        }

    } else {
        const info = this.prepare${Name}InfoItem(curr)
        this.process${Name}Info(prev, info)
    }

    return prev
  }

  protected prepare${Name}InfoItem(info?: ${Name}Info): ${Name}Info {
    info = info || {
        customProperties1: 0,
        customProperties2: 0,
    }

    return info
  }

  protected prepareEventType1Info(event: CollectionEvent1): EventType1Info {
    return {
        customProperties1: 0
    }
  }

  protected prepareEventType2Info(event: CollectionEvent2): EventType2Info {
    return {
        customProperties2: 0
    }
  }

  // @note: We assume that curr data is sorted by time
  protected process${Name}Info(
    acc: ${Name}Info,
    curr: ${Name}Info,
  ): ${Name}Info {
    this.processEventType1Info(acc, curr)
    this.processEventType2Info(acc, curr)

    return acc
  }

  protected processEventType1Info(
    acc: ${Name}Info,
    curr: EventType1Info,
  ): ${Name}Info {
    acc.customProperties1 += curr.customProperties1

    return acc
  }

  protected processEventType2Info(
    acc: ${Name}Info,
    curr: EventType2Info,
  ): ${Name}Info {
    acc.customProperties2 += curr.customProperties2

    return acc
  }

  protected is${Name}Event(
    event: ParsedEvents | ${Name}Info,
  ): event is ParsedEvents {
    return 'type' in event
  }

  protected isCollectionEvent1(event: ParsedEvents): event is CollectionEvent1 {
    return collectionEvent1Whitelist.has(event.type)
  }

  protected isCollectionEvent2(event: ParsedEvents): event is CollectionEvent1 {
    return collectionEvent2Whitelist.has(event.type)
  }
}

export const eventAggregator = new ${Name}EventTimeSeriesAggregator()
export default eventAggregator
`
    }
    const statsAggregator =
`import { DateTime } from 'luxon'
import { TimeFrame, AccountAggregatorFnArgs } from '@aleph-indexer/framework'
import { ${Name}Stats, ${Name}Info } from '../../types.js'
import eventAggregator from './timeSeriesAggregator.js'

export class StatsAggregator {
  async aggregate(
    args: AccountAggregatorFnArgs,
  ): Promise<${Name}Stats> {
    const { now, account, timeSeriesDAL } = args

    const stats = this.getEmptyStats()

    const type = '${name}'
    const currHour = DateTime.fromMillis(now).startOf('hour')
    const commonFields = [account, type, TimeFrame.Hour]

    const last1h = await timeSeriesDAL.get([
      ...commonFields,
      currHour.toMillis(),
    ])

    const last24hEvents = await timeSeriesDAL.getAllValuesFromTo(
      [...commonFields, currHour.minus({ hours: 24 }).toMillis()],
      [...commonFields, currHour.toMillis()],
    )

    let last24h
    for await (const event of last24hEvents) {
      last24h = eventAggregator.aggregate(event.data, last24h)
    }

    const last7dEvents = await timeSeriesDAL.getAllValuesFromTo(
      [...commonFields, currHour.minus({ hours: 24 * 7 }).toMillis()],
      [...commonFields, currHour.toMillis()],
    )

    let last7d
    for await (const event of last7dEvents) {
      last7d = eventAggregator.aggregate(event.data, last7d)
    }

    const total = await timeSeriesDAL.get([account, type, TimeFrame.All, 0])

    if (last1h) stats.last1h = last1h.data
    if (last24h) stats.last24h = last24h
    if (last7d) stats.last7d = last7d
    if (total) stats.total = total.data

    return stats
  }

  protected getEmptyStats(): ${Name}Stats {
    return {
        requestsStatsByHour: {},
        last1h: this.getEmpty${Name}Stats(),
        last24h: this.getEmpty${Name}Stats(),
        last7d: this.getEmpty${Name}Stats(),
        total: this.getEmpty${Name}Stats(),
        accessingPrograms: new Set<string>(),
    }
  }
  protected getEmpty${Name}Stats(): ${Name}Info {
    return {
        customProperties1: 0,

        customProperties2: 0,
    }
  }
}

export const statsAggregator = new StatsAggregator()
export default statsAggregator
`

    return { timeSeries, timeSeriesAggregator, statsAggregator }
}
