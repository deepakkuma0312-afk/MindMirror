import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { format } from 'date-fns';
import { formatClinicalNote } from '@/lib/utils/encryption';

// Create styles for clinical PDF
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#333333',
    lineHeight: 1.5,
  },
  header: {
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
    paddingBottom: 15,
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontFamily: 'Helvetica-Bold',
    color: '#466b57', // Sage Green primary color
  },
  subtitle: {
    fontSize: 9,
    color: '#888888',
    marginTop: 4,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: '#222222',
    borderBottomWidth: 0.5,
    borderBottomColor: '#cccccc',
    paddingBottom: 4,
    marginBottom: 8,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  gridCol: {
    width: '50%',
    paddingRight: 10,
    marginBottom: 8,
  },
  bold: {
    fontFamily: 'Helvetica-Bold',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: '#f0f0f0',
    paddingVertical: 5,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#dddddd',
    paddingVertical: 5,
    fontFamily: 'Helvetica-Bold',
    backgroundColor: '#f9f9f9',
  },
  col1: { width: '25%' },
  col2: { width: '15%' },
  col3: { width: '15%' },
  col4: { width: '45%' },
});

interface ReportDocumentProps {
  patient: any;
  moodEntries: any[];
  assessments: any[];
  insights: any[];
}

export default function ReportDocument({ patient, moodEntries, assessments, insights }: ReportDocumentProps) {
  const latestInsight = insights[0] || null;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>MindMirror Clinical Report</Text>
          <Text style={styles.subtitle}>Generated on {format(new Date(), 'MMMM dd, yyyy')}</Text>
        </View>

        {/* Patient Profile */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Patient Profile</Text>
          <View style={styles.grid}>
            <View style={styles.gridCol}>
              <Text><Text style={styles.bold}>Name:</Text> {patient.name || 'N/A'}</Text>
            </View>
            <View style={styles.gridCol}>
              <Text><Text style={styles.bold}>Email:</Text> {patient.email}</Text>
            </View>
            <View style={styles.gridCol}>
              <Text><Text style={styles.bold}>Baseline Drift Risk:</Text> {latestInsight?.riskLevel?.toUpperCase() || 'LOW'}</Text>
            </View>
            <View style={styles.gridCol}>
              <Text><Text style={styles.bold}>Total Entries:</Text> {moodEntries.length}</Text>
            </View>
          </View>
        </View>

        {/* Weekly Insights */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Latest Weekly Clinical Summary</Text>
          {latestInsight ? (
            <Text style={{ fontStyle: 'italic', color: '#555555' }}>
              "{latestInsight.summaryMd}"
            </Text>
          ) : (
            <Text style={{ color: '#888888' }}>No aggregate insights generated for this patient yet.</Text>
          )}
        </View>

        {/* Mood Entries Table */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Mood Logs</Text>
          <View style={styles.tableHeader}>
            <Text style={styles.col1}>Date</Text>
            <Text style={styles.col2}>Mood (1-10)</Text>
            <Text style={styles.col3}>Energy (1-10)</Text>
            <Text style={styles.col4}>Reflection / Note Summary</Text>
          </View>
          {moodEntries.slice(0, 10).map((entry: any, index: number) => (
            <View key={index} style={styles.tableRow}>
              <Text style={styles.col1}>{format(new Date(entry.createdAt), 'MMM dd, yyyy')}</Text>
              <Text style={styles.col2}>{entry.moodScore}/10</Text>
              <Text style={styles.col3}>{entry.energy}/10</Text>
              <Text style={styles.col4}>{formatClinicalNote(entry.note)}</Text>
            </View>
          ))}
        </View>

        {/* Clinical Screenings (PHQ9/GAD7) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Standardized Assessment History (GAD-7 / PHQ-9)</Text>
          <View style={styles.tableHeader}>
            <Text style={styles.col1}>Date</Text>
            <Text style={styles.col2}>Type</Text>
            <Text style={styles.col3}>Score</Text>
            <Text style={styles.col4}>Severity</Text>
          </View>
          {assessments.slice(0, 10).map((a: any, index: number) => (
            <View key={index} style={styles.tableRow}>
              <Text style={styles.col1}>{format(new Date(a.createdAt), 'MMM dd, yyyy')}</Text>
              <Text style={styles.col2}>{a.type}</Text>
              <Text style={styles.col3}>{a.score} pts</Text>
              <Text style={styles.col4}>{a.severity}</Text>
            </View>
          ))}
        </View>
      </Page>
    </Document>
  );
}
