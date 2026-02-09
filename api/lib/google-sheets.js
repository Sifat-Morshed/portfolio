// Google Sheets API v4 adapter (plain JS for Vercel serverless runtime)

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

function getConfig() {
  return {
    serviceAccountEmail: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || '',
    privateKey: (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
    sheetId: process.env.GOOGLE_SHEET_ID || '',
  };
}

async function getAccessToken() {
  const config = getConfig();
  const now = Math.floor(Date.now() / 1000);

  const header = { alg: 'RS256', typ: 'JWT' };
  const payload = {
    iss: config.serviceAccountEmail,
    scope: SCOPES.join(' '),
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  };

  const encoder = new TextEncoder();
  const headerB64 = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const payloadB64 = btoa(JSON.stringify(payload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const unsignedToken = `${headerB64}.${payloadB64}`;

  const pemContents = config.privateKey
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\s/g, '');

  const binaryDer = Uint8Array.from(atob(pemContents), (c) => c.charCodeAt(0));

  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    binaryDer.buffer,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    encoder.encode(unsignedToken)
  );

  const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  const jwt = `${unsignedToken}.${signatureB64}`;

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });

  const tokenData = await tokenRes.json();
  if (!tokenData.access_token) {
    throw new Error('Failed to get access token from Google');
  }
  return tokenData.access_token;
}

const COLUMNS = [
  'app_id', 'timestamp', 'status', 'company_id', 'role_id', 'role_title',
  'full_name', 'email', 'phone', 'nationality', 'reference',
  'blacklist_acknowledged', 'cv_link', 'audio_link', 'notes', 'last_updated',
  'started_date', 'email_log',
];

export async function appendApplication(row) {
  const config = getConfig();
  const token = await getAccessToken();
  const values = COLUMNS.map((col) => row[col] || '');

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${config.sheetId}/values/Applications!A:R:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ values: [values] }),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Failed to append row: ${error}`);
  }
}

export async function getAllApplications() {
  const config = getConfig();
  const token = await getAccessToken();

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${config.sheetId}/values/Applications!A:R`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Failed to fetch rows: ${error}`);
  }

  const data = await res.json();
  const rows = data.values || [];

  const dataRows = rows.length > 0 && rows[0][0] === 'app_id' ? rows.slice(1) : rows;

  return dataRows.map((row) => {
    const obj = {};
    COLUMNS.forEach((col, i) => {
      obj[col] = row[i] || '';
    });
    return obj;
  });
}

export async function getApplicationById(appId) {
  const all = await getAllApplications();
  return all.find((r) => r.app_id === appId) || null;
}

export async function updateApplicationStatus(appId, status, notes, extraFields) {
  const config = getConfig();
  const token = await getAccessToken();

  const allUrl = `https://sheets.googleapis.com/v4/spreadsheets/${config.sheetId}/values/Applications!A:A`;
  const allRes = await fetch(allUrl, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const allData = await allRes.json();
  const ids = allData.values || [];

  let rowIndex = -1;
  for (let i = 0; i < ids.length; i++) {
    if (ids[i][0] === appId) {
      rowIndex = i + 1;
      break;
    }
  }

  if (rowIndex === -1) {
    throw new Error(`Application ${appId} not found`);
  }

  const now = new Date().toISOString();
  const updates = [
    { range: `Applications!C${rowIndex}`, values: [[status]] },
    { range: `Applications!P${rowIndex}`, values: [[now]] },
  ];

  if (notes !== undefined) {
    updates.push({ range: `Applications!O${rowIndex}`, values: [[notes]] });
  }

  // Extra fields: started_date (col Q), email_log (col R)
  if (extraFields) {
    if (extraFields.started_date !== undefined) {
      updates.push({ range: `Applications!Q${rowIndex}`, values: [[extraFields.started_date]] });
    }
    if (extraFields.email_log !== undefined) {
      updates.push({ range: `Applications!R${rowIndex}`, values: [[extraFields.email_log]] });
    }
  }

  const batchUrl = `https://sheets.googleapis.com/v4/spreadsheets/${config.sheetId}/values:batchUpdate`;
  const batchRes = await fetch(batchUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      valueInputOption: 'USER_ENTERED',
      data: updates,
    }),
  });

  if (!batchRes.ok) {
    const error = await batchRes.text();
    throw new Error(`Failed to update row: ${error}`);
  }

  // Apply row color formatting based on status
  await applyRowColor(config.sheetId, token, rowIndex, status);
}

