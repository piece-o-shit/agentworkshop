import { z } from "zod";
import { StructuredOutputParser } from "langchain/output_parsers";
import { BaseLanguageModel } from "@langchain/core/language_models/base";
import { Document } from "@langchain/core/documents";

// Schema for document analysis results
export const documentAnalysisSchema = z.object({
  summary: z.string().describe("A concise summary of the document content"),
  topics: z.array(z.string()).describe("Main topics discussed in the document"),
  sentiment: z.enum(["positive", "negative", "neutral"]).describe("Overall sentiment of the document"),
  keyPoints: z.array(z.string()).describe("Key points extracted from the document"),
  entities: z.array(z.object({
    name: z.string(),
    type: z.enum(["person", "organization", "location", "date", "other"]),
    context: z.string().optional()
  })).describe("Named entities found in the document")
});

export type DocumentAnalysis = z.infer<typeof documentAnalysisSchema>;

// Schema for search query parsing
export const searchQuerySchema = z.object({
  query: z.string().describe("The main search query"),
  filters: z.object({
    dateRange: z.object({
      start: z.string().optional(),
      end: z.string().optional()
    }).optional(),
    topics: z.array(z.string()).optional(),
    sentiment: z.enum(["positive", "negative", "neutral"]).optional()
  }).optional(),
  limit: z.number().min(1).max(100).optional()
});

export type SearchQuery = z.infer<typeof searchQuerySchema>;

// Create parsers with automatic fixing
export const createDocumentAnalysisParser = () => {
  return StructuredOutputParser.fromZodSchema(documentAnalysisSchema);
};

export const createSearchQueryParser = () => {
  return StructuredOutputParser.fromZodSchema(searchQuerySchema);
};

// Helper function to analyze documents
export async function analyzeDocument(
  doc: Document,
  llm: BaseLanguageModel,
  options: { includeTopics?: boolean; includeSentiment?: boolean } = {}
): Promise<DocumentAnalysis> {
  const parser = createDocumentAnalysisParser();
  
  const prompt = `Analyze the following document and provide a structured output:
  
  ${doc.pageContent}
  
  ${parser.getFormatInstructions()}`;

  const result = await llm.invoke(prompt);
  return parser.parse(result);
}

// Helper function to parse natural language search queries
export async function parseSearchQuery(
  query: string,
  llm: BaseLanguageModel
): Promise<SearchQuery> {
  const parser = createSearchQueryParser();
  
  const prompt = `Convert the following natural language search query into a structured format:
  
  ${query}
  
  ${parser.getFormatInstructions()}`;

  const result = await llm.invoke(prompt);
  return parser.parse(result);
}

// Helper function to format search results
export function formatSearchResults(
  docs: Document[],
  analysis?: DocumentAnalysis[]
): string {
  return docs.map((doc, i) => {
    const docAnalysis = analysis?.[i];
    let result = `Document ${i + 1}:\n${doc.pageContent}\n`;
    
    if (docAnalysis) {
      result += `\nSummary: ${docAnalysis.summary}`;
      if (docAnalysis.topics.length > 0) {
        result += `\nTopics: ${docAnalysis.topics.join(', ')}`;
      }
      if (docAnalysis.sentiment) {
        result += `\nSentiment: ${docAnalysis.sentiment}`;
      }
    }
    
    if (doc.metadata) {
      result += `\nMetadata: ${JSON.stringify(doc.metadata, null, 2)}`;
    }
    
    return result;
  }).join('\n\n');
}
