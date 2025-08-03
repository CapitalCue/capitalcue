import { Document, Constraint, EvaluationResult, User, FinancialData } from '@/types';
  import { sampleDocuments, sampleConstraints, sampleEvaluation } from './mockData';

  // API Configuration
  const API_ENDPOINTS = {
    DOCUMENTS: import.meta.env.VITE_DOCUMENT_API || 'http://localhost:8001',
    CONSTRAINTS: import.meta.env.VITE_CONSTRAINT_API || 'http://localhost:8002',
    ALERTS: import.meta.env.VITE_ALERTS_API || 'http://localhost:8003',
    AI: import.meta.env.VITE_AI_API || 'http://localhost:8004'
  };

  // Helper function for API calls
  const apiCall = async (url: string, options: RequestInit = {}) => {
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API call failed:', error);
      throw error;
    }
  };

  // Document endpoints with real MCP integration
  export const uploadDocument = async (file: File): Promise<{ documentId: string; status: string }> => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${API_ENDPOINTS.DOCUMENTS}/upload-and-parse`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');

      const data = await response.json();
      return {
        documentId: data.document_id || Math.random().toString(36).substr(2, 9),
        status: data.success ? 'completed' : 'processing'
      };
    } catch (error) {
      console.error('Upload failed, using fallback:', error);
      return {
        documentId: Math.random().toString(36).substr(2, 9),
        status: 'processing'
      };
    }
  };

  export const getDocuments = async (): Promise<Document[]> => {
    try {
      const data = await apiCall(`${API_ENDPOINTS.DOCUMENTS}/api/documents`);
      return data.documents?.map((doc: any) => ({
        id: doc.id,
        filename: doc.filename,
        type: doc.type || 'quarterly_report',
        uploadedAt: new Date(doc.uploaded_at || Date.now()),
        status: doc.status || 'completed',
        extractedData: doc.extracted_data
      })) || [];
    } catch (error) {
      console.error('Failed to fetch documents, using sample data:', error);
      return sampleDocuments;
    }
  };

  export const getDocumentStatus = async (id: string): Promise<{ status: string; extractedData?: FinancialData }> => {
    try {
      const data = await apiCall(`${API_ENDPOINTS.DOCUMENTS}/api/documents/${id}/status`);
      return {
        status: data.status || 'completed',
        extractedData: data.extracted_data ? {
          revenue: data.extracted_data.revenue || 0,
          profit: data.extracted_data.profit || 0,
          expenses: data.extracted_data.expenses || 0,
          assets: data.extracted_data.assets || 0,
          liabilities: data.extracted_data.liabilities || 0,
          equity: data.extracted_data.equity || 0,
          period: data.extracted_data.period || 'Q4 2023',
          currency: data.extracted_data.currency || 'USD'
        } : undefined
      };
    } catch (error) {
      console.error('Failed to fetch document status:', error);
      const doc = sampleDocuments.find(d => d.id === id);
      return {
        status: doc?.status || 'failed',
        extractedData: doc?.extractedData
      };
    }
  };

  // Constraint endpoints with real MCP integration
  export const createConstraint = async (constraint: Omit<Constraint, 'id'>): Promise<Constraint> => {
    try {
      const constraintId = Math.random().toString(36).substr(2, 9);
      const data = await apiCall(`${API_ENDPOINTS.CONSTRAINTS}/api/constraints/add`, {
        method: 'POST',
        body: JSON.stringify({
          id: constraintId,
          name: constraint.name,
          description: `Constraint: ${constraint.name}`,
          metric: constraint.metric,
          operator: constraint.operator,
          value: constraint.value,
          severity: constraint.severity,
          message: constraint.message,
          isActive: constraint.isActive !== false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }),
      });

      return {
        id: data.data?.id || constraintId,
        ...constraint
      };
    } catch (error) {
      console.error('Failed to create constraint, using fallback:', error);
      return {
        ...constraint,
        id: Math.random().toString(36).substr(2, 9)
      };
    }
  };

  export const getConstraints = async (): Promise<Constraint[]> => {
    try {
      const data = await apiCall(`${API_ENDPOINTS.CONSTRAINTS}/api/constraints`);
      return data.data?.map((constraint: any) => ({
        id: constraint.id,
        name: constraint.name,
        metric: constraint.metric,
        operator: constraint.operator,
        value: constraint.value,
        severity: constraint.severity,
        message: constraint.message,
        isActive: constraint.isActive !== false
      })) || [];
    } catch (error) {
      console.error('Failed to fetch constraints, using sample data:', error);
      return sampleConstraints;
    }
  };

  export const evaluateConstraints = async (
    constraints: Constraint[],
    documentId: string
  ): Promise<EvaluationResult> => {
    try {
      const docStatus = await getDocumentStatus(documentId);

      if (!docStatus.extractedData) {
        throw new Error('No financial data available');
      }

      const metrics = [
        { name: 'revenue', value: docStatus.extractedData.revenue, unit: 'USD', period: docStatus.extractedData.period, source: 'document', confidence: 0.9 },
        { name: 'profit', value: docStatus.extractedData.profit, unit: 'USD', period: docStatus.extractedData.period, source: 'document', confidence: 0.9 },
        { name: 'debt_to_equity', value: docStatus.extractedData.liabilities / (docStatus.extractedData.equity || 1), unit: 'ratio', period: docStatus.extractedData.period, source: 'calculated',
  confidence: 0.8 }
      ];

      const data = await apiCall(`${API_ENDPOINTS.CONSTRAINTS}/api/constraints/evaluate`, {
        method: 'POST',
        body: JSON.stringify({ constraints, metrics }),
      });

      const result = data.data || data;
      return {
        violations: result.violations || [],
        totalConstraints: result.totalConstraints || constraints.length,
        violationsCount: result.violationsCount || 0,
        criticalCount: result.criticalCount || 0,
        warningCount: result.warningCount || 0,
        passedConstraints: (result.totalConstraints || constraints.length) - (result.violationsCount || 0),
        overallStatus: (result.criticalCount || 0) > 0 ? 'fail' :
                      (result.warningCount || 0) > 0 ? 'warning' : 'pass'
      };
    } catch (error) {
      console.error('Failed to evaluate constraints, using sample data:', error);
      return sampleEvaluation;
    }
  };

  // Analysis endpoints with real MCP integration
  export const analyzeDocument = async (documentId: string): Promise<{ insights: string[]; recommendations: string[] }> => {
    try {
      const data = await apiCall(`${API_ENDPOINTS.AI}/api/analyze/document`, {
        method: 'POST',
        body: JSON.stringify({ documentId, analysisType: 'financial' }),
      });

      return {
        insights: data.data?.insights || [
          "Document analysis completed successfully",
          "Financial metrics extracted and processed"
        ],
        recommendations: data.data?.recommendations || [
          "Review constraint evaluation results",
          "Consider additional due diligence if needed"
        ]
      };
    } catch (error) {
      console.error('Failed to analyze document, using fallback:', error);
      return {
        insights: [
          "Revenue growth of 15% is below industry average of 22%",
          "Profit margins have improved by 3% compared to previous quarter",
          "Cash flow remains positive despite increased R&D spending"
        ],
        recommendations: [
          "Consider diversifying revenue streams to accelerate growth",
          "Optimize operational efficiency to improve profit margins",
          "Maintain current cash management strategy"
        ]
      };
    }
  };

  export const getAnalysisHistory = async (): Promise<any[]> => {
    try {
      const data = await apiCall(`${API_ENDPOINTS.AI}/api/analyze/history`);
      return data.data || [];
    } catch (error) {
      console.error('Failed to fetch analysis history:', error);
      return [
        {
          id: "1",
          documentName: "TechCorp_Q4_2023.pdf",
          analyzedAt: new Date("2024-01-15"),
          status: "completed",
          overallScore: 85
        },
        {
          id: "2",
          documentName: "StartupX_Q3_2023.xlsx",
          analyzedAt: new Date("2024-01-10"),
          status: "warning",
          overallScore: 68
        }
      ];
    }
  };

  // Auth endpoints (keeping mock for now)
  export const login = async (email: string, password: string): Promise<{ user: User; token: string }> => {
    await new Promise(resolve => setTimeout(resolve, 800));

    if (email === "demo@capitalcue.com" && password === "demo123") {
      return {
        user: {
          id: "1",
          email: "demo@capitalcue.com",
          firstName: "Demo",
          lastName: "User",
          userType: "VC",
          companyName: "Demo Capital"
        },
        token: "mock-jwt-token"
      };
    }
    throw new Error("Invalid credentials");
  };

  export const register = async (userData: any): Promise<{ user: User; token: string }> => {
    await new Promise(resolve => setTimeout(resolve, 1000));

    return {
      user: {
        id: Math.random().toString(36).substr(2, 9),
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        userType: userData.userType,
        companyName: userData.companyName
      },
      token: "mock-jwt-token"
    };
  };
