// Shared CORS configuration for edge functions
// This provides origin validation to prevent unauthorized cross-origin requests

const ALLOWED_ORIGINS = [
  // Production domains
  'https://ennyvenue.com',
  'https://www.ennyvenue.com',
  // Lovable preview domains
  /^https:\/\/[a-z0-9-]+\.lovable\.app$/,
  /^https:\/\/[a-z0-9-]+\.lovableproject\.com$/,
  // Local development
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:54321',
];

export function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false;
  
  return ALLOWED_ORIGINS.some(allowed => {
    if (typeof allowed === 'string') {
      return origin === allowed;
    }
    // Handle regex patterns
    return allowed.test(origin);
  });
}

export function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('origin');
  
  // Use the request origin if it's allowed, otherwise use the first allowed origin
  const allowedOrigin = isAllowedOrigin(origin) && origin ? origin : 'https://ennyvenue.com';
  
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  };
}

// For endpoints that must be publicly accessible (like email tracking pixels)
// but still want some protection
export function getPublicCorsHeaders(): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };
}
