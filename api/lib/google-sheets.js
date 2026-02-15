// Google Sheets API v4 adapter (plain JS for Vercel serverless runtime)

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

function getConfig() {
  return {
    serviceAccountEmail: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || '',
    privateKey: (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
    sheetId: process.env.GOOGLE_SHEET_ID || '',
  };
}

// Helper to ensure a sheet exists, create it if not
async function ensureSheetExists(sheetId, token, sheetName, headers) {
  try {
    // Get all sheets in the spreadsheet
    const metaUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}?fields=sheets.properties`;
    const metaRes = await fetch(metaUrl, { headers: { Authorization: `Bearer ${token}` } });
    const metaData = await metaRes.json();
    
    const existingSheet = metaData.sheets?.find((s) => s.properties?.title === sheetName);
    
    if (existingSheet) {
      // Sheet exists, check if it has headers
      const dataUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${sheetName}!A1:Z1`;
      const dataRes = await fetch(dataUrl, { headers: { Authorization: `Bearer ${token}` } });
      const dataData = await dataRes.json();
      
      // If no data or first row doesn't match headers, add headers
      if (!dataData.values || dataData.values.length === 0 || dataData.values[0][0] !== headers[0]) {
        const updateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${sheetName}!A1:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;
        await fetch(updateUrl, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ values: [headers] }),
        });
      }
      return;
    }

    // Sheet doesn't exist, create it
    const createUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}:batchUpdate`;
    const createRes = await fetch(createUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: [{
          addSheet: {
            properties: {
              title: sheetName,
            },
          },
        }],
      }),
    });

    if (!createRes.ok) {
      const error = await createRes.text();
      throw new Error(`Failed to create sheet ${sheetName}: ${error}`);
    }

    // Add headers
    const updateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${sheetName}!A1:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;
    await fetch(updateUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ values: [headers] }),
    });
  } catch (error) {
    console.error(`Error ensuring sheet ${sheetName} exists:`, error);
    throw error;
  }
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
  'started_date', 'email_log', 'rejection_date',
];

export async function appendApplication(row) {
  const config = getConfig();
  const token = await getAccessToken();
  const values = COLUMNS.map((col) => row[col] || '');

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${config.sheetId}/values/Applications!A:S:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;

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

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${config.sheetId}/values/Applications!A:S`;

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

export async function getApplicationByEmail(email) {
  const all = await getAllApplications();
  return all.find((r) => r.email && r.email.toLowerCase() === email.toLowerCase()) || null;
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

  // Extra fields: started_date (col Q), email_log (col R), rejection_date (col S)
  if (extraFields) {
    if (extraFields.started_date !== undefined) {
      updates.push({ range: `Applications!Q${rowIndex}`, values: [[extraFields.started_date]] });
    }
    if (extraFields.email_log !== undefined) {
      updates.push({ range: `Applications!R${rowIndex}`, values: [[extraFields.email_log]] });
    }
    if (extraFields.rejection_date !== undefined) {
      updates.push({ range: `Applications!S${rowIndex}`, values: [[extraFields.rejection_date]] });
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
    HIRED: { red: 0.85, green: 0.95, blue: 0.85 },      // light green (pastel)
    REJECTED: { red: 0.95, green: 0.80, blue: 0.80 },    // full row light red
    INTERVIEW: { red: 0.85, green: 0.90, blue: 1.0 },    // light blue tint
    AUDIO_PASS: { red: 1.0, green: 0.97, blue: 0.85 },   // light yellow tint
    NEW: null, // reset to default
  };
  const color = colors[status];

  try {
    // Get the sheet's numeric ID (usually 0 for the first sheet)
    const metaUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}?fields=sheets.properties`;
    const metaRes = await fetch(metaUrl, { headers: { Authorization: `Bearer ${token}` } });
    const metaData = await metaRes.json();
    const sheet = metaData.sheets?.find((s) => s.properties?.title === 'Applications');
    const numericSheetId = sheet?.properties?.sheetId ?? 0;

    const bgColor = color ? { red: color.red, green: color.green, blue: color.blue } : { red: 1, green: 1, blue: 1 };

    const req = {
      requests: [{
        repeatCell: {
          range: {
            sheetId: numericSheetId,
            startRowIndex: rowIndex - 1,
            endRowIndex: rowIndex,
            startColumnIndex: 0,
            endColumnIndex: 19,
          },
          cell: {
            userEnteredFormat: {
              backgroundColor: bgColor,
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

// ─── Blocked Countries Management ─────────────────────────────────────────────

export async function getBlockedCountries() {
  const config = getConfig();
  const token = await getAccessToken();

  // Ensure the sheet exists
  await ensureSheetExists(config.sheetId, token, 'BlockedCountries', ['country']);

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${config.sheetId}/values/BlockedCountries!A:A`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Failed to fetch blocked countries: ${error}`);
  }

  const data = await res.json();
  const rows = data.values || [];
  
  // Skip header row if it exists
  const dataRows = rows.length > 0 && rows[0][0] === 'country' ? rows.slice(1) : rows;
  
  return dataRows.map(row => row[0]).filter(Boolean);
}

export async function updateBlockedCountries(countries) {
  const config = getConfig();
  const token = await getAccessToken();

  // Ensure the sheet exists
  await ensureSheetExists(config.sheetId, token, 'BlockedCountries', ['country']);

  // First, clear existing data
  const clearUrl = `https://sheets.googleapis.com/v4/spreadsheets/${config.sheetId}/values/BlockedCountries!A:A:clear`;
  await fetch(clearUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  // Then append header + countries
  const values = [['country'], ...countries.map(c => [c])];
  
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${config.sheetId}/values/BlockedCountries!A1:append?valueInputOption=USER_ENTERED&insertDataOption=OVERWRITE`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ values }),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Failed to update blocked countries: ${error}`);
  }
}

