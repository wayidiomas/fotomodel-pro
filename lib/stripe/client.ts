/**
 * Stripe Client Configuration
 *
 * Initializes Stripe with the correct environment (test or live)
 */

import Stripe from 'stripe';

const stripeEnvironment = process.env.STRIPE_ENVIRONMENT || 'test';

const secretKey = stripeEnvironment === 'live'
  ? process.env.STRIPE_SECRET_KEY_LIVE
  : process.env.STRIPE_SECRET_KEY_TEST;

if (!secretKey) {
  throw new Error(
    `Missing Stripe secret key for environment: ${stripeEnvironment}. ` +
    `Please set STRIPE_SECRET_KEY_${stripeEnvironment.toUpperCase()} in your .env file.`
  );
}

export const stripe = new Stripe(secretKey, {
  apiVersion: '2025-11-17.clover' as const,
  typescript: true,
  appInfo: {
    name: 'Fotomodel Pro',
    version: '1.0.0',
  },
});

export const stripeEnv = stripeEnvironment as 'test' | 'live';

console.log(`✅ Stripe initialized in ${stripeEnvironment} mode`);
