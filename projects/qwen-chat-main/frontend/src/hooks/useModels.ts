import { useState, useEffect } from 'react';

export interface ModelInfo {
  id: string;
  name: string;
  size: string;
  best_for: string[];
  speed: string;
  quality: string;
  description: string;
  installed: boolean;
}

export interface ModelsResponse {
  models: ModelInfo[];
  default: string;
  error?: string;
  backend_available?: boolean;
}

export function useModels() {
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchModels();
  }, []);

  const fetchModels = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/models', {
        cache: 'no-store', // Prevent stale responses
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch models: ${response.statusText}`);
      }

      const data: ModelsResponse = await response.json();
      
      // Handle backend unavailable case gracefully
      if (data.backend_available === false) {
        setModels(data.models || []); // Use empty array if backend is down
        setError(data.error || 'Backend is not available');
      } else {
        setModels(data.models || []);
        setError(null);
      }
    } catch (err) {
      console.error('Error fetching models:', err);
      // On error, set empty models list and show error
      setModels([]);
      setError(err instanceof Error ? err.message : 'Failed to fetch models');
    } finally {
      setLoading(false);
    }
  };

  return { models, loading, error, refetch: fetchModels };
}
