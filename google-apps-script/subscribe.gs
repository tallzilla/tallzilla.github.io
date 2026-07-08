// Original code from https://github.com/jamiewilson/form-to-google-sheets
// Updated for 2021 and ES6 standards
//
// This file is the source of truth for the "emails" sheet's doPost handler,
// but Google Apps Script does not deploy from GitHub automatically. After
// editing this file, copy it into the Apps Script editor for the bound
// spreadsheet (Extensions > Apps Script) and redeploy the web app.

const sheetName = 'emails'
const scriptProp = PropertiesService.getScriptProperties()

function initialSetup () {
  const activeSpreadsheet = SpreadsheetApp.getActiveSpreadsheet()
  scriptProp.setProperty('key', activeSpreadsheet.getId())
}

// Gmail ignores dots and anything after "+" in the local part, so bots
// generate lots of "unique-looking" addresses that all land in one inbox.
// Normalize before comparing so those collapse to a single entry.
function normalizeEmail (email) {
  email = (email || '').trim().toLowerCase()
  const atIndex = email.indexOf('@')
  if (atIndex === -1) return email
  let local = email.slice(0, atIndex)
  const domain = email.slice(atIndex + 1)
  if (domain === 'gmail.com' || domain === 'googlemail.com') {
    local = local.split('+')[0].replace(/\./g, '')
  }
  return `${local}@${domain}`
}

function fakeSuccess () {
  return ContentService
    .createTextOutput(JSON.stringify({ result: 'success' }))
    .setMimeType(ContentService.MimeType.JSON)
}

// Set via Project Settings > Script Properties in the Apps Script editor,
// not hardcoded here, so the secret never ends up in the public GitHub repo.
function verifyRecaptcha (token) {
  if (!token) return false
  const secret = scriptProp.getProperty('RECAPTCHA_SECRET')
  const response = UrlFetchApp.fetch('https://www.google.com/recaptcha/api/siteverify', {
    method: 'post',
    payload: { secret: secret, response: token }
  })
  const result = JSON.parse(response.getContentText())
  return result.success && result.action === 'subscribe' && result.score >= 0.5
}

function doPost (e) {
  const lock = LockService.getScriptLock()
  lock.tryLock(10000)

  try {
    const params = e.parameter
    const email = normalizeEmail(params.fan)

    // Honeypot filled, missing/wrong token, or no email at all: pretend
    // success so scripted clients don't learn they were rejected.
    if (params.email !== '' || params._h !== 'zilla42' || !email) {
      return fakeSuccess()
    }

    if (!verifyRecaptcha(params.g_recaptcha_response)) {
      return fakeSuccess()
    }

    // Collapse rapid repeat submissions of the same address into one.
    const cache = CacheService.getScriptCache()
    const cacheKey = 'sub_' + email
    if (cache.get(cacheKey)) {
      return fakeSuccess()
    }
    cache.put(cacheKey, '1', 300)

    const doc = SpreadsheetApp.openById(scriptProp.getProperty('key'))
    const sheet = doc.getSheetByName(sheetName)
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0]
    const emailCol = headers.indexOf('Email')

    const existingRowCount = Math.max(sheet.getLastRow() - 1, 0)
    if (existingRowCount > 0 && emailCol !== -1) {
      const existing = sheet.getRange(2, emailCol + 1, existingRowCount, 1).getValues()
      const alreadySubscribed = existing.some(row => normalizeEmail(row[0]) === email)
      if (alreadySubscribed) {
        return fakeSuccess()
      }
    }

    const nextRow = sheet.getLastRow() + 1
    const newRow = headers.map(function (header) {
      if (header === 'Date') return new Date()
      if (header === 'Email') return params.fan
      return params[header]
    })

    sheet.getRange(nextRow, 1, 1, newRow.length).setValues([newRow])

    return ContentService
      .createTextOutput(JSON.stringify({ result: 'success', row: nextRow }))
      .setMimeType(ContentService.MimeType.JSON)
  }

  catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ result: 'error', error: err }))
      .setMimeType(ContentService.MimeType.JSON)
  }

  finally {
    lock.releaseLock()
  }
}
