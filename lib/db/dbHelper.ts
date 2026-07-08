import { getMockData, writeMockData } from './index';
import { Client, TablesDB, Query } from 'node-appwrite';

// Custom UUID generator to avoid package dependencies
const uuidv4 = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

// Helper to standardise Dates from JSON / Database
const parseDate = (val: any) => (val ? new Date(val) : new Date());

// Type interfaces for exports
export interface User {
  id: string;
  email: string;
  name: string | null;
  role: string;
  therapistId: string | null;
  timezone: string | null;
  clinicalNotes?: string | null;
  createdAt: Date;
}

export interface MoodEntry {
  id: string;
  userId: string;
  moodScore: number;
  energy: number;
  sleepHours: number | null;
  tags: string[] | null;
  note: string | null;
  source: string;
  createdAt: Date;
}

export interface AIConversation {
  id: string;
  userId: string;
  messages: any;
  extractedSignals: any | null;
  sentimentScore: number | null;
  crisisFlagged: boolean;
  createdAt: Date;
}

export interface Assessment {
  id: string;
  userId: string;
  type: string;
  responses: any;
  score: number;
  severity: string;
  createdAt: Date;
}

export interface Insight {
  id: string;
  userId: string;
  weekStart: Date;
  summaryMd: string;
  trend: string;
  riskLevel: string;
  createdAt: Date;
}

export interface Alert {
  id: string;
  userId: string;
  therapistId: string;
  type: string;
  severity: string;
  message: string;
  resolved: boolean;
  createdAt: Date;
}

export interface TherapistLink {
  id: string;
  therapistId: string;
  userId: string;
  status: string;
  createdAt: Date;
}

// Appwrite Configuration
const isAppwriteConfigured = !!(
  process.env.APPWRITE_ENDPOINT &&
  process.env.APPWRITE_PROJECT_ID &&
  process.env.APPWRITE_DATABASE_ID &&
  process.env.APPWRITE_API_KEY &&
  process.env.APPWRITE_USERS_TABLE_ID
);

let appwriteTables: TablesDB | null = null;

if (isAppwriteConfigured) {
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT!)
    .setProject(process.env.APPWRITE_PROJECT_ID!)
    .setKey(process.env.APPWRITE_API_KEY!);
  appwriteTables = new TablesDB(client);
}

const databaseId = process.env.APPWRITE_DATABASE_ID || '';
const usersTableId = process.env.APPWRITE_USERS_TABLE_ID || '';
const moodEntriesTableId = process.env.APPWRITE_MOOD_ENTRIES_TABLE_ID || '';
const aiConversationsTableId = process.env.APPWRITE_AI_CONVERSATIONS_TABLE_ID || '';
const assessmentsTableId = process.env.APPWRITE_ASSESSMENTS_TABLE_ID || '';
const insightsTableId = process.env.APPWRITE_INSIGHTS_TABLE_ID || '';
const alertsTableId = process.env.APPWRITE_ALERTS_TABLE_ID || '';
const therapistLinksTableId = process.env.APPWRITE_THERAPIST_LINKS_TABLE_ID || '';

// Appwrite mapper helpers
const mapUserDoc = (doc: any): User => ({
  id: doc.$id,
  email: doc.email,
  name: doc.name || null,
  role: doc.role,
  therapistId: doc.therapistId || null,
  timezone: doc.timezone || 'UTC',
  clinicalNotes: doc.clinicalNotes || null,
  createdAt: parseDate(doc.createdAt || doc.$createdAt),
});

const mapMoodDoc = (doc: any): MoodEntry => ({
  id: doc.$id,
  userId: doc.userId,
  moodScore: doc.moodScore,
  energy: doc.energy,
  sleepHours: doc.sleepHours !== undefined ? doc.sleepHours : null,
  tags: typeof doc.tags === 'string' ? JSON.parse(doc.tags) : doc.tags || null,
  note: doc.note || null,
  source: doc.source || 'manual',
  createdAt: parseDate(doc.createdAt || doc.$createdAt),
});

const mapAIDoc = (doc: any): AIConversation => ({
  id: doc.$id,
  userId: doc.userId,
  messages: typeof doc.messages === 'string' ? JSON.parse(doc.messages) : doc.messages,
  extractedSignals: typeof doc.extractedSignals === 'string' ? JSON.parse(doc.extractedSignals) : doc.extractedSignals || null,
  sentimentScore: doc.sentimentScore !== undefined ? doc.sentimentScore : null,
  crisisFlagged: !!doc.crisisFlagged,
  createdAt: parseDate(doc.createdAt || doc.$createdAt),
});

