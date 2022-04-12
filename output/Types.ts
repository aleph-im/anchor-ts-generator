/*********************************************
 | Type file generated with anchor-generator |
 *********************************************/

import BN from "bn.js";
import { PublicKey } from "@solana/web3.js";

// ------------------- ENUMS -------------------
export enum Lanes {
  C = 'C',
  D = 'D',
  AB = 'AB',
  AC = 'AC',
  CD = 'CD',
  AD = 'AD',
  BC = 'BC',
  ABCD = 'ABCD',
}

export enum Shuffle {
  AAAA = 'AAAA',
  BBBB = 'BBBB',
  BADC = 'BADC',
  BACD = 'BACD',
  ADDA = 'ADDA',
  CBCB = 'CBCB',
  ABDC = 'ABDC',
  ABAB = 'ABAB',
  DBBD = 'DBBD',
  CACA = 'CACA',
}

export enum Error {
  InvalidPublicKey = 'InvalidPublicKey',
  SerializationError = 'SerializationError',
  DeserializationError = 'DeserializationError',
  InvalidDataError = 'InvalidDataError',
}

export enum SwitchboardPermission {
  PermitOracleHeartbeat = 'PermitOracleHeartbeat',
  PermitOracleQueueUsage = 'PermitOracleQueueUsage',
  PermitVrfRequests = 'PermitVrfRequests',
}

export enum OracleResponseType {
  TypeSuccess = 'TypeSuccess',
  TypeError = 'TypeError',
  TypeDisagreement = 'TypeDisagreement',
  TypeNoResponse = 'TypeNoResponse',
}

export enum VrfStatus {
  StatusNone = 'StatusNone',
  StatusRequesting = 'StatusRequesting',
  StatusVerifying = 'StatusVerifying',
  StatusVerified = 'StatusVerified',
  StatusCallbackSuccess = 'StatusCallbackSuccess',
  StatusVerifyFailure = 'StatusVerifyFailure',
}


// ------------------- TYPES -------------------
export type AggregatorAddJobParams = {
}

export type AggregatorInitParams = {
  name: string
  metadata: string
  batchSize: number
  minOracleResults: number
  minJobResults: number
  minUpdateDelaySeconds: number
  startAfter: BN
  varianceThreshold: BorshDecimal
  forceReportPeriod: BN
  expiration: BN
  stateBump: number
}

export type AggregatorLockParams = {
}

export type AggregatorOpenRoundParams = {
  stateBump: number
  leaseBump: number
  permissionBump: number
  jitter: number
}

export type AggregatorRemoveJobParams = {
  jobIdx: number
}

export type AggregatorSaveResultParams = {
  oracleIdx: number
  error: boolean
  value: BorshDecimal
  jobsChecksum: string
  minResponse: BorshDecimal
  maxResponse: BorshDecimal
  feedPermissionBump: number
  oraclePermissionBump: number
  leaseBump: number
  stateBump: number
}

export type AggregatorSetAuthorityParams = {
}

export type AggregatorSetBatchSizeParams = {
  batchSize: number
}

export type AggregatorSetHistoryBufferParams = {
}

export type AggregatorSetMinJobsParams = {
  minJobResults: number
}

export type AggregatorSetMinOraclesParams = {
  minOracleResults: number
}

export type AggregatorSetQueueParams = {
}

export type AggregatorSetUpdateIntervalParams = {
  newInterval: number
}

export type AggregatorSetVarianceThresholdParams = {
  varianceThreshold: BorshDecimal
}

export type CrankInitParams = {
  name: Buffer
  metadata: Buffer
  crankSize: number
}

export type CrankPopParams = {
  stateBump: number
  leaseBumps: Buffer
  permissionBumps: Buffer
  nonce?: number
  failOpenOnAccountMismatch?: boolean
}

export type CrankPushParams = {
  stateBump: number
  permissionBump: number
}

export type JobInitParams = {
  name: string
  expiration: BN
  stateBump: number
  data: Buffer
}

export type LeaseExtendParams = {
  loadAmount: BN
  leaseBump: number
  stateBump: number
}

export type LeaseInitParams = {
  loadAmount: BN
  withdrawAuthority: PublicKey
  leaseBump: number
  stateBump: number
}

export type LeaseWithdrawParams = {
  stateBump: number
  leaseBump: number
  amount: BN
}

export type OracleHeartbeatParams = {
  permissionBump: number
}

export type OracleInitParams = {
  name: Buffer
  metadata: Buffer
  stateBump: number
  oracleBump: number
}

export type OracleQueueInitParams = {
  name: string
  metadata: string
  reward: BN
  minStake: BN
  feedProbationPeriod: number
  oracleTimeout: number
  slashingEnabled: boolean
  varianceToleranceMultiplier: BorshDecimal
  consecutiveFeedFailureLimit: BN
  consecutiveOracleFailureLimit: BN
  queueSize: number
  unpermissionedFeeds: boolean
  unpermissionedVrf: boolean
}

export type OracleQueueSetRewardsParams = {
  rewards: BN
}

