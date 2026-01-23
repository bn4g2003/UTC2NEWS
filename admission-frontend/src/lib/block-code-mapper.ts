/**
 * Map subject combinations to Vietnamese block codes
 * @param subjects - Array of subject names
 * @returns Block code (A00, A01, etc.) or original string if not found
 */
export function getBlockCode(subjects: string[] | string): string {
  // If already a string, return as is
  if (typeof subjects === 'string') {
    return subjects;
  }

  // Sort subjects alphabetically and join with dash
  const sorted = [...subjects].sort().join('-');

  // Mapping table for Vietnamese admission blocks
  const blockMap: Record<string, string> = {
    // A blocks (Science/Math focus)
    'chemistry-math-physics': 'A00',
    'english-math-physics': 'A01',
    
    // B blocks (Biology focus)
    'biology-chemistry-math': 'B00',
    
    // C blocks (Social sciences)
    'geography-history-literature': 'C00',
    
    // D blocks (Math + Language)
    'english-literature-math': 'D01',
    'chemistry-english-math': 'D07',
    'biology-english-math': 'D08',
    'english-geography-math': 'D09',
    'english-history-math': 'D10',
  };

  return blockMap[sorted] || sorted;
}

/**
 * Get block code label with description
 * @param blockCode - Block code (A00, A01, etc.)
 * @returns Label with subjects
 */
export function getBlockLabel(blockCode: string): string {
  const blockLabels: Record<string, string> = {
    'A00': 'A00 (Toán, Lý, Hóa)',
    'A01': 'A01 (Toán, Lý, Anh)',
    'B00': 'B00 (Toán, Hóa, Sinh)',
    'C00': 'C00 (Văn, Sử, Địa)',
    'D01': 'D01 (Toán, Văn, Anh)',
    'D07': 'D07 (Toán, Hóa, Anh)',
    'D08': 'D08 (Toán, Sinh, Anh)',
    'D09': 'D09 (Toán, Địa, Anh)',
    'D10': 'D10 (Toán, Sử, Anh)',
  };

  return blockLabels[blockCode] || blockCode;
}

/**
 * Get subjects from block code
 * @param blockCode - Block code (A00, A01, etc.)
 * @returns Array of subject names
 */
export function getSubjectsFromBlock(blockCode: string): string[] {
  const blockSubjects: Record<string, string[]> = {
    'A00': ['math', 'physics', 'chemistry'],
    'A01': ['math', 'physics', 'english'],
    'B00': ['math', 'chemistry', 'biology'],
    'C00': ['literature', 'history', 'geography'],
    'D01': ['math', 'literature', 'english'],
    'D07': ['math', 'chemistry', 'english'],
    'D08': ['math', 'biology', 'english'],
    'D09': ['math', 'geography', 'english'],
    'D10': ['math', 'history', 'english'],
  };

  return blockSubjects[blockCode] || [];
}
