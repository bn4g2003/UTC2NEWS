export interface SubjectScores {
  [subject: string]: number;
}

export interface PreferenceData {
  majorCode: string;
  admissionMethod: string;
  priority: number;
}

export interface ParsedStudentData {
  idCard: string;
  fullName: string;
  dateOfBirth: Date;
  email?: string;
  phone?: string;
  address?: string;
  priorityPoints: number;
  scores: SubjectScores;
  preferences?: PreferenceData[]; // Optional now
}

export interface ParsedPreferenceData {
  idCard: string;
  majorCode: string;
  priority: number;
  admissionMethod?: string;
  block?: string;
}
