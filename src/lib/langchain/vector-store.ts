import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
import { OpenAIEmbeddings } from "@langchain/openai";
import { Document } from "@langchain/core/documents";
import { Embeddings } from "@langchain/core/embeddings";
import { BaseLanguageModel } from "@langchain/core/language_models/base";
import { supabase } from "@/integrations/supabase/client";
import { analyzeDocument, parseSearchQuery, formatSearchResults, type DocumentAnalysis } from "./parsers";

export interface VectorStoreConfig {
  tableName: string;
  queryName: string;
  embeddings?: Embeddings;
  llm?: BaseLanguageModel;
}

export interface SearchResult {
  documents: Document[];
  analysis?: DocumentAnalysis[];
  formattedResults?: string;
}

export class VectorStoreManager {
  private store: SupabaseVectorStore;
  private embeddings: OpenAIEmbeddings;
  private llm?: BaseLanguageModel;

  constructor(config: VectorStoreConfig) {
    this.llm = config.llm;
    this.embeddings = config.embeddings as OpenAIEmbeddings || new OpenAIEmbeddings({
      modelName: "text-embedding-3-small"
    });

    this.store = new SupabaseVectorStore(this.embeddings, {
      client: supabase,
      tableName: config.tableName,
      queryName: config.queryName,
    });
  }

  /**
   * Add documents to the vector store with optional analysis
   */
  async addDocuments(
    docs: Document[],
    analyze: boolean = false
  ): Promise<{ documents: Document[]; analysis?: DocumentAnalysis[] }> {
    try {
      await this.store.addDocuments(docs);

      if (analyze && this.llm) {
        const analysis = await Promise.all(
          docs.map(doc => analyzeDocument(doc, this.llm!))
        );
        return { documents: docs, analysis };
      }

      return { documents: docs };
    } catch (error) {
      console.error('Error adding documents to vector store:', error);
      throw new Error('Failed to add documents to vector store');
    }
  }

  /**
   * Perform similarity search with optional analysis
   */
  async similaritySearch(
    query: string,
    options: {
      k?: number;
      analyze?: boolean;
      formatResults?: boolean;
    } = {}
  ): Promise<SearchResult> {
    try {
      const { k = 4, analyze = false, formatResults = false } = options;
      let searchQuery = query;

      // Parse natural language query if LLM is available
      if (this.llm) {
        const parsedQuery = await parseSearchQuery(query, this.llm);
        searchQuery = parsedQuery.query;
      }

      const documents = await this.store.similaritySearch(searchQuery, k);
      const result: SearchResult = { documents };

      // Analyze documents if requested and LLM is available
      if (analyze && this.llm) {
        result.analysis = await Promise.all(
          documents.map(doc => analyzeDocument(doc, this.llm!))
        );
      }

      // Format results if requested
      if (formatResults) {
        result.formattedResults = formatSearchResults(documents, result.analysis);
      }

      return result;
    } catch (error) {
      console.error('Error performing similarity search:', error);
      throw new Error('Failed to perform similarity search');
    }
  }

  /**
   * Upsert documents with optional analysis
   */
  async upsertDocuments(
    docs: Document[],
    analyze: boolean = false
  ): Promise<{ documents: Document[]; analysis?: DocumentAnalysis[] }> {
    try {
      await this.store.addDocuments(docs, { 
        ids: docs.map(doc => doc.metadata?.id as string) 
      });

      if (analyze && this.llm) {
        const analysis = await Promise.all(
          docs.map(doc => analyzeDocument(doc, this.llm!))
        );
        return { documents: docs, analysis };
      }

      return { documents: docs };
    } catch (error) {
      console.error('Error upserting documents:', error);
      throw new Error('Failed to upsert documents');
    }
  }

  /**
   * Delete documents by their IDs
   */
  async deleteDocuments(ids: string[]): Promise<void> {
    try {
      await this.store.delete({ ids });
    } catch (error) {
      console.error('Error deleting documents:', error);
      throw new Error('Failed to delete documents');
    }
  }

  /**
   * Create a retriever from the vector store
   */
  getRetriever(k: number = 4) {
    return this.store.asRetriever(k);
  }

  /**
   * Set the language model for analysis
   */
  setLanguageModel(llm: BaseLanguageModel) {
    this.llm = llm;
  }
}

// Helper function to create documents from text
export function createDocuments(
  texts: string[],
  metadata: Record<string, unknown>[] = []
): Document[] {
  return texts.map((text, i) => new Document({
    pageContent: text,
    metadata: metadata[i] || {}
  }));
}

// Create a singleton instance for the vector store
let vectorStoreInstance: VectorStoreManager | null = null;

export function getVectorStore(config?: VectorStoreConfig): VectorStoreManager {
  if (!vectorStoreInstance && !config) {
    throw new Error('Vector store not initialized. Please provide config.');
  }

  if (!vectorStoreInstance && config) {
    vectorStoreInstance = new VectorStoreManager(config);
  }

  return vectorStoreInstance!;
}
