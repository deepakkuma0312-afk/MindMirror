const fs = require('fs');
const path = require('path');
const { Client, TablesDB } = require('node-appwrite');

// 1. Read .env file
const envPath = path.join(__dirname, '../.env');
if (!fs.existsSync(envPath)) {
  console.error('Error: .env file not found. Please create it first.');
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split(/\r?\n/).forEach(line => {
  const match = line.match(/^\s*([^#=]+)\s*=\s*(.*)\s*$/);
  if (match) {
    const key = match[1].trim();
    let val = match[2].trim();
    // remove quotes if present
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.substring(1, val.length - 1);
    }
    env[key] = val;
  }
});

const endpoint = env['APPWRITE_ENDPOINT'];
const projectId = env['APPWRITE_PROJECT_ID'];
const databaseId = env['APPWRITE_DATABASE_ID'];
const apiKey = env['APPWRITE_API_KEY'];

if (!endpoint || !projectId || !databaseId || !apiKey) {
  console.error('Error: Missing required Appwrite variables in .env file.');
  console.error('Ensure APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID, APPWRITE_DATABASE_ID, and APPWRITE_API_KEY are set.');
  process.exit(1);
}

// 2. Initialize Appwrite Client
const client = new Client()
  .setEndpoint(endpoint)
  .setProject(projectId)
  .setKey(apiKey);

const tablesDB = new TablesDB(client);

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Helper to poll column creation status until it is available
async function waitForColumns(databaseId, tableId, expectedKeys) {
  console.log(`Waiting for columns in table "${tableId}" to be created...`);
  while (true) {
    try {
      const tbl = await tablesDB.getTable({ databaseId, tableId });
      const columns = tbl.columns || [];
      const activeCols = columns.filter(col => col.status === 'available').map(col => col.key);
      const missing = expectedKeys.filter(k => !activeCols.includes(k));
      if (missing.length === 0) {
        console.log(`All columns for "${tableId}" are available!`);
        break;
      }
      console.log(`  - Still processing columns: ${missing.join(', ')}`);
      await sleep(2000);
    } catch (e) {
      console.error(`Error checking columns for ${tableId}:`, e.message);
      await sleep(3000);
    }
  }
}

async function run() {
  try {
    // Check database or create it
    console.log(`Checking if database "${databaseId}" exists...`);
    try {
      await tablesDB.get({ databaseId });
      console.log(`Database "${databaseId}" found!`);
    } catch (e) {
      console.log(`Database not found. Creating database "${databaseId}"...`);
      await tablesDB.create({ databaseId, name: 'MindMirror DB' });
      console.log(`Database "${databaseId}" created successfully!`);
    }

    const tables = [
      {
        key: 'APPWRITE_USERS_TABLE_ID',
        name: 'Users',
        id: 'users',
        columns: [
          { type: 'string', key: 'email', size: 256, required: true },
          { type: 'string', key: 'name', size: 256, required: false },
          { type: 'string', key: 'role', size: 50, required: true },
          { type: 'string', key: 'therapistId', size: 50, required: false },
          { type: 'string', key: 'timezone', size: 50, required: false },
          { type: 'string', key: 'clinicalNotes', size: 5000, required: false },
          { type: 'datetime', key: 'createdAt', required: false }
        ]
      },
      {
        key: 'APPWRITE_MOOD_ENTRIES_TABLE_ID',
        name: 'Mood Entries',
        id: 'mood_entries',
        columns: [
          { type: 'string', key: 'userId', size: 50, required: true },
          { type: 'integer', key: 'moodScore', required: true },
          { type: 'integer', key: 'energy', required: true },
          { type: 'float', key: 'sleepHours', required: false },
          { type: 'string', key: 'tags', size: 1000, required: false },
          { type: 'string', key: 'note', size: 5000, required: false },
          { type: 'string', key: 'source', size: 50, required: true },
          { type: 'datetime', key: 'createdAt', required: false }
        ]
      },
      {
        key: 'APPWRITE_AI_CONVERSATIONS_TABLE_ID',
        name: 'AI Conversations',
        id: 'ai_conversations',
        columns: [
          { type: 'string', key: 'userId', size: 50, required: true },
          { type: 'longtext', key: 'messages', required: true },
          { type: 'string', key: 'extractedSignals', size: 10000, required: false },
          { type: 'float', key: 'sentimentScore', required: false },
          { type: 'boolean', key: 'crisisFlagged', required: true },
          { type: 'datetime', key: 'createdAt', required: false }
        ]
      },
      {
        key: 'APPWRITE_ASSESSMENTS_TABLE_ID',
        name: 'Assessments',
        id: 'assessments',
        columns: [
          { type: 'string', key: 'userId', size: 50, required: true },
          { type: 'string', key: 'type', size: 50, required: true },
          { type: 'string', key: 'responses', size: 10000, required: true },
          { type: 'integer', key: 'score', required: true },
          { type: 'string', key: 'severity', size: 50, required: true },
          { type: 'datetime', key: 'createdAt', required: false }
        ]
      },
      {
        key: 'APPWRITE_INSIGHTS_TABLE_ID',
        name: 'Insights',
        id: 'insights',
        columns: [
          { type: 'string', key: 'userId', size: 50, required: true },
          { type: 'datetime', key: 'weekStart', required: true },
          { type: 'longtext', key: 'summaryMd', required: true },
          { type: 'string', key: 'trend', size: 50, required: true },
          { type: 'string', key: 'riskLevel', size: 50, required: true },
          { type: 'datetime', key: 'createdAt', required: false }
        ]
      },
      {
        key: 'APPWRITE_ALERTS_TABLE_ID',
        name: 'Alerts',
        id: 'alerts',
        columns: [
          { type: 'string', key: 'userId', size: 50, required: true },
          { type: 'string', key: 'therapistId', size: 50, required: true },
          { type: 'string', key: 'type', size: 50, required: true },
          { type: 'string', key: 'severity', size: 50, required: true },
          { type: 'string', key: 'message', size: 1000, required: true },
          { type: 'boolean', key: 'resolved', required: true },
          { type: 'datetime', key: 'createdAt', required: false }
        ]
      },
      {
        key: 'APPWRITE_THERAPIST_LINKS_TABLE_ID',
        name: 'Therapist Links',
        id: 'therapist_links',
        columns: [
          { type: 'string', key: 'therapistId', size: 50, required: true },
          { type: 'string', key: 'userId', size: 50, required: true },
          { type: 'string', key: 'status', size: 50, required: true },
          { type: 'datetime', key: 'createdAt', required: false }
        ]
      }
    ];

    // Clean up existing tables to avoid partial setup conflicts
    console.log('\nCleaning up existing tables for a fresh setup...');
    for (const tbl of tables) {
      try {
        await tablesDB.deleteTable({ databaseId, tableId: tbl.id });
        console.log(`  - Deleted existing table "${tbl.name}" (${tbl.id})`);
      } catch (e) {
        console.log(`  - Did not delete table "${tbl.name}" (${tbl.id}): ${e.message}`);
      }
    }

    console.log('Waiting 5 seconds for Appwrite server to process deletions...');
    await sleep(5000);

    const results = {};

    for (const tbl of tables) {
      let tableId = tbl.id;
      console.log(`\n--------------------------------------------`);
      console.log(`Creating table "${tbl.name}" (${tableId})...`);
      
      await tablesDB.createTable({ databaseId, tableId, name: tbl.name });
      console.log(`Table "${tbl.name}" created successfully!`);

      results[tbl.key] = tableId;

      // Create columns
      console.log(`Creating columns for "${tbl.name}"...`);
      for (const col of tbl.columns) {
        try {
          if (col.type === 'string') {
            await tablesDB.createVarcharColumn({ databaseId, tableId, key: col.key, size: col.size, required: col.required });
          } else if (col.type === 'longtext') {
            await tablesDB.createLongtextColumn({ databaseId, tableId, key: col.key, required: col.required });
          } else if (col.type === 'integer') {
            await tablesDB.createIntegerColumn({ databaseId, tableId, key: col.key, required: col.required });
          } else if (col.type === 'float') {
            await tablesDB.createFloatColumn({ databaseId, tableId, key: col.key, required: col.required });
          } else if (col.type === 'boolean') {
            await tablesDB.createBooleanColumn({ databaseId, tableId, key: col.key, required: col.required });
          } else if (col.type === 'datetime') {
            await tablesDB.createDatetimeColumn({ databaseId, tableId, key: col.key, required: col.required });
          }
          console.log(`  - Column "${col.key}" queued.`);
        } catch (err) {
          console.error(`  - Failed to create column "${col.key}":`, err.message);
        }
      }
      
      // Wait for columns to complete processing
      const expectedKeys = tbl.columns.map(c => c.key);
      await waitForColumns(databaseId, tableId, expectedKeys);
    }

    console.log(`\n============================================`);
    console.log(`Database and tables successfully configured!`);
    console.log(`Updating .env file with table IDs...`);

    let newEnvContent = envContent;
    for (const [key, val] of Object.entries(results)) {
      // Replace "# KEY=" or "KEY=" with "KEY=val"
      const regex = new RegExp(`^#?\\s*${key}\\s*=.*$`, 'm');
      if (regex.test(newEnvContent)) {
        newEnvContent = newEnvContent.replace(regex, `${key}=${val}`);
      } else {
        newEnvContent += `\n${key}=${val}`;
      }
    }

    fs.writeFileSync(envPath, newEnvContent, 'utf8');
    console.log(`.env file updated successfully!`);
    console.log(`\nSetup complete! You can now run the project.`);

  } catch (error) {
    console.error('Migration failed:', error);
  }
}

run();