// ─── Interested Applicants Management ─────────────────────────────────────────

const INTERESTED_COLUMNS = [
  'timestamp', 'email', 'full_name', 'country', 'company_id', 'role_id', 'role_title'
];

export async function addInterestedApplicant(data) {
  const config = getConfig();
  const token = await getAccessToken();

  // Ensure the sheet exists
  await ensureSheetExists(config.sheetId, token, 'InterestedApplicants', INTERESTED_COLUMNS);

  const values = INTERESTED_COLUMNS.map((col) => data[col] || '');

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${config.sheetId}/values/InterestedApplicants!A:G:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;

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
    throw new Error(`Failed to add interested applicant: ${error}`);
  }
}

export async function getAllInterestedApplicants() {
  const config = getConfig();
  const token = await getAccessToken();

  // Ensure the sheet exists
  await ensureSheetExists(config.sheetId, token, 'InterestedApplicants', INTERESTED_COLUMNS);

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${config.sheetId}/values/InterestedApplicants!A:G`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Failed to fetch interested applicants: ${error}`);
  }

  const data = await res.json();
  const rows = data.values || [];

  const dataRows = rows.length > 0 && rows[0][0] === 'timestamp' ? rows.slice(1) : rows;

  return dataRows.map((row) => {
    const obj = {};
    INTERESTED_COLUMNS.forEach((col, i) => {
      obj[col] = row[i] || '';
    });
    return obj;
  });
}

export async function deleteInterestedApplicant(email) {
  const config = getConfig();
  const token = await getAccessToken();

  const allUrl = `https://sheets.googleapis.com/v4/spreadsheets/${config.sheetId}/values/InterestedApplicants!B:B`;
  const allRes = await fetch(allUrl, { headers: { Authorization: `Bearer ${token}` } });
  const allData = await allRes.json();
  const emails = allData.values || [];

  let rowIndex = -1;
  for (let i = 0; i < emails.length; i++) {
    if (emails[i][0] === email) {
      rowIndex = i;
      break;
    }
  }

  if (rowIndex === -1) {
    throw new Error(`Interested applicant ${email} not found`);
  }

  // Get the sheet's numeric ID
  const metaUrl = `https://sheets.googleapis.com/v4/spreadsheets/${config.sheetId}?fields=sheets.properties`;
  const metaRes = await fetch(metaUrl, { headers: { Authorization: `Bearer ${token}` } });
  const metaData = await metaRes.json();
  const sheet = metaData.sheets?.find((s) => s.properties?.title === 'InterestedApplicants');
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
    throw new Error(`Failed to delete interested applicant: ${error}`);
  }
}

// ================== Job Postings Management ==================

const JOB_POSTINGS_COLUMNS = [
  'company_id',
  'company_name',
  'company_tagline',
  'company_description',
  'company_industry',
  'role_id',
  'role_title',
  'role_type',
  'salary_usd',
  'salary_bdt',
  'bosnian_only',
  'tags',
  'short_description',
  'full_description',
  'requirements',
  'perks',
  'created_at',
  'updated_at'
];

export async function getAllJobPostings() {
  const config = getConfig();
  const token = await getAccessToken();

  // Ensure the sheet exists
  await ensureSheetExists(config.sheetId, token, 'JobPostings', JOB_POSTINGS_COLUMNS);

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${config.sheetId}/values/JobPostings!A:R`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Failed to fetch job postings: ${error}`);
  }

  const data = await res.json();
  const rows = data.values || [];

  const dataRows = rows.length > 0 && rows[0][0] === 'company_id' ? rows.slice(1) : rows;

  return dataRows.map((row) => {
    const obj = {};
    JOB_POSTINGS_COLUMNS.forEach((col, i) => {
      obj[col] = row[i] || '';
    });
    return obj;
  });
}

