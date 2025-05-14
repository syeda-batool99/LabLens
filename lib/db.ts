'use client';

import { db } from './firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  query, 
  where,
  serverTimestamp,
  Timestamp,
  DocumentReference,
  DocumentData
} from 'firebase/firestore';

// Define types for our data
export interface Report {
  id: string;
  userId: string;
  title: string;
  uploadDate: Timestamp;
  content: ReportContent;
  isPublic: boolean;
  analysis?: ReportAnalysis;
}

export interface ReportContent {
  testResults: TestResult[];
  patientInfo?: PatientInfo;
  doctorNotes?: string;
  labInfo?: LabInfo;
}

export interface TestResult {
  name: string;
  value: string | number;
  unit?: string;
  referenceRange?: string;
  flagged?: boolean;
}

export interface PatientInfo {
  name?: string;
  age?: number;
  gender?: string;
  patientId?: string;
}

export interface LabInfo {
  name?: string;
  date?: Timestamp;
  requestingDoctor?: string;
}

export interface ReportAnalysis {
  summary: string;
  abnormalResults: TestResult[];
  recommendations?: string[];
  createdAt: Timestamp | number;
}

// Add a new report
export const addReport = async (userId: string, reportData: Omit<Report, 'id' | 'uploadDate'>): Promise<string> => {
  try {
    const reportsRef = collection(db, 'reports');
    const newReportRef = doc(reportsRef);
    const reportWithMetadata = {
      ...reportData,
      id: newReportRef.id,
      userId,
      uploadDate: serverTimestamp(),
    };

    await setDoc(newReportRef, reportWithMetadata);
    return newReportRef.id;
  } catch (error) {
    console.error('Error adding report:', error);
    throw error;
  }
};

// Get a report by ID
export const getReport = async (reportId: string): Promise<Report | null> => {
  try {
    const reportRef = doc(db, 'reports', reportId);
    const reportSnap = await getDoc(reportRef);
    
    if (reportSnap.exists()) {
      return reportSnap.data() as Report;
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error getting report:', error);
    throw error;
  }
};

// Get all reports for a user
export const getUserReports = async (userId: string): Promise<Report[]> => {
  try {
    const reportsRef = collection(db, 'reports');
    const q = query(reportsRef, where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    
    const reports: Report[] = [];
    querySnapshot.forEach((doc) => {
      reports.push(doc.data() as Report);
    });
    
    return reports;
  } catch (error) {
    console.error('Error getting user reports:', error);
    throw error;
  }
};

// Update a report
export const updateReport = async (reportId: string, updates: Partial<Report>): Promise<void> => {
  try {
    const reportRef = doc(db, 'reports', reportId);
    await updateDoc(reportRef, updates);
  } catch (error) {
    console.error('Error updating report:', error);
    throw error;
  }
};

// Delete a report
export const deleteReport = async (reportId: string): Promise<void> => {
  try {
    const reportRef = doc(db, 'reports', reportId);
    await deleteDoc(reportRef);
  } catch (error) {
    console.error('Error deleting report:', error);
    throw error;
  }
};

// Get a public report by ID (for sharing)
export const getPublicReport = async (reportId: string): Promise<Report | null> => {
  try {
    const report = await getReport(reportId);
    
    if (report && report.isPublic) {
      return report;
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error getting public report:', error);
    throw error;
  }
};

// Add analysis to a report
export const addReportAnalysis = async (reportId: string, analysis: Omit<ReportAnalysis, 'createdAt'>): Promise<void> => {
  try {
    const reportRef = doc(db, 'reports', reportId);
    await updateDoc(reportRef, {
      analysis: {
        ...analysis,
        createdAt: serverTimestamp()
      }
    });
  } catch (error) {
    console.error('Error adding report analysis:', error);
    throw error;
  }
};