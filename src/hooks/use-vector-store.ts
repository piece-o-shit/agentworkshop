import { useCallback, useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Document } from '@langchain/core/documents';
import { VectorStoreManager, getVectorStore, createDocuments, type SearchResult } from '@/lib/langchain/vector-store';
import { useToast } from '@/components/ui/use-toast';
import { ChatOpenAI } from '@langchain/openai';

interface UseVectorStoreOptions {
  tableName?: string;
  queryName?: string;
}

interface AddDocumentOptions {
  texts: string[];
  metadata?: Record<string, unknown>[];
  analyze?: boolean;
}

interface SearchOptions {
  k?: number;
  analyze?: boolean;
  formatResults?: boolean;
}

export function useVectorStore(options: UseVectorStoreOptions = {}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize vector store
  useEffect(() => {
    try {
      // Initialize with OpenAI model for analysis
      const llm = new ChatOpenAI({
        modelName: "gpt-4",
        temperature: 0,
      });

      getVectorStore({
        tableName: options.tableName || 'documents',
        queryName: options.queryName || 'match_documents',
        llm
      });
      setIsInitialized(true);
    } catch (error) {
      console.error('Failed to initialize vector store:', error);
      toast({
        title: 'Error',
        description: 'Failed to initialize vector store',
        variant: 'destructive',
      });
    }
  }, [options.tableName, options.queryName]);

  // Add documents mutation
  const addDocumentsMutation = useMutation({
    mutationFn: async ({ texts, metadata = [], analyze = false }: AddDocumentOptions) => {
      if (!isInitialized) throw new Error('Vector store not initialized');
      const store = getVectorStore();
      const docs = createDocuments(texts, metadata);
      return store.addDocuments(docs, analyze);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast({
        title: 'Success',
        description: 'Documents added successfully',
      });
    },
    onError: (error) => {
      console.error('Failed to add documents:', error);
      toast({
        title: 'Error',
        description: 'Failed to add documents',
        variant: 'destructive',
      });
    },
  });

  // Delete documents mutation
  const deleteDocumentsMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      if (!isInitialized) throw new Error('Vector store not initialized');
      const store = getVectorStore();
      await store.deleteDocuments(ids);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast({
        title: 'Success',
        description: 'Documents deleted successfully',
      });
    },
    onError: (error) => {
      console.error('Failed to delete documents:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete documents',
        variant: 'destructive',
      });
    },
  });

  // Search documents
  const searchQuery = useCallback(
    async (query: string, options?: SearchOptions): Promise<SearchResult> => {
      if (!isInitialized) return { documents: [] };
      const store = getVectorStore();
      return store.similaritySearch(query, options);
    },
    [isInitialized]
  );

  // Search query with caching
  const { data: searchResults, isLoading: isSearching } = useQuery({
    queryKey: ['documents', 'search'],
    queryFn: () => searchQuery(''),
    enabled: false,
  });

  // Function to trigger searches
  const search = useCallback(
    async (query: string, options?: SearchOptions) => {
      return queryClient.fetchQuery({
        queryKey: ['documents', 'search', query, options],
        queryFn: () => searchQuery(query, options),
      });
    },
    [queryClient, searchQuery]
  );

  return {
    isInitialized,
    addDocuments: addDocumentsMutation.mutate,
    isAdding: addDocumentsMutation.isPending,
    deleteDocuments: deleteDocumentsMutation.mutate,
    isDeleting: deleteDocumentsMutation.isPending,
    search,
    searchResults,
    isSearching,
  };
}
