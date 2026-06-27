import 'server-only'

export { createInquiryOutboundAdapters, createJsonlInquiryOutboundAdapter, createJsonlInquiryPersistenceAdapter, planInquiryOutboundChannels } from './adapters'
export { getInquiryStoreConfig, appendInquiryInboxRecord, appendInquiryOutboxRecord } from './store'
export { submitInquiry } from './service'
export type {
  InquiryInboxJsonlRecord,
  InquiryOutboundAdapter,
  InquiryOutboundJob,
  InquiryOutboxJsonlRecord,
  InquiryPersistenceAdapter,
  InquiryPersistenceInput,
  InquiryPersistenceReceipt,
  InquiryStoreConfig,
} from './types'
