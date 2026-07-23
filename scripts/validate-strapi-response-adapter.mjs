import assert from 'node:assert/strict'
import {
  readStrapiCollectionData,
  readStrapiRelationMany,
  readStrapiRelationOne,
} from '../lib/cms/strapi-response.ts'
import {
  BusinessLocaleCompatibilityError,
  normalizeCmsFactsBusinessLocale,
} from '../lib/cms/business-locale.ts'

const v4 = {
  data: [{
    id: 14,
    attributes: {
      title: 'V4 resource',
      related: {
        data: [{
          id: 15,
          attributes: { factId: 'prd_v4' },
        }],
      },
    },
  }],
}

const v5 = {
  data: [{
    documentId: 'p60542le3dat25ikqhc6gv7p',
    title: 'V5 resource',
    related: [{
      documentId: 'q60542le3dat25ikqhc6gv7p',
      factId: 'prd_v5',
    }],
  }],
}

const [v4Record] = readStrapiCollectionData(v4)
const [v5Record] = readStrapiCollectionData(v5)

assert.equal(v4Record?.title, 'V4 resource')
assert.equal(v4Record?.id, 14)
assert.equal(readStrapiRelationMany(v4Record?.related)[0]?.factId, 'prd_v4')
assert.equal(v5Record?.title, 'V5 resource')
assert.equal(v5Record?.documentId, 'p60542le3dat25ikqhc6gv7p')
assert.equal(readStrapiRelationMany(v5Record?.related)[0]?.factId, 'prd_v5')
assert.equal(readStrapiRelationOne({ data: v4.data[0] })?.title, 'V4 resource')
assert.equal(readStrapiRelationOne(v5.data[0])?.title, 'V5 resource')

const v4BusinessLocale = normalizeCmsFactsBusinessLocale({
  categoryFacts: [],
  productFacts: [{ documents: [{ id: 'doc_v4', locale: 'multi' }] }],
})
const v4BusinessDocument = v4BusinessLocale.cmsFacts.productFacts[0].documents[0]
assert.equal(v4BusinessDocument.contentLocale, 'multi')
assert.equal('locale' in v4BusinessDocument, false)
assert.equal(v4BusinessLocale.v5SystemLocales.length, 0)

const v5SystemLocale = normalizeCmsFactsBusinessLocale({
  categoryFacts: [],
  productFacts: [{ documents: [{ id: 'doc_v5', documentId: 'p60542le3dat25ikqhc6gv7p', locale: 'en', contentLocale: 'multi' }] }],
})
const v5BusinessDocument = v5SystemLocale.cmsFacts.productFacts[0].documents[0]
assert.equal(v5BusinessDocument.contentLocale, 'multi')
assert.equal('locale' in v5BusinessDocument, false)
assert.equal('documentId' in v5BusinessDocument, false)
assert.deepEqual(v5SystemLocale.v5SystemLocales, [{ path: 'cmsFacts.productFacts[0].documents[0]', documentId: 'p60542le3dat25ikqhc6gv7p', locale: 'en' }])

assert.throws(() => normalizeCmsFactsBusinessLocale({
  categoryFacts: [],
  productFacts: [{ documents: [{ id: 'doc_conflict', locale: 'multi', contentLocale: 'en' }] }],
}), BusinessLocaleCompatibilityError)

console.log(JSON.stringify({ ok: true, v4: v4Record?.title, v5: v5Record?.title }))
