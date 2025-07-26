/**
 * Loop Messages SDK - Shared Example Configuration
 *
 * This file contains shared configuration values for all examples.
 * Update these values with your own credentials.
 */
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables from .env file if present
const envPath = path.resolve(__dirname, '.env');
if (fs.existsSync(envPath)) {
  console.log('Loading environment variables from .env file');
  const envConfig = fs
    .readFileSync(envPath, 'utf8')
    .split('\n')
    .filter(line => line.trim() !== '' && !line.startsWith('#'))
    .reduce(
      (acc, line) => {
        const [key, value] = line.split('=');
        if (key && value) {
          acc[key.trim()] = value.trim();
        }
        return acc;
      },
      {} as Record<string, string>
    );

  // Set environment variables
  Object.entries(envConfig).forEach(([key, value]) => {
    process.env[key] = value;
  });
}

// API Credentials
export const API_CREDENTIALS = {
  loopAuthKey: process.env.LOOP_AUTH_KEY || 'your-auth-key-here',
  loopSecretKey: process.env.LOOP_SECRET_KEY || 'your-secret-key-here',
  webhookSecretKey: process.env.WEBHOOK_SECRET_KEY || 'your-webhook-secret-key-here',
};

// Sender Configuration
export const SENDER_CONFIG = {
  senderName: process.env.LOOP_SENDER_NAME || 'Example Sender',
  defaultRecipient: process.env.DEFAULT_RECIPIENT || '+1234567890',
};

// API Endpoints (typically you won't need to change these)
export const API_ENDPOINTS = {
  baseUrl: process.env.LOOP_API_HOST || 'https://api.loop.us',
  webhooksUrl: process.env.LOOP_WEBHOOKS_HOST || 'https://api.loop.us/webhooks',
};

// Example Group Configuration
export const GROUP_CONFIG = {
  groupId: process.env.GROUP_ID || '',
  groupName: process.env.GROUP_NAME || 'Example Group',
  participants: [
    process.env.DEFAULT_RECIPIENT || '+1234567890',
    process.env.SECOND_RECIPIENT || '+0987654321',
  ],
};

// Example Server Configuration
export const SERVER_CONFIG = {
  port: process.env.PORT ? parseInt(process.env.PORT) : 3000,
  host: process.env.HOST || 'localhost',
};

// Logger Configuration
export const LOGGER_CONFIG = {
  defaultLogLevel: (process.env.LOG_LEVEL || 'info') as 'debug' | 'info' | 'warn' | 'error',
  enableDebugMode: process.env.DEBUG === 'true',
};

/**
 * Helper function to print section headers in console examples
 */
export function printHeader(title: string): void {
  console.log('\n' + '='.repeat(title.length + 4));
  console.log(`= ${title} =`);
  console.log('='.repeat(title.length + 4) + '\n');
}

/**
 * Helper function to print a divider line
 */
export function printDivider(): void {
  console.log('-'.repeat(50));
}

/**
 * Helper function to ensure required environment variables are set
 */
export function validateConfig(): void {
  if (API_CREDENTIALS.loopAuthKey === 'your-auth-key-here') {
    console.warn('⚠️  Warning: Default API keys are being used. Update with your own credentials.');
    console.warn('   Set environment variables or update the config.ts file directly.\n');
  }
}
