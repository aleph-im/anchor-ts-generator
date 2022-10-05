import {
  stateDiscriminator,
  stateBeet,
  ticketAccountDataDiscriminator,
  ticketAccountDataBeet,
} from './solita/index.js'
import { ParsedAccounts, ParsedAccountsData } from './solita/index.js'
import { BeetStruct, FixableBeetStruct } from '@metaplex-foundation/beet'

export enum AccountType {
  State = 'State',
  TicketAccountData = 'TicketAccountData',
}

export const ACCOUNT_DISCRIMINATOR: Record<AccountType, Buffer> = {
  [AccountType.State]: Buffer.from(stateDiscriminator),
  [AccountType.TicketAccountData]: Buffer.from(ticketAccountDataDiscriminator),
}

export const ACCOUNTS_DATA_LAYOUT: Record<AccountType, any> = {
  [AccountType.State]: stateBeet,
  [AccountType.TicketAccountData]: ticketAccountDataBeet,
}
