import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import fs from 'fs';
import path from 'path';

const connectionString = process.env.DATABASE_URL;

// Drizzle PG Client setup
export const client = connectionString ? postgres(connectionString, { max: 1 }) : null;
export const db = client ? drizzle(client, { schema }) : null;

// JSON File database fallback logic
const MOCK_DB_PATH = path.join(process.cwd(), 'data', 'mock_db.json');

function ensureMockDb() {
  const dir = path.dirname(MOCK_DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(MOCK_DB_PATH)) {
    fs.writeFileSync(
      MOCK_DB_PATH,
      JSON.stringify(
        {
          users: [],
          moodEntries: [],
          aiConversations: [],
          assessments: [],
          insights: [],
          alerts: [],
          therapistLinks: [],
        },
        null,
        2
      )
    );
  }
}

export function getMockData() {
  ensureMockDb();
  try {
    const content = fs.readFileSync(MOCK_DB_PATH, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error('Error reading mock database:', error);
    return {
      users: [],
      moodEntries: [],
      aiConversations: [],
      assessments: [],
      insights: [],
      alerts: [],
      therapistLinks: [],
    };
  }
}

export function writeMockData(data: any) {
  ensureMockDb();
  try {
    fs.writeFileSync(MOCK_DB_PATH, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error writing to mock database:', error);
  }
}
