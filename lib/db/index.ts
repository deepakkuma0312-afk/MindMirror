import fs from 'fs';
import path from 'path';

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
    console.error('Error writing mock database:', error);
  }
}
