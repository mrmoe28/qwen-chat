import { NextRequest } from 'next/server';

// Determine API base URL based on environment (same pattern as health route)
function getApiBase(request: NextRequest): string {
  // Check for explicit environment variable first
  if (process.env.NEXT_PUBLIC_API_BASE) {
    return process.env.NEXT_PUBLIC_API_BASE;
  }
  
  // Try to detect if we're in production based on the request host
  const host = request.headers.get('host') || '';
  if (host && !host.includes('localhost') && !host.includes('127.0.0.1')) {
    // Production: backend should be accessible via same domain
    // For Cloudflare Tunnel, backend might be on localhost:8000 on the server
    // but accessible via the tunnel. Use localhost since this runs server-side.
    return 'http://localhost:8000';
  }
  
  // Default to localhost for development
  return 'http://localhost:8000';
}

export async function GET(request: NextRequest) {
  const API_BASE = getApiBase(request);
  const MODELS_API_URL = `${API_BASE}/api/models`;

  try {
    // Try to fetch models with timeout
    let modelsData = null;
    let errorMessage = 'Failed to fetch models from backend';

    try {
      const response = await fetch(MODELS_API_URL, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(5000), // 5 second timeout
      });

      if (response.ok) {
        modelsData = await response.json();
      } else {
        errorMessage = `Backend returned ${response.status}`;
      }
    } catch (error) {
      // Network error or timeout - backend is not reachable
      if (error instanceof Error) {
        if (error.name === 'AbortError' || error.message.includes('timeout')) {
          errorMessage = 'Backend request timed out';
        } else if (error.message.includes('fetch failed') || error.message.includes('ECONNREFUSED')) {
          errorMessage = 'Backend is not reachable';
        } else {
          errorMessage = error.message;
        }
      }
    }

    // If we got models data, return it
    if (modelsData) {
      return Response.json(modelsData);
    }

    // If backend is unreachable, return empty models list with error info
    // This prevents 530 errors from propagating to the client
    return Response.json({
      models: [],
      default: 'auto',
      error: errorMessage,
      backend_available: false,
    });
  } catch (error) {
    // Fallback error handler
    console.error('Models API proxy error:', error);
    return Response.json({
      models: [],
      default: 'auto',
      error: error instanceof Error ? error.message : 'Unknown error',
      backend_available: false,
    });
  }
}
