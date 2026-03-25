import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  FileSpreadsheet, 
  FileCode, 
  FileIcon as FileIconLucide, 
  Download, 
  RefreshCw, 
  X, 
  CheckCircle, 
  AlertCircle, 
  Eye, 
  Loader2 
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// ===== TYPE DEFINITIONS =====

interface PersistentGenerationCardProps {
  toolCallId: string;
  toolName: string;
  input: any;
  output?: any;
  state: 'input-streaming' | 'input-available' | 'output-available' | 'output-error';
  errorText?: string;
  conversationId?: string;
  onPreview?: (file: { url?: string; fileId?: string; filename: string }) => void;
}

interface GenerationJob {
  id: string;
  toolName: string;
  input: any;
  status: 'generating' | 'complete' | 'error';
  progress: number;
  downloadUrl: string | null;
  fileId: string | null;
  conversationId?: string;
  timestamp: number;
  title?: string;
}

interface GenerationJobs {
  [key: string]: GenerationJob;
}

// ===== COMPONENT =====

const PersistentGenerationCard: React.FC<PersistentGenerationCardProps> = ({
  toolCallId,
  toolName,
  input,
  output,
  state,
  errorText,
  conversationId,
  onPreview
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [fileId, setFileId] = useState<string | null>(null);

  // Initialize component state from localStorage on mount
  useEffect(() => {
    const storedJobs = localStorage.getItem('gen_cards');
    if (storedJobs) {
      try {
        const jobs: GenerationJobs = JSON.parse(storedJobs);
        const job = jobs[toolCallId];
        if (job) {
          setIsGenerating(job.status === 'generating');
          setProgress(job.progress || 0);
          setDownloadUrl(job.downloadUrl || null);
          setFileId(job.fileId || null);
        }
      } catch (e) {
        console.error('Failed to parse stored generation jobs:', e);
      }
    }
  }, [toolCallId]);

  // Update localStorage when state changes
  useEffect(() => {
    const storedJobs = localStorage.getItem('gen_cards');
    let jobs: GenerationJobs = {};
    if (storedJobs) {
      try {
        jobs = JSON.parse(storedJobs) as GenerationJobs;
      } catch {
        jobs = {};
      }
    }

    const jobData: GenerationJob = {
      id: toolCallId,
      toolName,
      input,
      status: isGenerating ? 'generating' : state === 'output-error' ? 'error' : 'complete',
      progress,
      downloadUrl,
      fileId,
      conversationId,
      timestamp: Date.now(),
      title: input?.title || input?.topic
    };

    jobs[toolCallId] = jobData;
    localStorage.setItem('gen_cards', JSON.stringify(jobs));
  }, [toolCallId, toolName, input, isGenerating, progress, downloadUrl, fileId, conversationId, state]);

  // Handle state changes from AI SDK
  useEffect(() => {
    if (state === 'input-streaming' || state === 'input-available') {
      setIsGenerating(true);
      setProgress(0);
    } else if (state === 'output-available' && output) {
      setIsGenerating(false);
      setProgress(100);
      setDownloadUrl(output.download_url || output.downloadUrl || output.file_url || null);
      setFileId(output.file_id || output.fileId || output.document_id || output.presentation_id || null);
      
      // Show success toast
      const fileName = output.filename || output.title || 'Generated Document';
      toast.success(`${fileName} generated successfully!`, {
        action: {
          label: 'Download',
          onClick: () => handleDownload()
        },
        duration: 5000,
      });
    } else if (state === 'output-error') {
      setIsGenerating(false);
      setProgress(0);
      toast.error(`Generation failed: ${errorText || 'Unknown error'}`, {
        duration: 8000,
      });
    }
  }, [state, output, errorText]);

  const handleDownload = async () => {
    if (downloadUrl) {
      try {
        const response = await fetch(downloadUrl);
        if (response.ok) {
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = output?.filename || output?.title || 'generated-file';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
          toast.success('File downloaded successfully!');
        } else {
          throw new Error('Failed to download file');
        }
      } catch (error) {
        toast.error('Download failed. Please try again.');
        console.error('Download error:', error);
      }
    } else if (fileId) {
      // Handle file ID download
      try {
        const token = localStorage.getItem('auth_token');
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
        const response = await fetch(`${apiUrl}/upload/files/${fileId}/download`, {
          headers: {
            'Authorization': token ? `Bearer ${token}` : ''
          }
        });
        
        if (response.ok) {
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = output?.filename || output?.title || 'generated-file';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
          toast.success('File downloaded successfully!');
        } else {
          throw new Error('Failed to download file');
        }
      } catch (error) {
        toast.error('Download failed. Please try again.');
        console.error('Download error:', error);
      }
    } else {
      toast.error('No download available');
    }
  };

  const handleRetry = () => {
    // Reset state and trigger regeneration
    setIsGenerating(true);
    setProgress(0);
    setDownloadUrl(null);
    setFileId(null);
    
    // Trigger regeneration by sending a message to restart the tool
    // This would need to be implemented based on your chat system
    toast.info('Retrying generation...');
  };

  const handleCancel = () => {
    setIsGenerating(false);
    setProgress(0);
    
    // Update localStorage to mark as cancelled
    const storedJobs = localStorage.getItem('gen_cards');
    if (storedJobs) {
      try {
        const jobs: GenerationJobs = JSON.parse(storedJobs);
        if (jobs[toolCallId]) {
          jobs[toolCallId].status = 'error';
          localStorage.setItem('gen_cards', JSON.stringify(jobs));
        }
      } catch (e) {
        console.error('Failed to update job status:', e);
      }
    }
    
    toast.info('Generation cancelled');
  };

  const getToolIcon = () => {
    const name = toolName.toLowerCase();
    if (name.includes('document') || name.includes('docx') || name.includes('word')) {
      return FileText;
    } else if (name.includes('presentation') || name.includes('pptx') || name.includes('powerpoint') || name.includes('slide')) {
      return FileSpreadsheet;
    } else if (name.includes('code') || name.includes('script')) {
      return FileCode;
    } else {
      return FileIconLucide;
    }
  };

  const getToolTitle = () => {
    const name = toolName.toLowerCase();
    if (name.includes('document') || name.includes('docx') || name.includes('word')) {
      return 'Document Generation';
    } else if (name.includes('presentation') || name.includes('pptx') || name.includes('powerpoint') || name.includes('slide')) {
      return 'Presentation Generation';
    } else if (name.includes('code') || name.includes('script')) {
      return 'Code Generation';
    } else {
      return 'File Generation';
    }
  };

  const IconComponent = getToolIcon();

  return (
    <Card className="mt-4 border-2 border-muted/50">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-muted rounded-lg">
            <IconComponent className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-sm font-medium">
              {getToolTitle()}
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              {input?.title || input?.topic || 'Generating file...'}
            </CardDescription>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {isGenerating ? (
            <Badge variant="secondary" className="flex items-center space-x-2">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>Generating</span>
            </Badge>
          ) : state === 'output-available' ? (
            <Badge variant="default" className="flex items-center space-x-2 bg-green-500/10 text-green-700 border border-green-500/20">
              <CheckCircle className="h-3 w-3" />
              <span>Complete</span>
            </Badge>
          ) : state === 'output-error' ? (
            <Badge variant="destructive" className="flex items-center space-x-2">
              <AlertCircle className="h-3 w-3" />
              <span>Error</span>
            </Badge>
          ) : (
            <Badge variant="outline" className="flex items-center space-x-2">
              <Loader2 className="h-3 w-3" />
              <span>Pending</span>
            </Badge>
          )}
          {conversationId && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                // Navigate to conversation
                window.location.href = `/chat?conversation=${conversationId}`;
              }}
              className="text-xs"
            >
              <Eye className="h-3 w-3 mr-1" />
              View
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        {isGenerating && (
          <div className="space-y-4">
            {/* Animated dots indicator */}
            <div className="flex flex-col items-center justify-center py-4 space-y-4">
              <div className="relative flex items-center justify-center">
                {/* Spinning ring */}
                <div className="absolute w-16 h-16 rounded-full border-2 border-muted border-t-primary animate-spin" />
                {/* Bouncing dots */}
                <div className="flex space-x-2">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="w-2.5 h-2.5 rounded-full bg-primary"
                      style={{
                        animation: `persistentBounce 1.4s ease-in-out ${i * 0.16}s infinite`,
                      }}
                    />
                  ))}
                </div>
              </div>
              
              {/* Phase text */}
              <div className="flex items-center space-x-2 text-sm text-primary font-medium">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span>Generating your file</span>
              </div>

              {/* Do not refresh warning */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: '8px',
                backgroundColor: 'var(--accent-dim)',
                border: '1px solid var(--border-hover)',
              }}>
                <svg style={{ width: '16px', height: '16px', color: 'var(--accent)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <span style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  color: 'var(--accent)',
                }}>
                  Do not refresh or leave this page
                </span>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleCancel}
              className="text-xs w-full"
            >
              <X className="h-3 w-3 mr-1" />
              Cancel
            </Button>
          </div>
        )}

        {state === 'output-available' && output && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">File Type:</span>
                <span className="ml-2 font-medium">
                  {output.file_type || output.fileType || output.type || 'Document'}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Size:</span>
                <span className="ml-2 font-medium">
                  {output.file_size_kb || output.fileSizeKb 
                    ? `${output.file_size_kb || output.fileSizeKb} KB` 
                    : 'Unknown'}
                </span>
              </div>
            </div>
            <div className="flex space-x-2">
              {onPreview && downloadUrl && (
                <Button
                  variant="outline"
                  onClick={() => onPreview({
                    url: downloadUrl,
                    filename: output?.filename || output?.title || 'document',
                  })}
                  className="flex items-center space-x-2"
                >
                  <Eye className="h-4 w-4" />
                  <span>Preview</span>
                </Button>
              )}
              <Button
                onClick={handleDownload}
                className="flex items-center space-x-2"
                disabled={!downloadUrl && !fileId}
              >
                <Download className="h-4 w-4" />
                <span>Download</span>
              </Button>
              <Button
                variant="outline"
                onClick={handleRetry}
                className="flex items-center space-x-2"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Regenerate</span>
              </Button>
            </div>
          </div>
        )}

        {state === 'output-error' && errorText && (
          <div className="space-y-3">
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-md">
              <p className="text-sm text-red-700 dark:text-red-400">{errorText}</p>
            </div>
            <div className="flex justify-end">
              <Button
                variant="outline"
                onClick={handleRetry}
                className="flex items-center space-x-2"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Retry</span>
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PersistentGenerationCard;

/* Add animation keyframes */
const style = document.createElement('style');
style.textContent = `
  @keyframes persistentBounce {
    0%, 80%, 100% { transform: translateY(0); }
    40% { transform: translateY(-10px); }
  }
`;
document.head.appendChild(style);
