import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, FileText, Calendar, CheckCircle, Clock, XCircle } from "lucide-react";
import { getDocuments, uploadDocument } from "@/lib/realApi";
import { Document } from "@/types";
import { useToast } from "@/hooks/use-toast";

const Documents = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      const data = await getDocuments();
      setDocuments(data);
    } catch (error) {
      console.error('Failed to load documents:', error);
    }
  };

  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    try {
      await uploadDocument(file);
      toast({
        title: "Upload successful",
        description: `${file.name} has been uploaded and is being processed.`,
      });
      loadDocuments();
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'processing':
        return <Clock className="h-4 w-4 text-warning" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-destructive" />;
      default:
        return <FileText className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Documents</h1>
          <p className="text-muted-foreground">Upload and manage financial reports</p>
        </div>

        {/* Upload Area */}
        <Card>
          <CardHeader>
            <CardTitle>Upload Documents</CardTitle>
            <CardDescription>
              Drag and drop your financial reports (PDF, Excel, CSV)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border-2 border-dashed border-muted rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
              <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <div className="space-y-2">
                <p className="text-lg font-medium">Drop files here to upload</p>
                <p className="text-sm text-muted-foreground">
                  or click to browse your computer
                </p>
              </div>
              <Button 
                className="mt-4" 
                disabled={isUploading}
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = '.pdf,.xlsx,.xls,.csv';
                  input.onchange = (e) => {
                    const file = (e.target as HTMLInputElement).files?.[0];
                    if (file) handleFileUpload(file);
                  };
                  input.click();
                }}
              >
                {isUploading ? "Uploading..." : "Select Files"}
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                Supported formats: PDF, Excel (.xlsx, .xls), CSV
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Documents List */}
        <Card>
          <CardHeader>
            <CardTitle>Document Library</CardTitle>
            <CardDescription>All uploaded financial documents</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {documents.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center space-x-4">
                    <FileText className="h-8 w-8 text-primary" />
                    <div>
                      <p className="font-medium">{doc.filename}</p>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <span className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          {doc.uploadedAt.toLocaleDateString()}
                        </span>
                        <span className="capitalize">{doc.type.replace('_', ' ')}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(doc.status)}
                      <span className={`text-sm font-medium capitalize ${
                        doc.status === 'completed' 
                          ? 'text-success' 
                          : doc.status === 'processing'
                          ? 'text-warning'
                          : 'text-destructive'
                      }`}>
                        {doc.status}
                      </span>
                    </div>
                    
                    {doc.status === 'completed' && (
                      <Button variant="outline" size="sm">
                        View Analysis
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              
              {documents.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="mx-auto h-12 w-12 mb-4" />
                  <p>No documents uploaded yet</p>
                  <p className="text-sm">Upload your first financial report to get started</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Documents;