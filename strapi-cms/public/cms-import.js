const form = document.getElementById('cms-import-form')
const tokenInput = document.getElementById('token')
const fileInput = document.getElementById('file')
const jsonInput = document.getElementById('json')
const dryRunInput = document.getElementById('dryRun')
const result = document.getElementById('result')
const clearButton = document.getElementById('clear')

clearButton.addEventListener('click', () => {
  result.textContent = 'Waiting for input.'
})

form.addEventListener('submit', async (event) => {
  event.preventDefault()

  const submitButton = form.querySelector('button[type="submit"]')
  submitButton.disabled = true
  result.textContent = 'Reading batch...'

  try {
    const cmsFactsJson = await readInputJson()

    JSON.parse(cmsFactsJson)
    result.textContent = 'Sending batch...'

    const response = await fetch('/internal/cms/import', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tokenInput.value.trim()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        dryRun: dryRunInput.checked,
        cmsFactsJson,
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

async function readInputJson() {
  const file = fileInput.files && fileInput.files[0]

  if (file) {
    return file.text()
  }

  const pasted = jsonInput.value.trim()

  if (!pasted) {
    throw new Error('Choose a JSON file or paste JSON first.')
  }

  return pasted
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
