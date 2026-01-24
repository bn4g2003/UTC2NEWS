export type RejectionReason =
  | 'not_eligible_basic' // Không đủ điều kiện cơ bản (thiếu môn, điểm 0)
  | 'not_eligible_quota' // Không đủ điều kiện chỉ tiêu (điểm sàn, điểm tối thiểu)
  | 'below_quota_cutoff' // Điểm thấp hơn điểm chuẩn (hết chỉ tiêu)
  | 'admitted_higher_priority' // Đã đậu nguyện vọng ưu tiên cao hơn
  | null; // Đậu

export interface AdmissionDecision {
  applicationId: string;
  studentId: string;
  majorId: string;
  majorName?: string;
  admissionMethod: string;
  preferencePriority: number;
  calculatedScore: number;
  rankInMajor: number | null;
  status: 'admitted' | 'not_admitted';
  rejectionReason: RejectionReason;
  admittedPreference: number | null;
}

export interface FilterResult {
  sessionId: string;
  totalStudents: number;
  admittedCount: number;
  executionTime: number;
  decisions: AdmissionDecision[];
}
