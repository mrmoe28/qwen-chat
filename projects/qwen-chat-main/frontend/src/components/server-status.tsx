'use client';

import { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

interface ServerHealth {
  status: string;
  backend: string;
  ollama?: string;
  message?: string;
}

export function ServerStatus() {
  const [health, setHealth] = useState<ServerHealth | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const response = await fetch('/api/health', {
          // Add cache control to prevent stale responses
          cache: 'no-store',
          // Add timeout to prevent hanging requests
          signal: AbortSignal.timeout(10000), // 10 second timeout
        });
        
        if (!response.ok) {
          throw new Error(`Health check failed: ${response.status}`);
        }
        
        const data = await response.json();
        setHealth(data);
      } catch (error) {
        // Handle network errors gracefully
        setHealth({
          status: 'error',
          backend: 'offline',
          message: error instanceof Error ? error.message : 'Failed to connect to server',
        });
      } finally {
        setLoading(false);
      }
    };

    checkHealth();
    // Increase interval to reduce load - check every 60 seconds instead of 30
    const interval = setInterval(checkHealth, 60000);

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin" />
        <span>Checking...</span>
      </div>
    );
  }

  const isHealthy = health?.status === 'ok' && health?.backend === 'online';

  return (
    <div className="flex items-center gap-2 text-xs">
      {isHealthy ? (
        <>
          <CheckCircle className="h-3 w-3 text-green-500" />
          <span className="text-green-600 dark:text-green-400">Server Online</span>
        </>
      ) : (
        <>
          <AlertCircle className="h-3 w-3 text-red-500" />
          <span className="text-red-600 dark:text-red-400">
            {health?.message || 'Server Offline'}
          </span>
        </>
      )}
    </div>
  );
}
