import { Client, Account, Databases, Users } from 'node-appwrite';
import { cookies } from 'next/headers';

// Admin Client (for backend queries and database modifications)
export async function createAdminClient() {
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
    .setProject(process.env.APPWRITE_PROJECT_ID || '')
    .setKey(process.env.APPWRITE_API_KEY || '');

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
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
    .setProject(process.env.APPWRITE_PROJECT_ID || '');

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

// Helper to get currently logged in user
export async function getSessionUser() {
  const sessionClient = await createSessionClient();
  if (!sessionClient) return null;
  try {
    const user = await sessionClient.account.get();
    return { id: user.$id, email: user.email };
  } catch (e) {
    return null;
  }
}
