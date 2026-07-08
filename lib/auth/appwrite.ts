import { Client, Account, Databases, Users } from 'node-appwrite';
import { cookies } from 'next/headers';

export const isAppwriteConfigured = !!(
  process.env.APPWRITE_ENDPOINT &&
  process.env.APPWRITE_PROJECT_ID &&
  process.env.APPWRITE_DATABASE_ID &&
  process.env.APPWRITE_API_KEY &&
  process.env.APPWRITE_USERS_TABLE_ID
);

// Admin Client (for backend queries and database modifications)
export async function createAdminClient() {
  if (!isAppwriteConfigured) return null;

  const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT!)
    .setProject(process.env.APPWRITE_PROJECT_ID!)
    .setKey(process.env.APPWRITE_API_KEY!);

  return {
    get account() {
      return new Account(client);
    },
    get databases() {
      return new Databases(client);
    },
    get users() {
      return new Users(client);
    },
  };
}

// Session Client (for requests authenticated as the logged-in user)
export async function createSessionClient() {
  if (!isAppwriteConfigured) return null;

  const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT!)
    .setProject(process.env.APPWRITE_PROJECT_ID!);

  const cookieStore = await cookies();
  const session = cookieStore.get('appwrite-session')?.value;

  if (!session) return null;

  client.setSession(session);

  return {
    get account() {
      return new Account(client);
    },
    get databases() {
      return new Databases(client);
    },
  };
}

// Helper to get currently logged in user (works with both Appwrite and local mock)
export async function getSessionUser() {
  const cookieStore = await cookies();
  
  if (isAppwriteConfigured) {
    const sessionClient = await createSessionClient();
    if (!sessionClient) return null;
    try {
      const user = await sessionClient.account.get();
      return { id: user.$id, email: user.email };
    } catch (e) {
      return null;
    }
  } else {
    // Local cookie-based mock login
    const sessionVal = cookieStore.get('mindmirror-session')?.value;
    if (!sessionVal) return null;
    try {
      const sessionData = JSON.parse(sessionVal);
      return sessionData ? { id: sessionData.id, email: sessionData.email } : null;
    } catch (e) {
      return null;
    }
  }
}
