import { db, getMockData, writeMockData } from './index';
import * as schema from './schema';
import { eq, desc, and, gte } from 'drizzle-orm';
// Custom UUID generator to avoid package dependencies
const uuidv4 = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

// Helper to standardise Dates from JSON
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

// ----------------------------------------------------
// User Queries & Mutations
// ----------------------------------------------------
export async function getUser(id: string): Promise<User | null> {
  if (db) {
    const results = await db.select().from(schema.users).where(eq(schema.users.id, id)).limit(1);
    return results[0] || null;
  } else {
    const data = getMockData();
    const user = data.users.find((u: any) => u.id === id);
    if (!user) return null;
    return { ...user, createdAt: parseDate(user.createdAt) };
  }
}

export async function getUserByEmail(email: string): Promise<User | null> {
  if (db) {
    const results = await db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1);
    return results[0] || null;
  } else {
    const data = getMockData();
    const user = data.users.find((u: any) => u.email.toLowerCase() === email.toLowerCase());
    if (!user) return null;
    return { ...user, createdAt: parseDate(user.createdAt) };
  }
}

export async function createUser(id: string, email: string, name: string | null, role = 'patient'): Promise<User> {
  const newUser = {
    id,
    email,
    name,
    role,
    therapistId: null,
    timezone: 'UTC',
    clinicalNotes: null,
    createdAt: new Date(),
  };

  if (db) {
    await db.insert(schema.users).values(newUser);
    return newUser;
  } else {
    const data = getMockData();
    data.users.push({ ...newUser, createdAt: newUser.createdAt.toISOString() });
    writeMockData(data);
    return newUser;
  }
}

export async function updateUser(id: string, updates: Partial<Omit<User, 'id' | 'createdAt'>>): Promise<User> {
  if (db) {
    const results = await db.update(schema.users).set(updates).where(eq(schema.users.id, id)).returning();
    return results[0];
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
  if (db) {
    let query = db.select().from(schema.moodEntries).where(eq(schema.moodEntries.userId, userId)).orderBy(desc(schema.moodEntries.createdAt));
    if (days) {
      const cutOff = new Date();
      cutOff.setDate(cutOff.getDate() - days);
      // Wait, Drizzle allows and() and gte() filters:
      return await db.select().from(schema.moodEntries)
        .where(and(eq(schema.moodEntries.userId, userId), gte(schema.moodEntries.createdAt, cutOff)))
        .orderBy(desc(schema.moodEntries.createdAt));
    }
    return await query;
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
    id: uuidv4(),
    ...entry,
    createdAt: new Date(),
  };

  if (db) {
    const results = await db.insert(schema.moodEntries).values(newEntry).returning();
    return results[0];
  } else {
    const data = getMockData();
    data.moodEntries.push({ ...newEntry, createdAt: newEntry.createdAt.toISOString() });
    writeMockData(data);
    return newEntry;
  }
}

// ----------------------------------------------------
// AI Conversations Queries & Mutations
// ----------------------------------------------------
export async function getAIConversations(userId: string): Promise<AIConversation[]> {
  if (db) {
    return await db.select().from(schema.aiConversations).where(eq(schema.aiConversations.userId, userId)).orderBy(desc(schema.aiConversations.createdAt));
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
    id: uuidv4(),
    ...conversation,
    createdAt: new Date(),
  };

  if (db) {
    const results = await db.insert(schema.aiConversations).values(newConv).returning();
    return results[0];
  } else {
    const data = getMockData();
    data.aiConversations.push({ ...newConv, createdAt: newConv.createdAt.toISOString() });
    writeMockData(data);
    return newConv;
  }
}

// ----------------------------------------------------
// Assessments Queries & Mutations
// ----------------------------------------------------
export async function getAssessments(userId: string): Promise<Assessment[]> {
  if (db) {
    return await db.select().from(schema.assessments).where(eq(schema.assessments.userId, userId)).orderBy(desc(schema.assessments.createdAt));
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
    id: uuidv4(),
    ...assessment,
    createdAt: new Date(),
  };

  if (db) {
    const results = await db.insert(schema.assessments).values(newAssessment).returning();
    return results[0];
  } else {
    const data = getMockData();
    data.assessments.push({ ...newAssessment, createdAt: newAssessment.createdAt.toISOString() });
    writeMockData(data);
    return newAssessment;
  }
}

// ----------------------------------------------------
// Insights Queries & Mutations
// ----------------------------------------------------
export async function getInsights(userId: string): Promise<Insight[]> {
  if (db) {
    return await db.select().from(schema.insights).where(eq(schema.insights.userId, userId)).orderBy(desc(schema.insights.createdAt));
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
    id: uuidv4(),
    ...insight,
    createdAt: new Date(),
  };

  if (db) {
    const results = await db.insert(schema.insights).values(newInsight).returning();
    return results[0];
  } else {
    const data = getMockData();
    data.insights.push({
      ...newInsight,
      weekStart: newInsight.weekStart.toISOString(),
      createdAt: newInsight.createdAt.toISOString(),
    });
    writeMockData(data);
    return newInsight;
  }
}

// ----------------------------------------------------
// Alerts Queries & Mutations
// ----------------------------------------------------
export async function getAlerts(therapistId: string): Promise<Alert[]> {
  if (db) {
    return await db.select().from(schema.alerts).where(eq(schema.alerts.therapistId, therapistId)).orderBy(desc(schema.alerts.createdAt));
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
    id: uuidv4(),
    ...alert,
    resolved: false,
    createdAt: new Date(),
  };

  if (db) {
    const results = await db.insert(schema.alerts).values(newAlert).returning();
    return results[0];
  } else {
    const data = getMockData();
    data.alerts.push({ ...newAlert, createdAt: newAlert.createdAt.toISOString() });
    writeMockData(data);
    return newAlert;
  }
}

export async function resolveAlert(alertId: string): Promise<Alert> {
  if (db) {
    const results = await db.update(schema.alerts).set({ resolved: true }).where(eq(schema.alerts.id, alertId)).returning();
    return results[0];
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
  if (db) {
    return await db.select().from(schema.therapistLinks).where(eq(schema.therapistLinks.therapistId, therapistId));
  } else {
    const data = getMockData();
    return data.therapistLinks
      .filter((l: any) => l.therapistId === therapistId)
      .map((l: any) => ({ ...l, createdAt: parseDate(l.createdAt) }));
  }
}

export async function createTherapistLink(therapistId: string, userId: string, status = 'pending'): Promise<TherapistLink> {
  const newLink = {
    id: uuidv4(),
    therapistId,
    userId,
    status,
    createdAt: new Date(),
  };

  if (db) {
    const results = await db.insert(schema.therapistLinks).values(newLink).returning();
    return results[0];
  } else {
    const data = getMockData();
    data.therapistLinks.push({ ...newLink, createdAt: newLink.createdAt.toISOString() });
    writeMockData(data);
    return newLink;
  }
}

export async function updateTherapistLink(linkId: string, status: string): Promise<TherapistLink> {
  if (db) {
    const results = await db.update(schema.therapistLinks).set({ status }).where(eq(schema.therapistLinks.id, linkId)).returning();
    return results[0];
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
  if (db) {
    // Return all users who have therapist_id set to this therapistId
    return await db.select().from(schema.users).where(eq(schema.users.therapistId, therapistId));
  } else {
    const data = getMockData();
    return data.users
      .filter((u: any) => u.therapistId === therapistId)
      .map((u: any) => ({ ...u, createdAt: parseDate(u.createdAt) }));
  }
}