const mapAssessmentDoc = (doc: any): Assessment => ({
  id: doc.$id,
  userId: doc.userId,
  type: doc.type,
  responses: typeof doc.responses === 'string' ? JSON.parse(doc.responses) : doc.responses,
  score: doc.score,
  severity: doc.severity,
  createdAt: parseDate(doc.createdAt || doc.$createdAt),
});

const mapInsightDoc = (doc: any): Insight => ({
  id: doc.$id,
  userId: doc.userId,
  weekStart: parseDate(doc.weekStart),
  summaryMd: doc.summaryMd,
  trend: doc.trend,
  riskLevel: doc.riskLevel,
  createdAt: parseDate(doc.createdAt || doc.$createdAt),
});

const mapAlertDoc = (doc: any): Alert => ({
  id: doc.$id,
  userId: doc.userId,
  therapistId: doc.therapistId,
  type: doc.type,
  severity: doc.severity,
  message: doc.message,
  resolved: !!doc.resolved,
  createdAt: parseDate(doc.createdAt || doc.$createdAt),
});

const mapLinkDoc = (doc: any): TherapistLink => ({
  id: doc.$id,
  therapistId: doc.therapistId,
  userId: doc.userId,
  status: doc.status,
  createdAt: parseDate(doc.createdAt || doc.$createdAt),
});

// ----------------------------------------------------
// User Queries & Mutations
// ----------------------------------------------------
export async function getUser(id: string): Promise<User | null> {
  if (appwriteTables) {
    try {
      const doc = await appwriteTables.getRow({ databaseId, tableId: usersTableId, rowId: id });
      return mapUserDoc(doc);
    } catch (err) {
      return null;
    }
  } else {
    const data = getMockData();
    const user = data.users.find((u: any) => u.id === id);
    if (!user) return null;
    return { ...user, createdAt: parseDate(user.createdAt) };
  }
}

export async function getUserByEmail(email: string): Promise<User | null> {
  if (appwriteTables) {
    try {
      const list = await appwriteTables.listRows({
        databaseId,
        tableId: usersTableId,
        queries: [
          Query.equal('email', email.toLowerCase()),
          Query.limit(1),
        ],
      });
      return list.rows[0] ? mapUserDoc(list.rows[0]) : null;
    } catch (err) {
      return null;
    }
  } else {
    const data = getMockData();
    const user = data.users.find((u: any) => u.email.toLowerCase() === email.toLowerCase());
    if (!user) return null;
    return { ...user, createdAt: parseDate(user.createdAt) };
  }
}

export async function createUser(id: string, email: string, name: string | null, role = 'patient'): Promise<User> {
  const newUser = {
    email,
    name,
    role,
    therapistId: null,
    timezone: 'UTC',
    clinicalNotes: null,
    createdAt: new Date().toISOString(),
  };

  if (appwriteTables) {
    const doc = await appwriteTables.createRow({ databaseId, tableId: usersTableId, rowId: id, data: newUser });
    return mapUserDoc(doc);
  } else {
    const data = getMockData();
    data.users.push({ id, ...newUser });
    writeMockData(data);
    return { id, ...newUser, createdAt: parseDate(newUser.createdAt) };
  }
}

export async function updateUser(id: string, updates: Partial<Omit<User, 'id' | 'createdAt'>>): Promise<User> {
  if (appwriteTables) {
    const cleanUpdates = { ...updates } as any;
    const doc = await appwriteTables.updateRow({ databaseId, tableId: usersTableId, rowId: id, data: cleanUpdates });
    return mapUserDoc(doc);
  } else {
    const data = getMockData();
    const index = data.users.findIndex((u: any) => u.id === id);
    if (index === -1) throw new Error('User not found');
    const updated = { ...data.users[index], ...updates };
    data.users[index] = updated;
    writeMockData(data);
    return { ...updated, createdAt: parseDate(updated.createdAt) };
  }
}

