'use strict'

const allowedIntents = new Set(['rfq', 'email-capture', 'oem-cooperation', 'distributor-inquiry'])
const allowedNextActions = new Set(['send-email-notification', 'sync-crm', 'manual-review', 'reject-invalid-payload'])

module.exports = {
  async create(input = {}) {
    const recordId = requireString(input.recordId, 'recordId')
    const storedAt = requireString(input.storedAt, 'storedAt')
    const payload = requireObject(input.payload, 'payload')
    const submission = requireObject(input.submission, 'submission')
    const source = requireObject(input.source, 'source')
    const contact = requireObject(input.contact, 'contact')
    const intent = requireEnum(payload.intent, allowedIntents, 'payload.intent')
    const nextAction = requireEnum(submission.nextAction, allowedNextActions, 'submission.nextAction')
    const outboundChannels = Array.isArray(input.outboundChannels) ? input.outboundChannels : []

    await assertRecordIdAvailable(recordId)

    const created = await strapi.documents('api::inquiry-submission.inquiry-submission').create({
      data: {
        recordId,
        storedAt,
        intent,
        nextAction,
        status: 'new',
        source,
        contact,
        payload,
        outboundChannels,
        emailState: outboundChannels.includes('email-notification') ? 'queued' : 'skipped',
        crmState: outboundChannels.includes('crm-sync') ? 'queued' : 'skipped',
      },
    })

    return {
      ok: true,
      recordId: created.recordId,
      documentId: created.documentId,
      storedAt: created.storedAt,
    }
  },
}

async function assertRecordIdAvailable(recordId) {
  const existing = await strapi.documents('api::inquiry-submission.inquiry-submission').findMany({
    filters: { recordId: { $eq: recordId } },
    fields: ['recordId'],
    limit: 1,
  })

  if (Array.isArray(existing) && existing.length) {
    throw httpError(409, 'Inquiry recordId already exists.')
  }
}

function requireString(value, path) {
  if (typeof value !== 'string' || !value.trim()) {
    throw httpError(400, `${path} must be a non-empty string.`)
  }

  return value.trim()
}

function requireObject(value, path) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw httpError(400, `${path} must be an object.`)
  }

  return value
}

function requireEnum(value, allowedValues, path) {
  const normalized = requireString(value, path)

  if (!allowedValues.has(normalized)) {
    throw httpError(400, `${path} is not supported.`)
  }

  return normalized
}

function httpError(status, message) {
  const error = new Error(message)
  error.status = status
  return error
}
