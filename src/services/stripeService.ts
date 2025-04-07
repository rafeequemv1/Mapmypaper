
import { loadStripe } from '@stripe/stripe-js';

// Replace with your publishable key when you have it
const STRIPE_PUBLISHABLE_KEY = 'pk_test_your_publishable_key';

let stripePromise: Promise<any> | null = null;

export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);
  }
  return stripePromise;
};

// Function to create a checkout session with Supabase Edge Function
export const createCheckoutSession = async (priceId: string, mode: 'payment' | 'subscription') => {
  try {
    const supabase = window.supabaseClient;
    
    if (!supabase) {
      throw new Error('Supabase client not available');
    }
    
    const { data, error } = await supabase.functions.invoke('create-checkout', {
      body: { priceId, mode },
    });
    
    if (error) {
      throw new Error(error.message);
    }
    
    return data;
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw error;
  }
};

// Function to check subscription status
export const checkSubscriptionStatus = async () => {
  try {
    const supabase = window.supabaseClient;
    
    if (!supabase) {
      throw new Error('Supabase client not available');
    }
    
    const { data, error } = await supabase.functions.invoke('check-subscription');
    
    if (error) {
      throw new Error(error.message);
    }
    
    return data.subscribed;
  } catch (error) {
    console.error('Error checking subscription status:', error);
    return false;
  }
};
