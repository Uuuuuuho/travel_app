'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, CheckCircle, XCircle, Globe, Brain, Eye, EyeOff } from 'lucide-react';

interface ScrapeResult {
  url: string;
  title: string;
  content: string;
  relevanceScore: number;
  scrapedAt?: string;
  originalContent?: string; // Add this field for reference content
}

interface SystemStatus {
  llmAvailable: boolean;
  llmType: string;
  error?: string;
}

export default function WebScraperTestPage() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScrapeResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);
  const [showOriginalContent, setShowOriginalContent] = useState(false);

  useEffect(() => {
    checkSystemStatus();
  }, []);

  const checkSystemStatus = async () => {
    try {
      const response = await fetch('/api/system-status');
      if (response.ok) {
        const status = await response.json();
        setSystemStatus(status);
      } else {
        setSystemStatus({ llmAvailable: false, llmType: 'unknown', error: 'Failed to check system status' });
      }
    } catch (err) {
      setSystemStatus({ 
        llmAvailable: false, 
        llmType: 'unknown', 
        error: err instanceof Error ? err.message : 'Unknown error' 
      });
    } finally {
      setStatusLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/scrape-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to scrape URL');
      }

      const data: ScrapeResult = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-6 w-6" />
            Web Scraper Test Interface
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* System Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Brain className="h-5 w-5" />
                System Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              {statusLoading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Checking system status...</span>
                </div>
              ) : systemStatus ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    {systemStatus.llmAvailable ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                    <span className="font-medium">
                      LLM Service: {systemStatus.llmAvailable ? 'Available' : 'Unavailable'}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    LLM Type: {systemStatus.llmType}
                  </div>
                  {systemStatus.error && (
                    <Alert variant="destructive">
                      <AlertDescription>{systemStatus.error}</AlertDescription>
                    </Alert>
                  )}
                </div>
              ) : null}
            </CardContent>
          </Card>

          {/* URL Input Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="url-input" className="block text-sm font-medium mb-2">
                URL to scrape:
              </label>
              <Input
                id="url-input"
                type="url"
                placeholder="Enter a URL to scrape (e.g., https://example.com)"
                value={url}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUrl(e.target.value)}
                required
                disabled={loading || !systemStatus?.llmAvailable}
              />
            </div>
            <Button 
              type="submit" 
              disabled={loading || !systemStatus?.llmAvailable} 
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Scraping and analyzing...
                </>
              ) : (
                'Scrape and Analyze'
              )}
            </Button>
          </form>

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Results Display */}
          {result && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  Scraping Result
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-sm text-gray-500 uppercase tracking-wide mb-2">TITLE</h3>
                    <p className="text-xl font-medium">{result.title}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-gray-500 uppercase tracking-wide mb-2">RELEVANCE SCORE</h3>
                    <p className="text-xl">
                      <span className={`font-bold text-2xl ${result.relevanceScore >= 70 ? 'text-green-600' : result.relevanceScore >= 40 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {result.relevanceScore}
                      </span>
                      <span className="text-gray-500 text-lg"> / 100</span>
                    </p>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold text-sm text-gray-500 uppercase tracking-wide mb-2">URL</h3>
                  <a 
                    href={result.url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-blue-600 hover:text-blue-800 hover:underline break-all font-medium"
                  >
                    {result.url}
                  </a>
                </div>
                
                <div>
                  <h3 className="font-semibold text-sm text-gray-500 uppercase tracking-wide mb-2">AI SUMMARY</h3>
                  <div className="p-4 bg-blue-100 rounded-lg border-2 border-blue-300">
                    <p className="text-blue-800 font-medium leading-relaxed">{result.content}</p>
                  </div>
                </div>

                {result.originalContent && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-sm text-gray-500 uppercase tracking-wide">Original Content (Reference)</h3>
                      <Button
                        onClick={() => setShowOriginalContent(!showOriginalContent)}
                        className="h-6 px-2 text-xs border border-gray-300 bg-white hover:bg-gray-50"
                      >
                        {showOriginalContent ? (
                          <>
                            <EyeOff className="h-3 w-3 mr-1" />
                            Hide
                          </>
                        ) : (
                          <>
                            <Eye className="h-3 w-3 mr-1" />
                            Show
                          </>
                        )}
                      </Button>
                    </div>
                    {showOriginalContent && (
                      <div className="mt-1 p-3 bg-gray-50 rounded-md border border-gray-200 max-h-60 overflow-y-auto">
                        <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                          {result.originalContent}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {result.scrapedAt && (
                  <div>
                    <h3 className="font-semibold text-sm text-gray-500 uppercase tracking-wide">Scraped At</h3>
                    <p className="mt-1 text-sm text-gray-600">
                      {new Date(result.scrapedAt).toLocaleString()}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Usage Instructions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">How to Use</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <ol className="list-decimal list-inside space-y-1">
                <li>Ensure the LLM service is available (check system status above)</li>
                <li>Enter a valid URL in the input field</li>
                <li>Click "Scrape and Analyze" to test the crawling functionality</li>
                <li>Review the AI-generated summary and compare with original content</li>
                <li>Check the relevance score to evaluate content quality</li>
              </ol>
              <div className="mt-4 p-3 bg-blue-50 rounded-md">
                <p className="text-blue-800">
                  <strong>Note:</strong> This interface shows how vLLM processes web content:
                </p>
                <ul className="list-disc list-inside mt-2 text-blue-700 space-y-1">
                  <li><strong>AI Summary:</strong> LLM-generated travel-focused summary</li>
                  <li><strong>Original Content:</strong> Raw extracted text for reference</li>
                  <li><strong>Relevance Score:</strong> How useful the content is for travelers (0-100)</li>
                </ul>
              </div>
              <div className="mt-4 p-3 bg-green-50 rounded-md">
                <p className="text-green-800">
                  <strong>✅ Integration:</strong> The same summarization logic is now used in the main travel application 
                  for processing destination information and generating itineraries.
                </p>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}
