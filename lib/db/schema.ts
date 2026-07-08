import { pgTable, uuid, text, integer, doublePrecision, timestamp, boolean, jsonb } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: text('id').primaryKey(), // Supabase auth.users.id mapped
  email: text('email').notNull(),
  name: text('name'),
  role: text('role').default('patient').notNull(), // 'patient' | 'therapist'
  therapistId: text('therapist_id'),
  timezone: text('timezone').default('UTC'),
  clinicalNotes: text('clinical_notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const moodEntries = pgTable('mood_entries', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  moodScore: integer('mood_score').notNull(), // 1-10
  energy: integer('energy').notNull(), // 1-10
  sleepHours: doublePrecision('sleep_hours'),
  tags: jsonb('tags').$type<string[]>(),
  note: text('note'),
  source: text('source').default('manual').notNull(), // 'manual' | 'ai'
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const aiConversations = pgTable('ai_conversations', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  messages: jsonb('messages').notNull(), // json array of Message type
  extractedSignals: jsonb('extracted_signals'), // { mood, energy, sleep, anxiety, triggers: [] }
  sentimentScore: doublePrecision('sentiment_score'),
  crisisFlagged: boolean('crisis_flagged').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const assessments = pgTable('assessments', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  type: text('type').notNull(), // 'PHQ9' | 'GAD7'
  responses: jsonb('responses').notNull(), // index to score map
  score: integer('score').notNull(),
  severity: text('severity').notNull(), // 'Minimal', 'Mild', 'Moderate', etc.
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const insights = pgTable('insights', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  weekStart: timestamp('week_start').notNull(),
  summaryMd: text('summary_md').notNull(),
  trend: text('trend').notNull(), // 'improving' | 'stable' | 'declining'
  riskLevel: text('risk_level').notNull(), // 'low' | 'medium' | 'high'
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const alerts = pgTable('alerts', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  therapistId: text('therapist_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  type: text('type').notNull(), // 'crisis' | 'mood_drop' | 'assessment_severe'
  severity: text('severity').notNull(), // 'info' | 'warning' | 'critical'
  message: text('message').notNull(),
  resolved: boolean('resolved').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const therapistLinks = pgTable('therapist_links', {
  id: uuid('id').defaultRandom().primaryKey(),
  therapistId: text('therapist_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  status: text('status').default('pending').notNull(), // 'pending' | 'active'
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
