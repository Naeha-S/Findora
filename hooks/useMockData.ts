import { useState, useEffect } from 'react';
import { Tool } from '../types';
import { fetchToolsWithMentions } from '../services/api';

export const useMockData = () => {
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadToolData = async () => {
      setLoading(true);
      try {
        const fetchedTools = await fetchToolsWithMentions();
        setTools(fetchedTools);
      } catch (error) {
        console.error("Failed to fetch tool data:", error);
        // In a real app, you might set an error state here to show in the UI
      } finally {
        setLoading(false);
      }
    };

    loadToolData();
  }, []); // The empty dependency array ensures this runs only once on mount.

  return { tools, loading };
};