// ----------------------------------------------------
// Mood Entries Queries & Mutations
// ----------------------------------------------------
export async function getMoodEntries(userId: string, days?: number): Promise<MoodEntry[]> {
  if (appwriteTables) {
    try {
      const queries = [Query.equal('userId', userId), Query.orderDesc('createdAt')];
      if (days) {
        const cutOff = new Date();
        cutOff.setDate(cutOff.getDate() - days);
        queries.push(Query.greaterThanEqual('createdAt', cutOff.toISOString()));
      }
      const list = await appwriteTables.listRows({ databaseId, tableId: moodEntriesTableId, queries });
      return list.rows.map(mapMoodDoc);
    } catch (err) {
      console.error('Appwrite mood entries fetch failed:', err);
      return [];
    }
  } else {
    const data = getMockData();
    let entries = data.moodEntries
      .filter((m: any) => m.userId === userId)
      .map((m: any) => ({ ...m, createdAt: parseDate(m.createdAt) }));
    if (days) {
      const cutOff = new Date();
      cutOff.setDate(cutOff.getDate() - days);
      entries = entries.filter((m: any) => m.createdAt >= cutOff);
    }
    return entries.sort((a: any, b: any) => b.createdAt.getTime() - a.createdAt.getTime());
  }
}

export async function addMoodEntry(entry: Omit<MoodEntry, 'id' | 'createdAt'>): Promise<MoodEntry> {
  const newEntry = {
    userId: entry.userId,
    moodScore: entry.moodScore,
    energy: entry.energy,
    sleepHours: entry.sleepHours,
    tags: entry.tags ? JSON.stringify(entry.tags) : null,
    note: entry.note,
    source: entry.source,
    createdAt: new Date().toISOString(),
  };

  if (appwriteTables) {
    const doc = await appwriteTables.createRow({ databaseId, tableId: moodEntriesTableId, rowId: uuidv4(), data: newEntry });
    return mapMoodDoc(doc);
  } else {
    const data = getMockData();
    const rawMockEntry = {
      id: uuidv4(),
      ...entry,
      createdAt: newEntry.createdAt,
    };
    data.moodEntries.push(rawMockEntry);
    writeMockData(data);
    return { ...rawMockEntry, createdAt: parseDate(rawMockEntry.createdAt) };
  }
}

// ----------------------------------------------------
// AI Conversations Queries & Mutations
// ----------------------------------------------------
export async function getAIConversations(userId: string): Promise<AIConversation[]> {
  if (appwriteTables) {
    try {
      const list = await appwriteTables.listRows({
        databaseId,
        tableId: aiConversationsTableId,
        queries: [
          Query.equal('userId', userId),
          Query.orderDesc('createdAt'),
        ],
      });
      return list.rows.map(mapAIDoc);
    } catch (err) {
      console.error('Appwrite conversations fetch failed:', err);
      return [];
    }
  } else {
    const data = getMockData();
    return data.aiConversations
      .filter((c: any) => c.userId === userId)
      .map((c: any) => ({ ...c, createdAt: parseDate(c.createdAt) }))
      .sort((a: any, b: any) => b.createdAt.getTime() - a.createdAt.getTime());
  }
}

export async function addAIConversation(conversation: Omit<AIConversation, 'id' | 'createdAt'>): Promise<AIConversation> {
  const newConv = {
    userId: conversation.userId,
    messages: typeof conversation.messages === 'string' ? conversation.messages : JSON.stringify(conversation.messages),
    extractedSignals: conversation.extractedSignals ? (typeof conversation.extractedSignals === 'string' ? conversation.extractedSignals : JSON.stringify(conversation.extractedSignals)) : null,
    sentimentScore: conversation.sentimentScore,
    crisisFlagged: !!conversation.crisisFlagged,
    createdAt: new Date().toISOString(),
  };

  if (appwriteTables) {
    const doc = await appwriteTables.createRow({ databaseId, tableId: aiConversationsTableId, rowId: uuidv4(), data: newConv });
    return mapAIDoc(doc);
  } else {
    const data = getMockData();
    const rawMockConv = {
      id: uuidv4(),
      ...conversation,
      createdAt: newConv.createdAt,
    };
    data.aiConversations.push(rawMockConv);
    writeMockData(data);
    return { ...rawMockConv, createdAt: parseDate(rawMockConv.createdAt) };
  }
}

