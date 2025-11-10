import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

/**
 * Hook to access and manage user settings
 */
export function useSettings() {
  const { data: session } = useSession();
  const [settings, setSettings] = useState({
    silentMode: false,
    readReceiptsEnabled: true,
    enterToSend: true,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session) {
      fetchSettings();
    }
  }, [session]);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings');
      const data = await response.json();
      
      if (data.success && data.data) {
        setSettings(data.data);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  return { settings, loading };
}
