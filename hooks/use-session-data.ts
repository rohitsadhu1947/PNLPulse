import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";

interface UseSessionDataOptions<T> {
  endpoint: string;
  onSuccess?: (data: T) => void;
  onError?: (error: string) => void;
  dependencies?: any[];
  retryCount?: number;
  retryDelay?: number;
}

export function useSessionData<T>({ 
  endpoint, 
  onSuccess, 
  onError, 
  dependencies = [],
  retryCount = 3,
  retryDelay = 1000
}: UseSessionDataOptions<T>) {
  const { data: session, status } = useSession();
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryAttempts, setRetryAttempts] = useState(0);

  useEffect(() => {
    // Don't fetch data until session is authenticated
    if (status === "loading") {
      console.log(`[useSessionData] Session loading for ${endpoint}`);
      return;
    }
    
    if (status === "unauthenticated") {
      console.log(`[useSessionData] Session unauthenticated for ${endpoint}`);
      setError("Authentication required");
      setLoading(false);
      return;
    }

    const fetchData = async (attempt: number = 0) => {
      try {
        console.log(`[useSessionData] Fetching ${endpoint} (attempt ${attempt + 1})`);
        setLoading(true);
        setError(null);
        
        const response = await fetch(endpoint, {
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });
        
        console.log(`[useSessionData] Response status for ${endpoint}:`, response.status);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`[useSessionData] Error response for ${endpoint}:`, errorText);
          throw new Error(`Failed to fetch data: ${response.status} ${response.statusText}`);
        }
        
        const result = await response.json();
        console.log(`[useSessionData] Success for ${endpoint}:`, result);
        setData(result);
        setRetryAttempts(0);
        onSuccess?.(result);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An error occurred';
        console.error(`[useSessionData] Error for ${endpoint}:`, errorMessage);
        
        // Retry logic
        if (attempt < retryCount - 1) {
          console.log(`[useSessionData] Retrying ${endpoint} in ${retryDelay}ms...`);
          setTimeout(() => {
            setRetryAttempts(attempt + 1);
            fetchData(attempt + 1);
          }, retryDelay);
          return;
        }
        
        setError(errorMessage);
        onError?.(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [status, endpoint, onSuccess, onError, retryAttempts, ...dependencies]);

  return { 
    data, 
    loading, 
    error, 
    retryAttempts,
    refetch: () => {
      setRetryAttempts(0);
      setLoading(true);
      setError(null);
    }
  };
} 