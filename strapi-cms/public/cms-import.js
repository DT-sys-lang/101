const form = document.getElementById('cms-import-form')
const tokenInput = document.getElementById('token')
const fileInput = document.getElementById('file')
const jsonInput = document.getElementById('json')
const dryRunInput = document.getElementById('dryRun')
const result = document.getElementById('result')
const clearButton = document.getElementById('clear')
const deleteForm = document.getElementById('cms-delete-form')
const deleteProductIdsInput = document.getElementById('deleteProductIds')
const deleteDryRunInput = document.getElementById('deleteDryRun')
const deleteAssetsInput = document.getElementById('deleteAssets')
const confirmDeleteInput = document.getElementById('confirmDelete')
const resourceForm = document.getElementById('cms-resource-form')
const resourceZipInput = document.getElementById('resourceZip')
const resourceDryRunInput = document.getElementById('resourceDryRun')
const resourceOverwriteInput = document.getElementById('resourceOverwrite')
const confirmUploadInput = document.getElementById('confirmUpload')

clearButton.addEventListener('click', () => {
  result.textContent = 'Waiting for input.'
})

form.addEventListener('submit', async (event) => {
  event.preventDefault()

  const submitButton = form.querySelector('button[type="submit"]')
  submitButton.disabled = true
  result.textContent = 'Reading batch...'

  try {
    const request = await buildImportRequest()

    result.textContent = request.kind === 'xlsx' ? 'Uploading workbook...' : 'Sending batch...'

    const response = await fetch('/internal/cms/import', request.init)
    const responseText = await response.text()
    const body = parseResponseBody(responseText, response.status)

    result.textContent = JSON.stringify(body, null, 2)
  } catch (error) {
    result.textContent = JSON.stringify({
      ok: false,
      message: error instanceof Error ? error.message : String(error),
    }, null, 2)
  } finally {
    submitButton.disabled = false
  }
})

deleteForm.addEventListener('submit', async (event) => {
  event.preventDefault()

  const submitButton = deleteForm.querySelector('button[type="submit"]')
  submitButton.disabled = true
  result.textContent = 'Preparing delete request...'

  try {
    const productIds = parseProductIds(deleteProductIdsInput.value)
    const dryRun = deleteDryRunInput.checked

    if (!dryRun && !confirmDeleteInput.checked) {
      throw new Error('Confirm deletion before running a non-dry-run delete.')
    }

    if (!dryRun && !window.confirm(`Delete ${productIds.length} product(s)? This cannot be undone.`)) {
      result.textContent = 'Delete cancelled.'
      return
    }

    const response = await fetch('/internal/cms/import/delete-products', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tokenInput.value.trim()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        productIds,
        dryRun,
        deleteAssets: deleteAssetsInput.checked,
        confirmDelete: confirmDeleteInput.checked,
      }),
    })
    const responseText = await response.text()
    const body = parseResponseBody(responseText, response.status)

    result.textContent = JSON.stringify(body, null, 2)
  } catch (error) {
    result.textContent = JSON.stringify({
      ok: false,
      message: error instanceof Error ? error.message : String(error),
    }, null, 2)
  } finally {
    submitButton.disabled = false
  }
})

resourceForm.addEventListener('submit', async (event) => {
  event.preventDefault()

  const submitButton = resourceForm.querySelector('button[type="submit"]')
  submitButton.disabled = true
  result.textContent = 'Reading resource package...'

  try {
    const file = resourceZipInput.files && resourceZipInput.files[0]
    const dryRun = resourceDryRunInput.checked

    if (!file) {
      throw new Error('Choose a .zip resource package first.')
    }

    if (!file.name.toLowerCase().endsWith('.zip')) {
      throw new Error('Choose a .zip resource package.')
    }

    if (!dryRun && !confirmUploadInput.checked) {
      throw new Error('Confirm upload before running a non-dry-run resource upload.')
    }

    if (!dryRun && !window.confirm(`Upload resources from ${file.name}? Existing matching asset records may be updated.`)) {
      result.textContent = 'Resource upload cancelled.'
      return
    }

    const body = new FormData()
    body.append('dryRun', String(dryRun))
    body.append('overwrite', String(resourceOverwriteInput.checked))
    body.append('confirmUpload', String(confirmUploadInput.checked))
    body.append('file', file)

    result.textContent = dryRun ? 'Checking resource package...' : 'Uploading resources...'

    const response = await fetch('/internal/cms/import/resources', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tokenInput.value.trim()}`,
      },
      body,
    })
    const responseText = await response.text()
    const bodyResult = parseResponseBody(responseText, response.status)

    result.textContent = JSON.stringify(bodyResult, null, 2)
  } catch (error) {
    result.textContent = JSON.stringify({
      ok: false,
      message: error instanceof Error ? error.message : String(error),
    }, null, 2)
  } finally {
    submitButton.disabled = false
  }
})

async function buildImportRequest() {
  const file = fileInput.files && fileInput.files[0]

  if (file) {
    const filename = file.name.toLowerCase()

    if (filename.endsWith('.xls')) {
      throw new Error('Save the workbook as .xlsx first. Legacy .xls files are not supported.')
    }

    if (filename.endsWith('.xlsx')) {
      const body = new FormData()
      body.append('dryRun', String(dryRunInput.checked))
      body.append('file', file)

      return {
        kind: 'xlsx',
        init: {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${tokenInput.value.trim()}`,
          },
          body,
        },
      }
    }

    if (!filename.endsWith('.json')) {
      throw new Error('Choose a .xlsx workbook or .json file.')
    }

    return buildJsonRequest(await file.text())
  }

  const pasted = jsonInput.value.trim()

  if (!pasted) {
    throw new Error('Choose a .xlsx workbook, choose a JSON file, or paste JSON first.')
  }

  return buildJsonRequest(pasted)
}

function buildJsonRequest(cmsFactsJson) {
  JSON.parse(cmsFactsJson)

  return {
    kind: 'json',
    init: {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tokenInput.value.trim()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        dryRun: dryRunInput.checked,
        cmsFactsJson,
      }),
    },
  }
}

function parseProductIds(value) {
  const productIds = [...new Set(String(value || '')
    .split(/[\s,;；，、]+/)
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean))]

  if (!productIds.length) {
    throw new Error('Paste at least one product_id first.')
  }

  const invalid = productIds.filter((productId) => !/^prd_[a-z0-9_]+$/.test(productId))

  if (invalid.length) {
    throw new Error(`Invalid product_id value(s): ${invalid.join(', ')}`)
  }

  return productIds
}

function parseResponseBody(text, status) {
  try {
    return JSON.parse(text)
  } catch (_error) {
    return {
      ok: false,
      status,
      message: text || 'The server returned an empty non-JSON response.',
    }
  }
}
