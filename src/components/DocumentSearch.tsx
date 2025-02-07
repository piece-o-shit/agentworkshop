import { useState, useCallback } from 'react';
import { useVectorStore } from '@/hooks/use-vector-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Loader2, Search, FileText, BarChart } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { DocumentAnalysis } from '@/lib/langchain/parsers';

interface SearchOptions {
  analyze: boolean;
  formatResults: boolean;
  k: number;
}

export function DocumentSearch() {
  const [searchOptions, setSearchOptions] = useState<SearchOptions>({
    analyze: true,
    formatResults: false,
    k: 4
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [documentText, setDocumentText] = useState('');
  const {
    isInitialized,
    addDocuments,
    isAdding,
    search,
    searchResults,
    isSearching,
  } = useVectorStore();

  const handleAddDocument = useCallback(async () => {
    if (!documentText.trim()) return;
    
    await addDocuments(
      {
        texts: [documentText],
        metadata: [{
          source: 'user-input',
          timestamp: new Date().toISOString(),
        }],
        analyze: searchOptions.analyze
      }
    );

    setDocumentText('');
  }, [documentText, addDocuments, searchOptions.analyze]);

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;
    await search(searchQuery, searchOptions);
  }, [searchQuery, search, searchOptions]);

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="ml-2">Initializing vector store...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Add Document Section */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Add Document</h2>
        <Textarea
          value={documentText}
          onChange={(e) => setDocumentText(e.target.value)}
          placeholder="Enter document text..."
          className="min-h-[100px]"
        />
        <Button 
          onClick={handleAddDocument}
          disabled={isAdding || !documentText.trim()}
        >
          {isAdding ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Adding...
            </>
          ) : (
            'Add Document'
          )}
        </Button>
      </div>

      {/* Search Section */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Search Documents</h2>
        <div className="flex gap-2">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Enter search query..."
            className="flex-1"
          />
          <Button 
            onClick={handleSearch}
            disabled={isSearching || !searchQuery.trim()}
          >
            {isSearching ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Searching...
              </>
            ) : (
              'Search'
            )}
          </Button>
        </div>
      </div>

      {/* Search Options */}
      <div className="space-y-4 border rounded-lg p-4 mb-4">
        <h3 className="text-lg font-semibold">Search Options</h3>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="analyze"
              checked={searchOptions.analyze}
              onCheckedChange={(checked) => 
                setSearchOptions(prev => ({ ...prev, analyze: checked }))
              }
            />
            <Label htmlFor="analyze">Analyze Documents</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="format"
              checked={searchOptions.formatResults}
              onCheckedChange={(checked) => 
                setSearchOptions(prev => ({ ...prev, formatResults: checked }))
              }
            />
            <Label htmlFor="format">Format Results</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Label htmlFor="k">Results:</Label>
            <Input
              id="k"
              type="number"
              min="1"
              max="10"
              value={searchOptions.k}
              onChange={(e) => 
                setSearchOptions(prev => ({ 
                  ...prev, 
                  k: Math.max(1, Math.min(10, parseInt(e.target.value) || 1))
                }))
              }
              className="w-20"
            />
          </div>
        </div>
      </div>

      {/* Results Section */}
      {searchResults?.documents && searchResults.documents.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Search Results</h2>
          <div className="grid gap-4">
            {searchResults.documents.map((doc, index) => {
              const analysis = searchResults.analysis?.[index];
              return (
                <Card key={index} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm text-gray-600">
                        {doc.pageContent}
                      </p>
                      {doc.metadata && (
                        <div className="mt-2 text-xs text-gray-400">
                          <p>Source: {doc.metadata.source}</p>
                          <p>Added: {new Date(doc.metadata.timestamp).toLocaleString()}</p>
                        </div>
                      )}
                    </div>
                    {analysis && (
                      <div className="ml-4 space-y-2">
                        <Badge variant="secondary">
                          Sentiment: {analysis.sentiment}
                        </Badge>
                        {analysis.topics.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {analysis.topics.map((topic, i) => (
                              <Badge key={i} variant="outline">
                                {topic}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  {analysis && (
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-sm text-gray-600">
                        <strong>Summary:</strong> {analysis.summary}
                      </p>
                      {analysis.keyPoints.length > 0 && (
                        <div className="mt-2">
                          <strong className="text-sm">Key Points:</strong>
                          <ul className="list-disc list-inside text-sm text-gray-600">
                            {analysis.keyPoints.map((point, i) => (
                              <li key={i}>{point}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