// Apply background color to the entire row based on status
async function applyRowColor(sheetId, token, rowIndex, status) {
  const colors = {
    HIRED: { red: 0.06, green: 0.45, blue: 0.31, alpha: 0.15 },    // green tint
    REJECTED: { red: 0.94, green: 0.27, blue: 0.27, alpha: 0.15 }, // red tint
    INTERVIEW: { red: 0.23, green: 0.51, blue: 0.96, alpha: 0.1 }, // blue tint
    AUDIO_PASS: { red: 0.92, green: 0.72, blue: 0.03, alpha: 0.1 }, // yellow tint
  };
  const color = colors[status];
  if (!color) return; // NEW has no special color

  try {
    // Get the sheet's numeric ID (usually 0 for the first sheet)
    const metaUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}?fields=sheets.properties`;
    const metaRes = await fetch(metaUrl, { headers: { Authorization: `Bearer ${token}` } });
    const metaData = await metaRes.json();
    const sheet = metaData.sheets?.find((s) => s.properties?.title === 'Applications');
    const numericSheetId = sheet?.properties?.sheetId ?? 0;

    const req = {
      requests: [{
        repeatCell: {
          range: {
            sheetId: numericSheetId,
            startRowIndex: rowIndex - 1,
            endRowIndex: rowIndex,
            startColumnIndex: 0,
            endColumnIndex: 18,
          },
          cell: {
            userEnteredFormat: {
              backgroundColor: {
                red: color.red,
                green: color.green,
                blue: color.blue,
              },
            },
          },
          fields: 'userEnteredFormat.backgroundColor',
        },
      }],
    };

    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetId}:batchUpdate`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
    });
  } catch (e) {
    console.error('Row color formatting failed (non-fatal):', e);
  }
}

// Delete an application row by app_id
export async function deleteApplication(appId) {
  const config = getConfig();
  const token = await getAccessToken();

  const allUrl = `https://sheets.googleapis.com/v4/spreadsheets/${config.sheetId}/values/Applications!A:A`;
  const allRes = await fetch(allUrl, { headers: { Authorization: `Bearer ${token}` } });
  const allData = await allRes.json();
  const ids = allData.values || [];

  let rowIndex = -1;
  for (let i = 0; i < ids.length; i++) {
    if (ids[i][0] === appId) {
      rowIndex = i;
      break;
    }
  }

  if (rowIndex === -1) {
    throw new Error(`Application ${appId} not found`);
  }

  // Get the sheet's numeric ID
  const metaUrl = `https://sheets.googleapis.com/v4/spreadsheets/${config.sheetId}?fields=sheets.properties`;
  const metaRes = await fetch(metaUrl, { headers: { Authorization: `Bearer ${token}` } });
  const metaData = await metaRes.json();
  const sheet = metaData.sheets?.find((s) => s.properties?.title === 'Applications');
  const numericSheetId = sheet?.properties?.sheetId ?? 0;

  const deleteUrl = `https://sheets.googleapis.com/v4/spreadsheets/${config.sheetId}:batchUpdate`;
  const deleteRes = await fetch(deleteUrl, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      requests: [{
        deleteDimension: {
          range: {
            sheetId: numericSheetId,
            dimension: 'ROWS',
            startIndex: rowIndex,
            endIndex: rowIndex + 1,
          },
        },
      }],
    }),
  });

  if (!deleteRes.ok) {
    const error = await deleteRes.text();
    throw new Error(`Failed to delete row: ${error}`);
  }
}

export async function exportApplicationsCSV() {
  const apps = await getAllApplications();
  const header = COLUMNS.join(',');
  const rows = apps.map((app) =>
    COLUMNS.map((col) => {
      const val = app[col] || '';
      if (val.includes(',') || val.includes('"') || val.includes('\n')) {
        return `"${val.replace(/"/g, '""')}"`;
      }
      return val;
    }).join(',')
  );
  return [header, ...rows].join('\n');
}
