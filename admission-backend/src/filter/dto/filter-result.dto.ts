export interface AdmissionDecision {
  applicationId: string;
  studentId: string;
  majorId: string;
  status: 'admitted' | 'not_admitted';
  admittedPreference: number | null;
}

export interface FilterResult {
  sessionId: string;
  totalStudents: number;
  admittedCount: number;
  executionTime: number;
  decisions: AdmissionDecision[];
}