// ----------------------------------------------------
// Assessments Queries & Mutations
// ----------------------------------------------------
export async function getAssessments(userId: string): Promise<Assessment[]> {
  if (appwriteTables) {
    try {
      const list = await appwriteTables.listRows({
        databaseId,
        tableId: assessmentsTableId,
        queries: [
          Query.equal('userId', userId),
          Query.orderDesc('createdAt'),
        ],
      });
      return list.rows.map(mapAssessmentDoc);
    } catch (err) {
      console.error('Appwrite assessments fetch failed:', err);
      return [];
    }
  } else {
    const data = getMockData();
    return data.assessments
      .filter((a: any) => a.userId === userId)
      .map((a: any) => ({ ...a, createdAt: parseDate(a.createdAt) }))
      .sort((a: any, b: any) => b.createdAt.getTime() - a.createdAt.getTime());
  }
}

export async function addAssessment(assessment: Omit<Assessment, 'id' | 'createdAt'>): Promise<Assessment> {
  const newAssessment = {
    userId: assessment.userId,
    type: assessment.type,
    responses: typeof assessment.responses === 'string' ? assessment.responses : JSON.stringify(assessment.responses),
    score: assessment.score,
    severity: assessment.severity,
    createdAt: new Date().toISOString(),
  };

  if (appwriteTables) {
    const doc = await appwriteTables.createRow({ databaseId, tableId: assessmentsTableId, rowId: uuidv4(), data: newAssessment });
    return mapAssessmentDoc(doc);
  } else {
    const data = getMockData();
    const rawMockAss = {
      id: uuidv4(),
      ...assessment,
      createdAt: newAssessment.createdAt,
    };
    data.assessments.push(rawMockAss);
    writeMockData(data);
    return { ...rawMockAss, createdAt: parseDate(rawMockAss.createdAt) };
  }
}

// ----------------------------------------------------
// Insights Queries & Mutations
// ----------------------------------------------------
export async function getInsights(userId: string): Promise<Insight[]> {
  if (appwriteTables) {
    try {
      const list = await appwriteTables.listRows({
        databaseId,
        tableId: insightsTableId,
        queries: [
          Query.equal('userId', userId),
          Query.orderDesc('createdAt'),
        ],
      });
      return list.rows.map(mapInsightDoc);
    } catch (err) {
      console.error('Appwrite insights fetch failed:', err);
      return [];
    }
  } else {
    const data = getMockData();
    return data.insights
      .filter((i: any) => i.userId === userId)
      .map((i: any) => ({ ...i, weekStart: parseDate(i.weekStart), createdAt: parseDate(i.createdAt) }))
      .sort((a: any, b: any) => b.createdAt.getTime() - a.createdAt.getTime());
  }
}

export async function addInsight(insight: Omit<Insight, 'id' | 'createdAt'>): Promise<Insight> {
  const newInsight = {
    userId: insight.userId,
    weekStart: insight.weekStart.toISOString(),
    summaryMd: insight.summaryMd,
    trend: insight.trend,
    riskLevel: insight.riskLevel,
    createdAt: new Date().toISOString(),
  };

  if (appwriteTables) {
    const doc = await appwriteTables.createRow({ databaseId, tableId: insightsTableId, rowId: uuidv4(), data: newInsight });
    return mapInsightDoc(doc);
  } else {
    const data = getMockData();
    const rawMockInsight = {
      id: uuidv4(),
      ...insight,
      createdAt: newInsight.createdAt,
    };
    data.insights.push(rawMockInsight);
    writeMockData(data);
    return { ...rawMockInsight, weekStart: parseDate(rawMockInsight.weekStart), createdAt: parseDate(rawMockInsight.createdAt) };
  }
}

// ----------------------------------------------------
// Alerts Queries & Mutations
// ----------------------------------------------------
export async function getAlerts(therapistId: string): Promise<Alert[]> {
  if (appwriteTables) {
    try {
      const list = await appwriteTables.listRows({
        databaseId,
        tableId: alertsTableId,
        queries: [
          Query.equal('therapistId', therapistId),
          Query.orderDesc('createdAt'),
        ],
      });
      return list.rows.map(mapAlertDoc);
    } catch (err) {
      console.error('Appwrite alerts fetch failed:', err);
      return [];
    }
  } else {
    const data = getMockData();
    return data.alerts
      .filter((a: any) => a.therapistId === therapistId)
      .map((a: any) => ({ ...a, createdAt: parseDate(a.createdAt) }))
      .sort((a: any, b: any) => b.createdAt.getTime() - a.createdAt.getTime());
  }
}

