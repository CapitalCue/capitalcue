import { Document, Constraint, EvaluationResult, User, FinancialData } from '@/types';
import { sampleDocuments, sampleConstraints, sampleEvaluation, sampleUser } from './mockData';

// Simulate API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Document endpoints
export const uploadDocument = async (file: File): Promise<{ documentId: string; status: string }> => {
  await delay(1000);
  const newDocId = Math.random().toString(36).substr(2, 9);
  return {
    documentId: newDocId,
    status: 'processing'
  };
};

export const getDocuments = async (): Promise<Document[]> => {
  await delay(500);
  return sampleDocuments;
};

export const getDocumentStatus = async (id: string): Promise<{ status: string; extractedData?: FinancialData }> => {
  await delay(300);
  const doc = sampleDocuments.find(d => d.id === id);
  return {
    status: doc?.status || 'failed',
    extractedData: doc?.extractedData
  };
};

// Constraint endpoints
export const createConstraint = async (constraint: Omit<Constraint, 'id'>): Promise<Constraint> => {
  await delay(500);
  return {
    ...constraint,
    id: Math.random().toString(36).substr(2, 9)
  };
};

export const getConstraints = async (): Promise<Constraint[]> => {
  await delay(300);
  return sampleConstraints;
};

export const evaluateConstraints = async (
  constraints: Constraint[], 
  documentId: string
): Promise<EvaluationResult> => {
  await delay(1500);
  return sampleEvaluation;
};

// Analysis endpoints
export const analyzeDocument = async (documentId: string): Promise<{ insights: string[]; recommendations: string[] }> => {
  await delay(1000);
  return {
    insights: [
      "Revenue growth of 15% is below industry average of 22%",
      "Profit margins have improved by 3% compared to previous quarter",
      "Cash flow remains positive despite increased R&D spending",
      "Customer acquisition cost has decreased by 12%"
    ],
    recommendations: [
      "Consider diversifying revenue streams to accelerate growth",
      "Optimize operational efficiency to improve profit margins",
      "Maintain current cash management strategy",
      "Increase investment in high-performing marketing channels"
    ]
  };
};

export const getAnalysisHistory = async (): Promise<any[]> => {
  await delay(400);
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
};

// Auth endpoints
export const login = async (email: string, password: string): Promise<{ user: User; token: string }> => {
  await delay(800);
  if (email === "demo@capitalcue.com" && password === "demo123") {
    return {
      user: sampleUser,
      token: "mock-jwt-token"
    };
  }
  throw new Error("Invalid credentials");
};

export const register = async (userData: any): Promise<{ user: User; token: string }> => {
  await delay(1000);
  return {
    user: {
      ...sampleUser,
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      userType: userData.userType
    },
    token: "mock-jwt-token"
  };
};