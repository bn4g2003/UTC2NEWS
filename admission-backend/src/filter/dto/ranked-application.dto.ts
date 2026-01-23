export interface RankedApplication {
  applicationId: string;
  studentId: string;
  majorId: string;
  admissionMethod: string;
  priority: number;
  calculatedScore: number;
  rank: number;
}
