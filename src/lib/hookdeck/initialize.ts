import crypto from 'crypto';
import type {
  HookdeckConnection,
  BasicAuthCredentials,
  StoredConnections
} from '../../types/hookdeck';

const HOOKDECK_API_URL = 'https://api.hookdeck.com/2025-07-01';
const HOOKDECK_API_KEY = process.env.HOOKDECK_API_KEY!;

// Simple in-memory storage for development when Vercel KV is not available
const memoryStore = new Map<string, any>();

// KV-like interface for development
const kvStore = {
  async get<T>(key: string): Promise<T | null> {
    if (process.env.KV_REST_API_URL && process.env.KV_REST_API_URL !== 'https://redis-12345.upstash.io') {
      // Use actual Vercel KV if configured
      const { kv } = await import('@vercel/kv');
      return kv.get<T>(key);
    }
    // Use in-memory store for development
    return memoryStore.get(key) || null;
  },
  
  async set(key: string, value: any): Promise<void> {
    if (process.env.KV_REST_API_URL && process.env.KV_REST_API_URL !== 'https://redis-12345.upstash.io') {
      // Use actual Vercel KV if configured
      const { kv } = await import('@vercel/kv');
      return kv.set(key, value);
    }
    // Use in-memory store for development
    memoryStore.set(key, value);
  },
  
  async del(key: string): Promise<void> {
    if (process.env.KV_REST_API_URL && process.env.KV_REST_API_URL !== 'https://redis-12345.upstash.io') {
      // Use actual Vercel KV if configured
      const { kv } = await import('@vercel/kv');
      await kv.del(key);
      return;
    }
    // Use in-memory store for development
    memoryStore.delete(key);
  }
};

/**
 * Generates secure basic auth credentials for Source A
 */
function generateBasicAuth(): BasicAuthCredentials {
  const username = 'deepqueue';
  const password = crypto.randomBytes(32).toString('base64');
  const encoded = Buffer.from(`${username}:${password}`).toString('base64');
  
  return { username, password, encoded };
}

/**
 * Creates or updates a Hookdeck connection with the specified configuration
 * Uses PUT for idempotent operations
 */
async function createHookdeckConnection(config: any): Promise<HookdeckConnection> {
  // Use PUT with the connection name for idempotent operations
  const connectionName = config.name;
  const response = await fetch(`${HOOKDECK_API_URL}/connections/${connectionName}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${HOOKDECK_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(config)
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create/update Hookdeck connection: ${error}`);
  }

  return response.json();
}

/**
 * Ensures that Hookdeck connections exist for the Deep Queue application.
 * Creates connections if they don't exist, otherwise returns existing ones.
 */
export async function ensureHookdeckConnections(): Promise<StoredConnections> {
  try {
    // Check if connections already exist in KV
    const existingConnections = await kvStore.get<StoredConnections>('hookdeck:connections');
    if (existingConnections) {
      console.log('Using existing Hookdeck connections');
      return existingConnections;
    }

    console.log('Creating new Hookdeck connections...');

    // Generate basic auth credentials for Source A
    const basicAuth = generateBasicAuth();
    await kvStore.set('hookdeck:source-auth', basicAuth);
    
    // Create openai-queue connection with basic auth on source
    console.log('Creating openai-queue connection...');
    const queueConnection = await createHookdeckConnection({
      name: 'openai-queue',
      source: {
        name: 'deepqueue-source',
        allowed_http_methods: ['POST'],
        custom_response: {
          content_type: 'application/json',
          body: '{"status":"queued"}'
        }
      },
      destination: {
        name: 'openai-api',
        url: 'https://api.openai.com/v1/deep-research',
        auth_method: {
          type: 'BEARER_TOKEN',
          config: {
            token: process.env.OPENAI_API_KEY!
          }
        }
      },
      rules: [{
        type: 'filter',
        body_json: {
          authorization: basicAuth.encoded
        }
      }]
    });

    // Create openai-webhook connection with OpenAI source type verification
    console.log('Creating openai-webhook connection...');
    const webhookConnection = await createHookdeckConnection({
      name: 'openai-webhook',
      source: {
        name: 'openai-webhook-source',
        allowed_http_methods: ['POST'],
        verification: {
          type: 'OPENAI'
        }
      },
      destination: {
        name: 'deepqueue-webhook',
        url: `${process.env.NEXTAUTH_URL}/api/webhooks/openai`,
        auth_method: {
          type: 'HOOKDECK_SIGNATURE',
          config: {
            webhook_secret_key: process.env.HOOKDECK_WEBHOOK_SECRET!
          }
        }
      }
    });

    // Store connection details in KV
    const connectionData: StoredConnections = {
      queue: {
        id: queueConnection.id,
        sourceUrl: queueConnection.source.url
      },
      webhook: {
        id: webhookConnection.id,
        sourceUrl: webhookConnection.source.url
      }
    };

    await kvStore.set('hookdeck:connections', connectionData);
    console.log('Hookdeck connections created successfully');
    
    return connectionData;
  } catch (error) {
    console.error('Error ensuring Hookdeck connections:', error);
    throw error;
  }
}

/**
 * Gets the basic auth credentials for Source A
 */
export async function getSourceAuthCredentials(): Promise<BasicAuthCredentials | null> {
  return kvStore.get<BasicAuthCredentials>('hookdeck:source-auth');
}

/**
 * Gets the stored Hookdeck connections
 */
export async function getHookdeckConnections(): Promise<StoredConnections | null> {
  return kvStore.get<StoredConnections>('hookdeck:connections');
}

/**
 * Clears stored Hookdeck connections (useful for testing)
 */
export async function clearHookdeckConnections(): Promise<void> {
  await kvStore.del('hookdeck:connections');
  await kvStore.del('hookdeck:source-auth');
}