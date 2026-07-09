import { Client, Databases, Query } from 'node-appwrite';

// Custom UUID generator to avoid package dependencies
const uuidv4 = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

// Helper to standardise Dates
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

// Appwrite Databases client instantiation
const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
  .setProject(process.env.APPWRITE_PROJECT_ID || '')
  .setKey(process.env.APPWRITE_API_KEY || '');

const appwriteDatabases = new Databases(client);

const databaseId = process.env.APPWRITE_DATABASE_ID || '';
const usersCollectionId = process.env.APPWRITE_USERS_COLLECTION_ID || '';
const moodEntriesCollectionId = process.env.APPWRITE_MOOD_ENTRIES_COLLECTION_ID || '';
const aiConversationsCollectionId = process.env.APPWRITE_AI_CONVERSATIONS_COLLECTION_ID || '';
const assessmentsCollectionId = process.env.APPWRITE_ASSESSMENTS_COLLECTION_ID || '';
const insightsCollectionId = process.env.APPWRITE_INSIGHTS_COLLECTION_ID || '';
const alertsCollectionId = process.env.APPWRITE_ALERTS_COLLECTION_ID || '';
const therapistLinksCollectionId = process.env.APPWRITE_THERAPIST_LINKS_COLLECTION_ID || '';

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
  try {
    const doc = await appwriteDatabases.getDocument(databaseId, usersCollectionId, id);
    return mapUserDoc(doc);
  } catch (err) {
    return null;
  }
}

export async function getUserByEmail(email: string): Promise<User | null> {
  try {
    const list = await appwriteDatabases.listDocuments(databaseId, usersCollectionId, [
      Query.equal('email', email.toLowerCase()),
      Query.limit(1),
    ]);
    return list.documents[0] ? mapUserDoc(list.documents[0]) : null;
  } catch (err) {
    return null;
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

  const doc = await appwriteDatabases.createDocument(databaseId, usersCollectionId, id, newUser);
  return mapUserDoc(doc);
}

export async function updateUser(id: string, updates: Partial<Omit<User, 'id' | 'createdAt'>>): Promise<User> {
  const cleanUpdates = { ...updates } as any;
  const doc = await appwriteDatabases.updateDocument(databaseId, usersCollectionId, id, cleanUpdates);
  return mapUserDoc(doc);
}

// ----------------------------------------------------
// Mood Entries Queries & Mutations
// ----------------------------------------------------
export async function getMoodEntries(userId: string, days?: number): Promise<MoodEntry[]> {
  try {
    const queries = [Query.equal('userId', userId), Query.orderDesc('createdAt')];
    if (days) {
      const cutOff = new Date();
      cutOff.setDate(cutOff.getDate() - days);
      queries.push(Query.greaterThanEqual('createdAt', cutOff.toISOString()));
    }
    const list = await appwriteDatabases.listDocuments(databaseId, moodEntriesCollectionId, queries);
    return list.documents.map(mapMoodDoc);
  } catch (err) {
    console.error('Appwrite mood entries fetch failed:', err);
    return [];
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

  const doc = await appwriteDatabases.createDocument(databaseId, moodEntriesCollectionId, uuidv4(), newEntry);
  return mapMoodDoc(doc);
}

// ----------------------------------------------------
// AI Conversations Queries & Mutations
// ----------------------------------------------------
export async function getAIConversations(userId: string): Promise<AIConversation[]> {
  try {
    const list = await appwriteDatabases.listDocuments(databaseId, aiConversationsCollectionId, [
      Query.equal('userId', userId),
      Query.orderDesc('createdAt'),
    ]);
    return list.documents.map(mapAIDoc);
  } catch (err) {
    console.error('Appwrite conversations fetch failed:', err);
    return [];
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

  const doc = await appwriteDatabases.createDocument(databaseId, aiConversationsCollectionId, uuidv4(), newConv);
  return mapAIDoc(doc);
}

// ----------------------------------------------------
// Assessments Queries & Mutations
// ----------------------------------------------------
export async function getAssessments(userId: string): Promise<Assessment[]> {
  try {
    const list = await appwriteDatabases.listDocuments(databaseId, assessmentsCollectionId, [
      Query.equal('userId', userId),
      Query.orderDesc('createdAt'),
    ]);
    return list.documents.map(mapAssessmentDoc);
  } catch (err) {
    console.error('Appwrite assessments fetch failed:', err);
    return [];
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

  const doc = await appwriteDatabases.createDocument(databaseId, assessmentsCollectionId, uuidv4(), newAssessment);
  return mapAssessmentDoc(doc);
}

// ----------------------------------------------------
// Insights Queries & Mutations
// ----------------------------------------------------
export async function getInsights(userId: string): Promise<Insight[]> {
  try {
    const list = await appwriteDatabases.listDocuments(databaseId, insightsCollectionId, [
      Query.equal('userId', userId),
      Query.orderDesc('createdAt'),
    ]);
    return list.documents.map(mapInsightDoc);
  } catch (err) {
    console.error('Appwrite insights fetch failed:', err);
    return [];
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

  const doc = await appwriteDatabases.createDocument(databaseId, insightsCollectionId, uuidv4(), newInsight);
  return mapInsightDoc(doc);
}

// ----------------------------------------------------
// Alerts Queries & Mutations
// ----------------------------------------------------
export async function getAlerts(therapistId: string): Promise<Alert[]> {
  try {
    const list = await appwriteDatabases.listDocuments(databaseId, alertsCollectionId, [
      Query.equal('therapistId', therapistId),
      Query.orderDesc('createdAt'),
    ]);
    return list.documents.map(mapAlertDoc);
  } catch (err) {
    console.error('Appwrite alerts fetch failed:', err);
    return [];
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

  const doc = await appwriteDatabases.createDocument(databaseId, alertsCollectionId, uuidv4(), newAlert);
  return mapAlertDoc(doc);
}

export async function resolveAlert(alertId: string): Promise<Alert> {
  const doc = await appwriteDatabases.updateDocument(databaseId, alertsCollectionId, alertId, {
    resolved: true,
  });
  return mapAlertDoc(doc);
}

// ----------------------------------------------------
// Therapist Links Queries & Mutations
// ----------------------------------------------------
export async function getTherapistLinks(therapistId: string): Promise<TherapistLink[]> {
  try {
    const list = await appwriteDatabases.listDocuments(databaseId, therapistLinksCollectionId, [
      Query.equal('therapistId', therapistId),
    ]);
    return list.documents.map(mapLinkDoc);
  } catch (err) {
    console.error('Appwrite therapist links fetch failed:', err);
    return [];
  }
}

export async function createTherapistLink(therapistId: string, userId: string, status = 'pending'): Promise<TherapistLink> {
  const newLink = {
    therapistId,
    userId,
    status,
    createdAt: new Date().toISOString(),
  };

  const doc = await appwriteDatabases.createDocument(databaseId, therapistLinksCollectionId, uuidv4(), newLink);
  return mapLinkDoc(doc);
}

export async function updateTherapistLink(linkId: string, status: string): Promise<TherapistLink> {
  const doc = await appwriteDatabases.updateDocument(databaseId, therapistLinksCollectionId, linkId, {
    status,
  });
  return mapLinkDoc(doc);
}

// Helper to get linked patients for a therapist
export async function getLinkedPatients(therapistId: string): Promise<User[]> {
  try {
    const list = await appwriteDatabases.listDocuments(databaseId, usersCollectionId, [
      Query.equal('therapistId', therapistId),
    ]);
    return list.documents.map(mapUserDoc);
  } catch (err) {
    console.error('Appwrite linked patients fetch failed:', err);
    return [];
  }
}
