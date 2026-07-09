import crypto from 'crypto';

// fallback key if none is supplied in environment variables
const SECRET_KEY = process.env.ENCRYPTION_KEY || 'mindmirror-super-secret-key-32b-length-str!'; 

// Ensure key is exactly 32 bytes
const getKeyBuffer = () => {
  return Buffer.from(SECRET_KEY.padEnd(32).substring(0, 32));
};

export function encrypt(text: string): string {
  if (!text) return '';
  try {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', getKeyBuffer(), iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return `${iv.toString('hex')}:${encrypted}`;
  } catch (error) {
    console.error('Encryption failed:', error);
    return text; // Safe fallback
  }
}

export function decrypt(encryptedText: string): string {
  if (!encryptedText) return '';
  
  // A valid IV hex string for aes-256-cbc must be exactly 32 hex characters (16 bytes)
  const parts = encryptedText.split(':');
  if (parts.length !== 2 || parts[0].length !== 32 || !/^[0-9a-fA-F]+$/.test(parts[0])) {
    return encryptedText;
  }

  try {
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    const decipher = crypto.createDecipheriv('aes-256-cbc', getKeyBuffer(), iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error('Decryption failed:', error);
    return encryptedText; // Safe fallback
  }
}

export function formatClinicalNote(note?: string | null): string {
  if (!note) return '-';
  if (note.includes(':')) return '-'; // Encrypted check for clinician

  // If the note format is the old raw fallback: "Felt positive with tags [...]"
  const match = note.match(/Felt\s+(positive|challenged)\s+with\s+tags\s+\[(.*?)\]/i);
  if (match) {
    const isPositive = match[1].toLowerCase() === 'positive';
    const tagString = match[2];
    if (!tagString) {
      return isPositive ? 'Overall wellness: Positive.' : 'Areas you\'re struggling with: General Reflection';
    }

    const tags = tagString.split(',').map(t => t.trim().toLowerCase());
    const friendlyAreas = tags.map(tag => {
      if (tag === 'work') return 'Work';
      if (tag === 'sleep') return 'Sleep';
      if (tag === 'relationships') return 'Relationships';
      if (tag === 'health') return 'Physical Health';
      if (tag === 'cognitive' || tag === 'focus') return 'Focus';
      if (tag === 'anxiety') return 'Anxiety';
      if (tag === 'mood') return 'Mood';
      if (tag === 'reflection') return 'General Reflection';
      return tag.charAt(0).toUpperCase() + tag.slice(1);
    });

    return isPositive
      ? `Overall wellness: Positive. Focus areas: ${friendlyAreas.join(' • ')}`
      : `Areas you're struggling with: ${friendlyAreas.join(' • ')}`;
  }

  // Also clean up any occurrences of "cognitive" or old brackets in general notes
  let cleanNote = note;
  cleanNote = cleanNote.replace(/\bcognitive\b/gi, 'Focus');
  cleanNote = cleanNote.replace(/\btags\b/gi, 'areas');
  
  return cleanNote;
}