export type OracleQueueVrfConfigParams = {
  unpermissionedVrfEnabled: boolean
}

export type OracleWithdrawParams = {
  stateBump: number
  permissionBump: number
  amount: BN
}

export type PermissionInitParams = {
  permissionBump: number
}

export type PermissionSetParams = {
  permission: SwitchboardPermission
  enable: boolean
}

export type ProgramConfigParams = {
  token: PublicKey
  bump: number
}

export type ProgramInitParams = {
  stateBump: number
}

export type VaultTransferParams = {
  stateBump: number
  amount: BN
}

export type VrfInitParams = {
  callback: Callback
  stateBump: number
}

export type VrfProveParams = {
  proof: Buffer
  idx: number
}

export type VrfProveAndVerifyParams = {
  nonce?: number
  stateBump: number
  idx: number
  proof: Buffer
}

export type VrfRequestRandomnessParams = {
  permissionBump: number
  stateBump: number
}

export type VrfVerifyParams = {
  nonce?: number
  stateBump: number
  idx: number
}

export type Hash = {
  data: string
}

export type AggregatorRound = {
  numSuccess: number
  numError: number
  isClosed: boolean
  roundOpenSlot: BN
  roundOpenTimestamp: BN
  result: SwitchboardDecimal
  stdDeviation: SwitchboardDecimal
  minResponse: SwitchboardDecimal
  maxResponse: SwitchboardDecimal
  oraclePubkeysData: PublicKey[]
  mediansData: SwitchboardDecimal[]
  currentPayout: BN[]
  mediansFulfilled: boolean[]
  errorsFulfilled: boolean[]
}

export type AggregatorHistoryRow = {
  timestamp: BN
  value: SwitchboardDecimal
}

export type SwitchboardDecimal = {
  mantissa: BN
  scale: number
}

export type CrankRow = {
  pubkey: PublicKey
  nextTimestamp: BN
}

export type OracleMetrics = {
  consecutiveSuccess: BN
  consecutiveError: BN
  consecutiveDisagreement: BN
  consecutiveLateResponse: BN
  consecutiveFailure: BN
  totalSuccess: BN
  totalError: BN
  totalDisagreement: BN
  totalLateResponse: BN
}

export type BorshDecimal = {
  mantissa: BN
  scale: number
}

export type EcvrfProofZC = {
  gamma: EdwardsPointZC
  c: Scalar
  s: Scalar
}

export type Scalar = {
  bytes: string
}

export type FieldElementZC = {
  bytes: BN[]
}

export type CompletedPointZC = {
  x: FieldElementZC
  y: FieldElementZC
  z: FieldElementZC
  t: FieldElementZC
}

export type EdwardsPointZC = {
  x: FieldElementZC
  y: FieldElementZC
  z: FieldElementZC
  t: FieldElementZC
}

export type ProjectivePointZC = {
  x: FieldElementZC
  y: FieldElementZC
  z: FieldElementZC
}

export type EcvrfIntermediate = {
  r: FieldElementZC
  nS: FieldElementZC
  d: FieldElementZC
  t13: FieldElementZC
  t15: FieldElementZC
}

export type VrfBuilder = {
  producer: PublicKey
  status: VrfStatus
  reprProof: string
  proof: EcvrfProofZC
  yPoint: PublicKey
  stage: number
  stage1Out: EcvrfIntermediate
  r1: EdwardsPointZC
  r2: EdwardsPointZC
  stage3Out: EcvrfIntermediate
  hPoint: EdwardsPointZC
  sReduced: Scalar
  yPointBuilder: FieldElementZC[]
  yRistrettoPoint: EdwardsPointZC
  mulRound: number
  hashPointsRound: number
  mulTmp1: CompletedPointZC
  uPoint1: EdwardsPointZC
  uPoint2: EdwardsPointZC
  vPoint1: EdwardsPointZC
  vPoint2: EdwardsPointZC
  uPoint: EdwardsPointZC
  vPoint: EdwardsPointZC
  u1: FieldElementZC
  u2: FieldElementZC
  invertee: FieldElementZC
  y: FieldElementZC
  z: FieldElementZC
  p1Bytes: string
  p2Bytes: string
  p3Bytes: string
  p4Bytes: string
  cPrimeHashbuf: string
  m1: FieldElementZC
  m2: FieldElementZC
  txRemaining: number
  verified: boolean
  result: string
}

export type AccountMetaZC = {
  pubkey: PublicKey
  isSigner: boolean
  isWritable: boolean
}

export type AccountMetaBorsh = {
  pubkey: PublicKey
  isSigner: boolean
  isWritable: boolean
}

export type CallbackZC = {
  programId: PublicKey
  accounts: AccountMetaZC[]
  accountsLen: number
  ixData: string
  ixDataLen: number
}

export type Callback = {
  programId: PublicKey
  accounts: AccountMetaBorsh[]
  ixData: Buffer
}

export type VrfRound = {
  alpha: string
  alphaLen: number
  requestSlot: BN
  requestTimestamp: BN
  result: string
  numVerified: number
  ebuf: string
}