export async function createJobPosting(jobData) {
  const config = getConfig();
  const token = await getAccessToken();

  // Ensure the sheet exists
  await ensureSheetExists(config.sheetId, token, 'JobPostings', JOB_POSTINGS_COLUMNS);

  const now = new Date().toISOString();

  const row = [
    jobData.company_id || '',
    jobData.company_name || '',
    jobData.company_tagline || '',
    jobData.company_description || '',
    jobData.company_industry || '',
    jobData.role_id || '',
    jobData.role_title || '',
    jobData.role_type || '',
    jobData.salary_usd || '',
    jobData.salary_bdt || '',
    jobData.bosnian_only || 'false',
    jobData.tags || '', // comma-separated or JSON string
    jobData.short_description || '',
    jobData.full_description || '',
    jobData.requirements || '', // comma-separated or JSON string
    jobData.perks || '', // comma-separated or JSON string
    now,
    now
  ];

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${config.sheetId}/values/JobPostings!A:R:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ values: [row] }),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Failed to create job posting: ${error}`);
  }

  return { success: true, message: 'Job posting created' };
}

export async function updateJobPosting(companyId, roleId, updates) {
  const config = getConfig();
  const token = await getAccessToken();

  // Find the row index
  const allUrl = `https://sheets.googleapis.com/v4/spreadsheets/${config.sheetId}/values/JobPostings!A:F`;
  const allRes = await fetch(allUrl, { headers: { Authorization: `Bearer ${token}` } });
  const allData = await allRes.json();
  const rows = allData.values || [];

  let rowIndex = -1;
  for (let i = 0; i < rows.length; i++) {
    if (rows[i][0] === companyId && rows[i][5] === roleId) {
      rowIndex = i + 1; // +1 because sheets are 1-indexed
      break;
    }
  }

  if (rowIndex === -1) {
    throw new Error(`Job posting ${companyId}/${roleId} not found`);
  }

  // Get current row data
  const currentRowUrl = `https://sheets.googleapis.com/v4/spreadsheets/${config.sheetId}/values/JobPostings!A${rowIndex}:R${rowIndex}`;
  const currentRes = await fetch(currentRowUrl, { headers: { Authorization: `Bearer ${token}` } });
  const currentData = await currentRes.json();
  const currentRow = currentData.values?.[0] || [];

  // Build updated row
  const updatedRow = [...currentRow];
  const columnMap = {
    company_name: 1,
    company_tagline: 2,
    company_description: 3,
    company_industry: 4,
    role_title: 6,
    role_type: 7,
    salary_usd: 8,
    salary_bdt: 9,
    bosnian_only: 10,
    tags: 11,
    short_description: 12,
    full_description: 13,
    requirements: 14,
    perks: 15,
  };

  Object.keys(updates).forEach((key) => {
    if (columnMap[key] !== undefined) {
      updatedRow[columnMap[key]] = updates[key];
    }
  });

  // Update timestamp
  updatedRow[17] = new Date().toISOString();

  const updateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${config.sheetId}/values/JobPostings!A${rowIndex}:R${rowIndex}?valueInputOption=USER_ENTERED`;
  const updateRes = await fetch(updateUrl, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ values: [updatedRow] }),
  });

  if (!updateRes.ok) {
    const error = await updateRes.text();
    throw new Error(`Failed to update job posting: ${error}`);
  }

  return { success: true, message: 'Job posting updated' };
}

export async function deleteJobPosting(companyId, roleId) {
  const config = getConfig();
  const token = await getAccessToken();

  // Find the row index
  const allUrl = `https://sheets.googleapis.com/v4/spreadsheets/${config.sheetId}/values/JobPostings!A:F`;
  const allRes = await fetch(allUrl, { headers: { Authorization: `Bearer ${token}` } });
  const allData = await allRes.json();
  const rows = allData.values || [];

  let rowIndex = -1;
  for (let i = 0; i < rows.length; i++) {
    if (rows[i][0] === companyId && rows[i][5] === roleId) {
      rowIndex = i;
      break;
    }
  }

  if (rowIndex === -1) {
    throw new Error(`Job posting ${companyId}/${roleId} not found`);
  }

  // Get the sheet's numeric ID
  const metaUrl = `https://sheets.googleapis.com/v4/spreadsheets/${config.sheetId}?fields=sheets.properties`;
  const metaRes = await fetch(metaUrl, { headers: { Authorization: `Bearer ${token}` } });
  const metaData = await metaRes.json();
  const sheet = metaData.sheets?.find((s) => s.properties?.title === 'JobPostings');
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
    throw new Error(`Failed to delete job posting: ${error}`);
  }

  return { success: true, message: 'Job posting deleted' };
}

