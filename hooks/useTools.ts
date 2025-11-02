import { useState, useEffect, useCallback } from 'react';
import { Tool, Category, PricingModel, SortOption } from '../types';
import { getTools, getToolById, subscribeToTools } from '../services/firestore';
import { initialTools } from '../data/mockData';

interface UseToolsFilters {
  trulyFree?: boolean;
  noSignup?: boolean;
  commercialUse?: boolean;
  pricingModels?: PricingModel[];
  categories?: Category[];
  freshness?: '24h' | '7d' | '30d' | 'all';
}

interface UseToolsOptions {
  filters?: UseToolsFilters;
  sortOption?: SortOption;
  limit?: number;
  useRealTime?: boolean;
}

export const useTools = (options: UseToolsOptions = {}) => {
  const { filters, sortOption = SortOption.Rising, limit: limitCount = 20, useRealTime = false } = options;
  
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [total, setTotal] = useState<number>(0);
  const [hasLoaded, setHasLoaded] = useState<boolean>(false);

  const loadTools = useCallback(async () => {
    setLoading(true);
    setError(null);

    // Add a timeout to prevent hanging
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Firestore query timeout')), 3000)
    );

    try {
      // Map SortOption enum to Firestore sort strings
      const sortMapping: Record<SortOption, 'freshness' | 'trending' | 'mentions'> = {
        [SortOption.Rising]: 'trending',
        [SortOption.Recent]: 'freshness',
        [SortOption.Established]: 'mentions'
      };

      const firestoreSort = sortMapping[sortOption] || 'freshness';

      // Build Firestore filters
      const firestoreFilters: any = {};
      if (filters?.categories && filters.categories.length > 0) {
        firestoreFilters.category = filters.categories[0]; // Firestore doesn't support IN queries easily, use first
      }
      if (filters?.pricingModels && filters.pricingModels.length > 0) {
        firestoreFilters.pricingModel = filters.pricingModels[0]; // Use first for now
      }
      if (filters?.trulyFree) {
        firestoreFilters.trulyFree = true;
      }
      if (filters?.freshness) {
        firestoreFilters.freshness = filters.freshness;
      }

      // Race Firestore query with timeout
      const result = await Promise.race([
        getTools(firestoreFilters, firestoreSort, limitCount, 0),
        timeoutPromise
      ]) as { tools: Tool[]; total: number; hasMore: boolean };
      
      // Apply client-side filters that Firestore doesn't support
      let filtered = result.tools;

      if (filters?.trulyFree) {
        filtered = filtered.filter(tool => 
          tool.pricing.freeTier.exists && 
          !tool.pricing.freeTier.requiresCard && 
          !tool.pricing.freeTier.watermark
        );
      }

      if (filters?.noSignup) {
        filtered = filtered.filter(tool => !tool.pricing.freeTier.requiresSignup);
      }

      if (filters?.commercialUse) {
        filtered = filtered.filter(tool => tool.pricing.freeTier.commercialUse);
      }

      if (filters?.pricingModels && filters.pricingModels.length > 0) {
        filtered = filtered.filter(tool => filters.pricingModels!.includes(tool.pricing.model));
      }

      if (filters?.categories && filters.categories.length > 0) {
        filtered = filtered.filter(tool => filters.categories!.includes(tool.category));
      }

      // Fallback to mock data if Firestore is empty or has errors
      // Only use fallback if we got no results AND haven't already loaded mock data
      if ((!result || filtered.length === 0 || result.total === 0) && !hasLoaded) {
        console.log('Firestore returned no data, using mock data as fallback');
        // Apply filters to mock data immediately
        let mockFiltered = [...initialTools];
        
        if (filters?.trulyFree) {
          mockFiltered = mockFiltered.filter(tool => 
            tool.pricing.freeTier.exists && 
            !tool.pricing.freeTier.requiresCard && 
            !tool.pricing.freeTier.watermark
          );
        }
        if (filters?.noSignup) {
          mockFiltered = mockFiltered.filter(tool => !tool.pricing.freeTier.requiresSignup);
        }
        if (filters?.commercialUse) {
          mockFiltered = mockFiltered.filter(tool => tool.pricing.freeTier.commercialUse);
        }
        if (filters?.pricingModels && filters.pricingModels.length > 0) {
          mockFiltered = mockFiltered.filter(tool => filters.pricingModels!.includes(tool.pricing.model));
        }
        if (filters?.categories && filters.categories.length > 0) {
          mockFiltered = mockFiltered.filter(tool => filters.categories!.includes(tool.category));
        }
        if (filters?.freshness && filters.freshness !== 'all') {
          const now = new Date();
          let cutoffDate: Date;
          switch (filters.freshness) {
            case '24h':
              cutoffDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
              break;
            case '7d':
              cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
              break;
            case '30d':
              cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
              break;
            default:
              cutoffDate = new Date(0);
          }
          mockFiltered = mockFiltered.filter(tool => new Date(tool.firstSeenAt) >= cutoffDate);
        }

        // Apply sorting
        switch (sortOption) {
          case SortOption.Rising:
            mockFiltered.sort((a, b) => b.trendScore - a.trendScore);
            break;
          case SortOption.Recent:
            mockFiltered.sort((a, b) => new Date(b.firstSeenAt).getTime() - new Date(a.firstSeenAt).getTime());
            break;
          case SortOption.Established:
            mockFiltered.sort((a, b) => b.mentionCount - a.mentionCount);
            break;
        }

        setTools(mockFiltered.slice(0, limitCount));
        setHasMore(mockFiltered.length > limitCount);
        setTotal(mockFiltered.length);
        setHasLoaded(true);
      } else {
        setTools(filtered);
        setHasMore(result.hasMore);
        setTotal(result.total);
        setHasLoaded(true);
      }
    } catch (err) {
      console.error('Error loading tools from Firestore, falling back to mock data:', err);
      // Fallback to mock data on error - this ensures we always have data
      let mockFiltered = [...initialTools];
      
      // Apply filters to mock data
      if (filters?.trulyFree) {
        mockFiltered = mockFiltered.filter(tool => 
          tool.pricing.freeTier.exists && 
          !tool.pricing.freeTier.requiresCard && 
          !tool.pricing.freeTier.watermark
        );
      }
      if (filters?.noSignup) {
        mockFiltered = mockFiltered.filter(tool => !tool.pricing.freeTier.requiresSignup);
      }
      if (filters?.commercialUse) {
        mockFiltered = mockFiltered.filter(tool => tool.pricing.freeTier.commercialUse);
      }
      if (filters?.pricingModels && filters.pricingModels.length > 0) {
        mockFiltered = mockFiltered.filter(tool => filters.pricingModels!.includes(tool.pricing.model));
      }
      if (filters?.categories && filters.categories.length > 0) {
        mockFiltered = mockFiltered.filter(tool => filters.categories!.includes(tool.category));
      }
      if (filters?.freshness && filters.freshness !== 'all') {
        const now = new Date();
        let cutoffDate: Date;
        switch (filters.freshness) {
          case '24h':
            cutoffDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            break;
          case '7d':
            cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case '30d':
            cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
          default:
            cutoffDate = new Date(0);
        }
        mockFiltered = mockFiltered.filter(tool => new Date(tool.firstSeenAt) >= cutoffDate);
      }
      
      // Apply basic sorting
      switch (sortOption) {
        case SortOption.Rising:
          mockFiltered.sort((a, b) => b.trendScore - a.trendScore);
          break;
        case SortOption.Recent:
          mockFiltered.sort((a, b) => new Date(b.firstSeenAt).getTime() - new Date(a.firstSeenAt).getTime());
          break;
        case SortOption.Established:
          mockFiltered.sort((a, b) => b.mentionCount - a.mentionCount);
          break;
      }

      setTools(mockFiltered.slice(0, limitCount));
      setHasMore(mockFiltered.length > limitCount);
      setTotal(mockFiltered.length);
      setError(null); // Don't show error if we have fallback data
      setHasLoaded(true);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - we'll trigger manually when filters change

  useEffect(() => {
    if (useRealTime) {
      // Use real-time listener
      const sortMapping: Record<SortOption, 'freshness' | 'trending' | 'mentions'> = {
        [SortOption.Rising]: 'trending',
        [SortOption.Recent]: 'freshness',
        [SortOption.Established]: 'mentions'
      };

      const unsubscribe = subscribeToTools(
        (updatedTools) => {
          // Apply client-side filters
          let filtered = updatedTools;

          if (filters?.trulyFree) {
            filtered = filtered.filter(tool => 
              tool.pricing.freeTier.exists && 
              !tool.pricing.freeTier.requiresCard && 
              !tool.pricing.freeTier.watermark
            );
          }

          if (filters?.noSignup) {
            filtered = filtered.filter(tool => !tool.pricing.freeTier.requiresSignup);
          }

          if (filters?.commercialUse) {
            filtered = filtered.filter(tool => tool.pricing.freeTier.commercialUse);
          }

          if (filters?.pricingModels && filters.pricingModels.length > 0) {
            filtered = filtered.filter(tool => filters.pricingModels!.includes(tool.pricing.model));
          }

          if (filters?.categories && filters.categories.length > 0) {
            filtered = filtered.filter(tool => filters.categories!.includes(tool.category));
          }

          setTools(filtered);
          setLoading(false);
        },
        {
          category: filters?.categories && filters.categories.length > 0 ? filters.categories[0] : undefined,
          sortOption: sortMapping[sortOption]
        }
      );

      return () => unsubscribe();
    } else {
      // One-time load - only load once unless filters explicitly change
      if (!hasLoaded) {
        loadTools();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [useRealTime, hasLoaded]); // Only depend on useRealTime and hasLoaded

  // Reload when filters or sort option change (but only if already loaded)
  useEffect(() => {
    if (hasLoaded && !useRealTime) {
      setHasLoaded(false);
      loadTools();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    filters?.trulyFree,
    filters?.noSignup,
    filters?.commercialUse,
    filters?.pricingModels?.join(','),
    filters?.categories?.join(','),
    filters?.freshness,
    sortOption,
    limitCount
  ]);

  return { tools, loading, error, hasMore, total, refresh: loadTools };
};

// Hook for getting a single tool
export const useTool = (toolId: string | null) => {
  const [tool, setTool] = useState<Tool | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!toolId) {
      setTool(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    getToolById(toolId)
      .then(fetchedTool => {
        if (!fetchedTool) {
          // Fallback to mock data
          console.warn('Tool not found in Firestore, checking mock data');
          const mockTool = initialTools.find(t => t.id === toolId);
          if (mockTool) {
            setTool(mockTool);
          } else {
            setError('Tool not found');
          }
        } else {
          setTool(fetchedTool);
        }
      })
      .catch(err => {
        console.error('Error loading tool from Firestore, checking mock data:', err);
        // Fallback to mock data
        const mockTool = initialTools.find(t => t.id === toolId);
        if (mockTool) {
          setTool(mockTool);
          setError(null);
        } else {
          setError('Tool not found');
          setTool(null);
        }
      })
      .finally(() => {
        setLoading(false);
      });
  }, [toolId]);

  return { tool, loading, error };
};