export async function addAlert(alert: Omit<Alert, 'id' | 'createdAt' | 'resolved'>): Promise<Alert> {
  const newAlert = {
    userId: alert.userId,
    therapistId: alert.therapistId,
    type: alert.type,
    severity: alert.severity,
    message: alert.message,
    resolved: false,
    createdAt: new Date().toISOString(),
  };

  if (appwriteTables) {
    const doc = await appwriteTables.createRow({ databaseId, tableId: alertsTableId, rowId: uuidv4(), data: newAlert });
    return mapAlertDoc(doc);
  } else {
    const data = getMockData();
    const rawMockAlert = {
      id: uuidv4(),
      ...alert,
      resolved: false,
      createdAt: newAlert.createdAt,
    };
    data.alerts.push(rawMockAlert);
    writeMockData(data);
    return { ...rawMockAlert, createdAt: parseDate(rawMockAlert.createdAt) };
  }
}

export async function resolveAlert(alertId: string): Promise<Alert> {
  if (appwriteTables) {
    const doc = await appwriteTables.updateRow({
      databaseId,
      tableId: alertsTableId,
      rowId: alertId,
      data: { resolved: true },
    });
    return mapAlertDoc(doc);
  } else {
    const data = getMockData();
    const index = data.alerts.findIndex((a: any) => a.id === alertId);
    if (index === -1) throw new Error('Alert not found');
    data.alerts[index].resolved = true;
    writeMockData(data);
    return { ...data.alerts[index], createdAt: parseDate(data.alerts[index].createdAt) };
  }
}

// ----------------------------------------------------
// Therapist Links Queries & Mutations
// ----------------------------------------------------
export async function getTherapistLinks(therapistId: string): Promise<TherapistLink[]> {
  if (appwriteTables) {
    try {
      const list = await appwriteTables.listRows({
        databaseId,
        tableId: therapistLinksTableId,
        queries: [
          Query.equal('therapistId', therapistId),
        ],
      });
      return list.rows.map(mapLinkDoc);
    } catch (err) {
      console.error('Appwrite therapist links fetch failed:', err);
      return [];
    }
  } else {
    const data = getMockData();
    return data.therapistLinks
      .filter((l: any) => l.therapistId === therapistId)
      .map((l: any) => ({ ...l, createdAt: parseDate(l.createdAt) }));
  }
}

export async function createTherapistLink(therapistId: string, userId: string, status = 'pending'): Promise<TherapistLink> {
  const newLink = {
    therapistId,
    userId,
    status,
    createdAt: new Date().toISOString(),
  };

  if (appwriteTables) {
    const doc = await appwriteTables.createRow({ databaseId, tableId: therapistLinksTableId, rowId: uuidv4(), data: newLink });
    return mapLinkDoc(doc);
  } else {
    const data = getMockData();
    const rawMockLink = {
      id: uuidv4(),
      ...newLink,
    };
    data.therapistLinks.push(rawMockLink);
    writeMockData(data);
    return { ...rawMockLink, createdAt: parseDate(rawMockLink.createdAt) };
  }
}

export async function updateTherapistLink(linkId: string, status: string): Promise<TherapistLink> {
  if (appwriteTables) {
    const doc = await appwriteTables.updateRow({
      databaseId,
      tableId: therapistLinksTableId,
      rowId: linkId,
      data: { status },
    });
    return mapLinkDoc(doc);
  } else {
    const data = getMockData();
    const index = data.therapistLinks.findIndex((l: any) => l.id === linkId);
    if (index === -1) throw new Error('Link not found');
    data.therapistLinks[index].status = status;
    writeMockData(data);
    return { ...data.therapistLinks[index], createdAt: parseDate(data.therapistLinks[index].createdAt) };
  }
}

// Helper to get linked patients for a therapist
export async function getLinkedPatients(therapistId: string): Promise<User[]> {
  if (appwriteTables) {
    try {
      const list = await appwriteTables.listRows({
        databaseId,
        tableId: usersTableId,
        queries: [
          Query.equal('therapistId', therapistId),
        ],
      });
      return list.rows.map(mapUserDoc);
    } catch (err) {
      console.error('Appwrite linked patients fetch failed:', err);
      return [];
    }
  } else {
    const data = getMockData();
    return data.users
      .filter((u: any) => u.therapistId === therapistId)
      .map((u: any) => ({ ...u, createdAt: parseDate(u.createdAt) }));
  }
}
