import { NextRequest } from 'next/server';

// Determine API base URL based on environment
// In production (Vercel), NEXT_PUBLIC_API_BASE must be set to the public backend URL
// In development, defaults to localhost
function getApiBase(request: NextRequest): string {
  // Always check environment variable first (required for production)
  if (process.env.NEXT_PUBLIC_API_BASE) {
    return process.env.NEXT_PUBLIC_API_BASE;
  }
  
  // Fallback: Try to detect if we're in production based on the request host
  const host = request.headers.get('host') || '';
  if (host && !host.includes('localhost') && !host.includes('127.0.0.1')) {
    // Production detected but no env var set - this is an error
    // Log warning but still try localhost (will fail, but gives clear error)
    console.warn('⚠️ NEXT_PUBLIC_API_BASE not set in production! Backend calls will fail.');
    return 'http://localhost:8000';
  }
  
  // Default to localhost for development
  return 'http://localhost:8000';
}

export async function GET(request: NextRequest) {
  const API_BASE = getApiBase(request);
  
  try {
    // Check backend health with better error handling
    let backendStatus = 'offline';
    let backendData = null;
    let backendMessage = 'Backend is offline';

    try {
      const backendResponse = await fetch(`${API_BASE}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000), // 5 second timeout
      });

      if (backendResponse.ok) {
        backendStatus = 'online';
        backendData = await backendResponse.json();
      } else {
        backendMessage = `Backend returned ${backendResponse.status}`;
      }
    } catch (error) {
      // Network error or timeout - backend is not reachable
      if (error instanceof Error) {
        if (error.name === 'AbortError' || error.message.includes('timeout')) {
          backendMessage = 'Backend request timed out';
        } else if (error.message.includes('fetch failed') || error.message.includes('ECONNREFUSED')) {
          backendMessage = 'Backend is not reachable';
        } else {
          backendMessage = error.message;
        }
      }
    }

    // Backend already checks Ollama, so we trust its response
    // Ollama runs locally and cannot be accessed from Vercel serverless functions
    const ollamaStatus = backendData?.ollama_connected ? 'online' : 'offline';

    // Return 200 OK even if backend is offline - let the frontend handle the status
    return Response.json({
      status: backendStatus === 'online' ? 'ok' : 'error',
      backend: backendStatus,
      ollama: ollamaStatus,
      backendInfo: backendData,
      message: backendStatus === 'offline' ? backendMessage : undefined,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    // Fallback error handler
    return Response.json({
      status: 'error',
      backend: 'offline',
      ollama: 'unknown',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }
}
