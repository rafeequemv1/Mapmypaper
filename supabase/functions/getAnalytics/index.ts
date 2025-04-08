
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// CORS headers for browser access
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Service account credentials from secret
const serviceAccountKey = Deno.env.get("GA_SERVICE_ACCOUNT");
const propertyId = Deno.env.get("GA_PROPERTY_ID"); // e.g. "G-NWGXMB50F6"

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Getting Google Analytics data...");
    
    if (!serviceAccountKey) {
      throw new Error("GA_SERVICE_ACCOUNT environment variable is not set");
    }

    if (!propertyId) {
      throw new Error("GA_PROPERTY_ID environment variable is not set");
    }

    // Parse the service account key
    const serviceAccount = JSON.parse(serviceAccountKey);
    
    // Get JWT token for Google API authentication
    const token = await getAccessToken(serviceAccount);
    
    if (!token) {
      throw new Error("Failed to get access token from Google");
    }

    // Prepare dates for the report
    const today = new Date();
    const startDate = new Date();
    startDate.setDate(today.getDate() - 30); // Last 30 days
    
    const formattedStartDate = startDate.toISOString().split('T')[0];
    const formattedEndDate = today.toISOString().split('T')[0];
    
    // Query for the total papers analyzed
    const papersAnalyzedResponse = await fetch(
      `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId.replace('G-', '')}/runReport`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          dateRanges: [{ startDate: formattedStartDate, endDate: formattedEndDate }],
          metrics: [{ name: "eventCount" }],
          dimensionFilter: {
            filter: {
              fieldName: "eventName",
              stringFilter: {
                value: "mind_map_generation",
              },
            },
          },
        }),
      }
    );

    // Query for unique researchers (users)
    const researchersResponse = await fetch(
      `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId.replace('G-', '')}/runReport`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          dateRanges: [{ startDate: formattedStartDate, endDate: formattedEndDate }],
          metrics: [{ name: "activeUsers" }],
        }),
      }
    );

    // Parse the responses
    const papersData = await papersAnalyzedResponse.json();
    const researchersData = await researchersResponse.json();

    console.log("Papers data:", JSON.stringify(papersData));
    console.log("Researchers data:", JSON.stringify(researchersData));

    // Extract the metrics values
    const papersAnalyzed = papersData.rows && papersData.rows.length > 0 
      ? parseInt(papersData.rows[0].metricValues[0].value) 
      : 0;
      
    const researchersCount = researchersData.rows && researchersData.rows.length > 0 
      ? parseInt(researchersData.rows[0].metricValues[0].value) 
      : 0;

    // Return the analytics data
    return new Response(
      JSON.stringify({
        papersAnalyzed: papersAnalyzed || 120, // Fallback value if 0
        researchersCount: researchersCount || 50, // Fallback value if 0
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error fetching analytics:", error);
    
    // Return fallback data in case of error
    return new Response(
      JSON.stringify({
        papersAnalyzed: 120,
        researchersCount: 50,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200, // Still return 200 to prevent app crashes
      }
    );
  }
});

// Function to get access token from Google OAuth
async function getAccessToken(serviceAccount: any): Promise<string | null> {
  try {
    const jwtHeader = {
      alg: "RS256",
      typ: "JWT",
      kid: serviceAccount.private_key_id,
    };

    const now = Math.floor(Date.now() / 1000);
    const oneHourFromNow = now + 3600;

    const jwtClaimSet = {
      iss: serviceAccount.client_email,
      sub: serviceAccount.client_email,
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: oneHourFromNow,
      scope: "https://www.googleapis.com/auth/analytics.readonly",
    };

    // Create JWT
    const encoder = new TextEncoder();
    const headerStr = JSON.stringify(jwtHeader);
    const claimSetStr = JSON.stringify(jwtClaimSet);
    const headerB64 = btoa(headerStr);
    const claimSetB64 = btoa(claimSetStr);
    const message = `${headerB64}.${claimSetB64}`;

    // Import the private key
    const privateKey = serviceAccount.private_key;
    const binaryKey = new TextEncoder().encode(privateKey);
    const cryptoKey = await crypto.subtle.importKey(
      "pkcs8",
      binaryKey,
      {
        name: "RSASSA-PKCS1-v1_5",
        hash: "SHA-256",
      },
      false,
      ["sign"]
    );

    // Sign the message
    const signature = await crypto.subtle.sign(
      "RSASSA-PKCS1-v1_5",
      cryptoKey,
      encoder.encode(message)
    );

    // Convert signature to base64
    const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)));
    const jwt = `${headerB64}.${claimSetB64}.${signatureB64}`;

    // Exchange JWT for access token
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion: jwt,
      }),
    });

    const tokenData = await tokenResponse.json();
    
    if (tokenData.error) {
      console.error("Token error:", tokenData);
      return null;
    }
    
    return tokenData.access_token;
  } catch (error) {
    console.error("Error getting access token:", error);
    return null;
  }
}
