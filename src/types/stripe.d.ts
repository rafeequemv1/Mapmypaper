
declare global {
  interface Window {
    supabaseClient: any;
  }
}

export interface StripeCheckoutSession {
  url: string;
}

export interface SubscriptionStatus {
  subscribed: boolean;
  expiresAt?: string;
  customerId?: string;
}

export type StripeMode = 'payment' | 'subscription';

export interface CreateCheckoutBody {
  priceId: string;
  mode: StripeMode;
}
