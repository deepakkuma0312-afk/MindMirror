import { db, getMockData, writeMockData } from '../lib/db/index';
import * as schema from '../lib/db/schema';
import { subDays, addDays } from 'date-fns';

async function seed() {
  console.log('🌱 Starting database seeding...');

  const therapistId = 'therapist_sharma';
  const patientId = 'patient_priya';

  const therapistUser = {
    id: therapistId,
    email: 'sharma@example.com',
    name: 'Dr. Sharma',
    role: 'therapist',
    therapistId: null,
    timezone: 'UTC',
    createdAt: subDays(new Date(), 32),
  };

  const patientUser = {
    id: patientId,
    email: 'priya@example.com',
    name: 'Priya Sharma',
    role: 'patient',
    therapistId: therapistId,
    timezone: 'UTC',
    createdAt: subDays(new Date(), 31),
  };

  // 1. Generate 30 days of mood logs (burnout dip + recovery)
  const moodEntries = [];
  const startDay = subDays(new Date(), 30);

  for (let i = 0; i <= 30; i++) {
    const entryDate = addDays(startDay, i);
    let moodScore = 7;
    let energy = 7;
    let sleepHours = 7.5;
    let tags = ['exercise', 'family'];
    let note = 'Had a good day, got some fresh air.';
    let source = 'manual';

    if (i >= 10 && i < 20) {
      // Burnout phase mid-month
      moodScore = Math.floor(Math.random() * 3) + 3; // 3-5
      energy = Math.floor(Math.random() * 3) + 2; // 2-4
      sleepHours = Math.floor(Math.random() * 2) + 5; // 5-6
      tags = ['work', 'stress', 'tired'];
      note = 'Feeling extremely overwhelmed with work deadlines. Sleep was interrupted and energy is low.';
      source = 'ai';
    } else if (i >= 20) {
      // Recovery phase
      moodScore = Math.floor(Math.random() * 3) + 7; // 7-9
      energy = Math.floor(Math.random() * 3) + 6; // 6-8
      sleepHours = Math.floor(Math.random() * 2) + 7.5; // 7.5-8.5
      tags = ['mindfulness', 'relationship', 'exercise'];
      note = 'Feeling much better. Inserted breaks at work and slept well.';
      source = 'manual';
    }

    moodEntries.push({
      id: `mood_${i}`,
      userId: patientId,
      moodScore,
      energy,
      sleepHours,
      tags,
      note,
      source,
      createdAt: entryDate,
    });
  }

  // 2. Weekly assessments (moderate -> mild/minimal severity)
  const assessments = [
    {
      id: 'asmt_1',
      userId: patientId,
      type: 'GAD7',
      responses: { 0: 2, 1: 2, 2: 1, 3: 2, 4: 1, 5: 2, 6: 2 }, // score 12
      score: 12,
      severity: 'Moderate',
      createdAt: subDays(new Date(), 24),
    },
    {
      id: 'asmt_2',
      userId: patientId,
      type: 'PHQ9',
      responses: { 0: 3, 1: 2, 2: 3, 3: 2, 4: 2, 5: 1, 6: 2, 7: 1, 8: 0 }, // score 16
      score: 16,
      severity: 'Moderately Severe',
      createdAt: subDays(new Date(), 17),
    },
    {
      id: 'asmt_3',
      userId: patientId,
      type: 'GAD7',
      responses: { 0: 1, 1: 1, 2: 1, 3: 1, 4: 1, 5: 1, 6: 1 }, // score 7
      score: 7,
      severity: 'Mild',
      createdAt: subDays(new Date(), 10),
    },
    {
      id: 'asmt_4',
      userId: patientId,
      type: 'PHQ9',
      responses: { 0: 1, 1: 0, 2: 1, 3: 1, 4: 0, 5: 0, 6: 1, 7: 0, 8: 0 }, // score 4
      score: 4,
      severity: 'Minimal',
      createdAt: subDays(new Date(), 3),
    },
  ];

  // 3. AI conversations
  const aiConversations = [
    {
      id: 'conv_1',
      userId: patientId,
      messages: [
        { role: 'user', content: 'I feel very stressed about my upcoming project delivery' },
        { role: 'assistant', content: "I'm sorry to hear that. Project stress can be really heavy. How did you sleep last night?" },
        { role: 'user', content: 'Only 5 hours. Woke up in the middle of the night thinking about slides.' },
        { role: 'assistant', content: "That sounds exhausting. Let's make sure we log this trigger so you can inspect your sleep hygiene." },
      ],
      extractedSignals: { mood: 4, energy: 3, sleep_hours: 5, anxiety: 8, tags: ['work', 'sleep'] },
      sentimentScore: 0.4,
      crisisFlagged: false,
      createdAt: subDays(new Date(), 14),
    },
    {
      id: 'conv_2',
      userId: patientId,
      messages: [
        { role: 'user', content: 'Today was much better, spent time walking in the park' },
        { role: 'assistant', content: 'That sounds beautiful! Nature is a great way to ground yourself. How are you feeling physically?' },
        { role: 'user', content: 'Highly energized and clear-headed.' },
      ],
      extractedSignals: { mood: 9, energy: 8, sleep_hours: 8, anxiety: 1, tags: ['nature', 'exercise'] },
      sentimentScore: 0.9,
      crisisFlagged: false,
      createdAt: subDays(new Date(), 2),
    },
  ];

  // 4. Sample Alerts
  const alerts = [
    {
      id: 'alert_1',
      userId: patientId,
      therapistId: therapistId,
      type: 'assessment_severe',
      severity: 'warning',
      message: 'Priya Sharma scored "Moderately Severe" (16 points) on their Weekly Mood Screen (PHQ-9).',
      resolved: false,
      createdAt: subDays(new Date(), 17),
    },
  ];

  // 5. Weekly Insights
  const insights = [
    {
      id: 'insight_1',
      userId: patientId,
      weekStart: subDays(new Date(), 7),
      summaryMd: 'Your logs show a significant improvement in sleep hours and mood over the last week. The mid-month work-related anxiety has declined following daily breathing exercises. Keep protecting your rest limits. 🌱',
      trend: 'improving',
      riskLevel: 'low',
      createdAt: subDays(new Date(), 2),
    },
  ];

  // 6. Therapist Link
  const therapistLinks = [
    {
      id: 'link_1',
      therapistId: therapistId,
      userId: patientId,
      status: 'active',
      createdAt: subDays(new Date(), 32),
    },
  ];

  // WRITE DATA
  if (db) {
    try {
      console.log('Seeding Supabase via Drizzle...');
      // Clean existing records if any
      await db.delete(schema.therapistLinks);
      await db.delete(schema.alerts);
      await db.delete(schema.insights);
      await db.delete(schema.aiConversations);
      await db.delete(schema.assessments);
      await db.delete(schema.moodEntries);
      await db.delete(schema.users);

      await db.insert(schema.users).values([therapistUser, patientUser]);
      await db.insert(schema.moodEntries).values(moodEntries);
      await db.insert(schema.assessments).values(assessments);
      await db.insert(schema.aiConversations).values(aiConversations);
      await db.insert(schema.alerts).values(alerts);
      await db.insert(schema.insights).values(insights);
      await db.insert(schema.therapistLinks).values(therapistLinks);

      console.log('✅ Seeding completed on live Postgres DB!');
    } catch (e) {
      console.error('Failed live seeding, defaulting to file writing:', e);
    }
  } else {
    console.log('Seeding local mock JSON file database...');
    const data = {
      users: [therapistUser, patientUser],
      moodEntries,
      assessments,
      aiConversations,
      alerts,
      insights,
      therapistLinks,
    };
    writeMockData(data);
    console.log('✅ Seeding completed inside data/mock_db.json!');
  }
}

// Execute
seed().catch((err) => {
  console.error('Seeding script failed:', err);
});
