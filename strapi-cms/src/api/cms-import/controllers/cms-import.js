'use strict'

module.exports = {
  async ui(ctx) {
    ctx.type = 'html'
    ctx.set('cache-control', 'no-store')
    ctx.body = renderImportPage()
  },

  async import(ctx) {
    try {
      const uploadedFile = readUploadedFile(ctx.request.files)
      const dryRun = readDryRun(ctx.request.body)
      const result = uploadedFile
        ? await strapi.service('api::cms-import.cms-import').importWorkbook(uploadedFile, { dryRun })
        : await importJsonPayload(ctx.request.body, { dryRun })

      ctx.set('cache-control', 'no-store')
      ctx.body = result
    } catch (error) {
      if (error && error.status) {
        return ctx.throw(error.status, error.message)
      }

      throw error
    }
  },
}

async function importJsonPayload(body, options) {
  const payload = requireObject(body, 'request body')
  const cmsFacts = readCmsFactsPayload(payload)
  return strapi.service('api::cms-import.cms-import').import(cmsFacts, options)
}

function readDryRun(body) {
  if (!body || typeof body !== 'object') {
    return true
  }

  if (body.dryRun === false || body.dryRun === 'false') {
    return false
  }

  return true
}

function readUploadedFile(files) {
  if (!files || typeof files !== 'object') {
    return undefined
  }

  const candidates = [
    files.file,
    files.workbook,
    ...Object.values(files),
  ].flat().filter(Boolean)

  const file = candidates.find((candidate) => candidate && typeof candidate === 'object')

  if (!file) {
    return undefined
  }

  const filename = file.originalFilename || file.name || ''

  if (filename.toLowerCase().endsWith('.xls')) {
    throw httpError(400, 'Legacy .xls files are not supported. Save the workbook as .xlsx and upload again.')
  }

  if (filename && !filename.toLowerCase().endsWith('.xlsx')) {
    throw httpError(400, 'Only .xlsx workbook uploads are supported for Excel import.')
  }

  return file
}

function readCmsFactsPayload(payload) {
  if (payload.cmsFacts && typeof payload.cmsFacts === 'object') {
    return payload.cmsFacts
  }

  if (typeof payload.cmsFactsJson === 'string' && payload.cmsFactsJson.trim()) {
    try {
      return JSON.parse(payload.cmsFactsJson)
    } catch (error) {
      throw httpError(400, `cmsFactsJson is not valid JSON: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  throw httpError(400, 'cmsFacts or cmsFactsJson is required.')
}

function requireObject(value, path) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw httpError(400, `${path} must be an object.`)
  }

  return value
}

function httpError(status, message) {
  const error = new Error(message)
  error.status = status
  return error
}

function renderImportPage() {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Yufavor CMS Batch Import</title>
  <style>
    :root {
      color-scheme: light;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      background: #f6f7f9;
      color: #1d2433;
    }
    body {
      margin: 0;
      padding: 32px;
    }
    main {
      max-width: 920px;
      margin: 0 auto;
    }
    h1 {
      margin: 0 0 8px;
      font-size: 28px;
      line-height: 1.2;
    }
    p {
      margin: 0 0 20px;
      color: #5c667a;
      line-height: 1.6;
    }
    form, pre {
      background: #fff;
      border: 1px solid #d9dee8;
      border-radius: 8px;
      padding: 20px;
      box-shadow: 0 8px 24px rgba(29, 36, 51, 0.06);
    }
    label {
      display: block;
      margin: 16px 0 6px;
      font-weight: 650;
    }
    input[type="password"], input[type="file"], textarea {
      width: 100%;
      box-sizing: border-box;
      border: 1px solid #c7cfdd;
      border-radius: 6px;
      padding: 10px 12px;
      font: inherit;
      background: #fff;
    }
    textarea {
      min-height: 220px;
      font-family: ui-monospace, SFMono-Regular, Consolas, "Liberation Mono", monospace;
      resize: vertical;
    }
    .row {
      display: flex;
      gap: 12px;
      align-items: center;
      flex-wrap: wrap;
      margin-top: 18px;
    }
    button {
      border: 0;
      border-radius: 6px;
      background: #111827;
      color: #fff;
      padding: 10px 16px;
      font-weight: 700;
      cursor: pointer;
    }
    button.secondary {
      background: #315f9d;
    }
    button:disabled {
      cursor: progress;
      opacity: 0.7;
    }
    .hint {
      color: #667085;
      font-size: 13px;
    }
    pre {
      overflow: auto;
      min-height: 160px;
      white-space: pre-wrap;
      margin-top: 18px;
      font-family: ui-monospace, SFMono-Regular, Consolas, "Liberation Mono", monospace;
      font-size: 13px;
    }
  </style>
</head>
<body>
  <main>
    <h1>Yufavor CMS Batch Import</h1>
    <p>Upload a simplified .xlsx workbook, or paste CmsFactInput JSON as fallback. Run dry-run first. Import requires INTERNAL_CMS_IMPORT_TOKEN.</p>
    <form id="cms-import-form">
      <label for="token">Import token</label>
      <input id="token" name="token" type="password" autocomplete="off" required>

      <label for="file">Excel workbook or JSON file</label>
      <input id="file" name="file" type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/json,.json">
      <div class="hint">Preferred: .xlsx workbook with sheets categories, products, product_specs, and optional product_assets.</div>

      <label for="json">Or paste JSON</label>
      <textarea id="json" name="json" spellcheck="false"></textarea>

      <div class="row">
        <label><input id="dryRun" type="checkbox" checked> Dry-run only</label>
        <button type="submit">Run</button>
        <button class="secondary" id="clear" type="button">Clear Result</button>
      </div>
    </form>
    <pre id="result">Waiting for input.</pre>
  </main>
  <script src="/cms-import.js" defer></script>
</body>
</html>`
}
