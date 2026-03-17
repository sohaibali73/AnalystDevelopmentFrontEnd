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
  Clock, 
  Eye, 
  Loader2 
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
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
  conversationId
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
              <Clock className="h-3 w-3" />
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
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
            <div className="flex justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancel}
                className="text-xs"
              >
                <X className="h-3 w-3 mr-1" />
                Cancel
              </Button>
              <div className="text-xs text-muted-foreground">
                Estimated time: 30-60 seconds
              </div>
            </div>
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