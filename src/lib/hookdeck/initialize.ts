import crypto from 'crypto';
import type {
  HookdeckConnection,
  BasicAuthCredentials,
  StoredConnections
} from '../../types/hookdeck';
import { fileKv } from '../storage/file-kv';

const HOOKDECK_API_URL = 'https://api.hookdeck.com/2025-07-01';
const DEBUG = process.env.DEBUG === 'true';
const LOG_LEVEL = process.env.LOG_LEVEL || 'info';

// Logging helper
function log(level: string, message: string, ...args: any[]) {
  const levels = ['error', 'warn', 'info', 'debug', 'verbose'];
  const currentLevel = levels.indexOf(LOG_LEVEL);
  const messageLevel = levels.indexOf(level);
  
  if (messageLevel <= currentLevel) {
    switch (level) {
      case 'error':
        console.error(message, ...args);
        break;
      case 'warn':
        console.warn(message, ...args);
        break;
      case 'info':
        console.info(message, ...args);
        break;
      case 'debug':
      case 'verbose':
        console.log(message, ...args);
        break;
      default:
        console.log(message, ...args);
    }
  }
}

// Simple in-memory storage for development when Vercel KV is not available

// KV-like interface for development
const kvStore = {
  async get<T>(key: string): Promise<T | null> {
    if (process.env.NODE_ENV === 'production' && process.env.KV_REST_API_URL && process.env.KV_REST_API_URL !== 'https://redis-12345.upstash.io') {
      // Use actual Vercel KV if configured
      const { kv } = await import('@vercel/kv');
      return kv.get<T>(key);
    }
    // Use file-based KV for development
    return fileKv.get<T>(key);
  },
  
  async set(key: string, value: any): Promise<void> {
    if (process.env.NODE_ENV === 'production' && process.env.KV_REST_API_URL && process.env.KV_REST_API_URL !== 'https://redis-12345.upstash.io') {
      // Use actual Vercel KV if configured
      const { kv } = await import('@vercel/kv');
      return kv.set(key, value);
    }
    // Use file-based KV for development
    fileKv.set(key, value);
  },
  
  async del(key: string): Promise<void> {
    if (process.env.NODE_ENV === 'production' && process.env.KV_REST_API_URL && process.env.KV_REST_API_URL !== 'https://redis-12345.upstash.io') {
      // Use actual Vercel KV if configured
      const { kv } = await import('@vercel/kv');
      await kv.del(key);
      return;
    }
    // Use file-based KV for development
    fileKv.del(key);
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
async function createHookdeckConnection(config: any, apiKey: string): Promise<HookdeckConnection> {
  // Use PUT with the connection name for idempotent operations
  const connectionName = config.name;
  const url = `${HOOKDECK_API_URL}/connections`;
  
  log('debug', `Creating/updating Hookdeck connection: ${connectionName}`, config);
  
  try {
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(config)
    });

    const responseText = await response.text();
    
    if (!response.ok) {
      let errorMessage = `Failed to create/update Hookdeck connection: ${response.status} ${response.statusText}`;
      try {
        const errorData = JSON.parse(responseText);
        errorMessage = errorData.message || errorData.error || errorMessage;
        log('error', 'Hookdeck API error:', errorData);
      } catch {
        errorMessage += ` - ${responseText}`;
      }
      log('error', errorMessage);
      throw new Error(errorMessage);
    }

    const data = JSON.parse(responseText);
    log('info', `Successfully created/updated connection: ${connectionName}`, {
      id: data.id,
      sourceUrl: data.source?.url
    });
    return data;
  } catch (error) {
    log('error', `Error creating connection ${connectionName}:`, error);
    throw error;
  }
}

/**
 * Ensures that Hookdeck connections exist for the Deep Queue application.
 * Creates connections if they don't exist, otherwise returns existing ones.
 */
export async function ensureHookdeckConnections(apiKey: string, openAIKey: string, appUrl: string): Promise<StoredConnections> {
  try {
    
    // Check if we're in mock mode (no API key provided)
    const isMockMode = !apiKey;
    if (isMockMode) {
      log('warn', 'Hookdeck API key not configured, real API calls will fail');
    }
    
    // Check if connections already exist in KV
    const existingConnections = await kvStore.get<StoredConnections>('hookdeck:connections');
    if (existingConnections) {
      log('info', 'Using existing Hookdeck connections', existingConnections);
      return existingConnections;
    }

    log('info', 'Creating new Hookdeck connections...');

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
        config: {
          url: 'https://api.openai.com/v1/responses',
          auth_type: 'BEARER_TOKEN',
          auth: {
            token: openAIKey
          }
        }
      },
    }, apiKey);

    // Create openai-webhook connection with OpenAI source type verification
    console.log('Creating openai-webhook connection...');
    const webhookConnection = await createHookdeckConnection({
      name: 'openai-webhook',
      source: {
        name: 'openai-webhook',
        config: {
          allowed_http_methods: ['POST'],
        }
      },
      destination: {
        name: 'deepqueue-webhook',
        config: {
          url: `${appUrl}/api/webhooks/openai`,
          auth_type: 'HOOKDECK_SIGNATURE',
          auth: {}
        }
      }
    }, apiKey);

    // Store connection details in KV
    const connectionData: StoredConnections = {
      queue: {
        id: queueConnection.id,
        sourceUrl: queueConnection.source.url
      },
      webhook: {
        id: webhookConnection.id,
        sourceUrl: webhookConnection.source.url,
        sourceId: webhookConnection.source.id
      }
    };

    await kvStore.set('hookdeck:connections', connectionData);
    log('info', 'Hookdeck connections created successfully', connectionData);
    
    return connectionData;
  } catch (error) {
    log('error', 'Error ensuring Hookdeck connections:', error);
    
    // Provide helpful error messages
    if (error instanceof Error) {
      if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        throw new Error('Invalid Hookdeck API key. Please check your HOOKDECK_API_KEY environment variable.');
      }
      if (error.message.includes('404')) {
        throw new Error('Hookdeck API endpoint not found. Please check your API version.');
      }
    }
    throw error;
  }
}

export async function updateWebhookSource(id: string, secret: string, apiKey: string) {
  const url = `${HOOKDECK_API_URL}/sources/${id}`;
  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      auth_type: 'OPENAI',
      auth: {
        webhook_secret_key: secret
      }
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    log('error', 'Failed to update webhook source:', errorText);
    throw new Error('Failed to update webhook source');
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