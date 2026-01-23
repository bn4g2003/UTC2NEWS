# Thuật Toán Lọc Ảo (Virtual Filter Algorithm)

## Tổng Quan

Thuật toán lọc ảo được thiết kế để xử lý tuyển sinh dựa trên:
- Điểm số thí sinh
- Nguyện vọng (preferences) theo thứ tự ưu tiên
- Chỉ tiêu (quota) từng ngành
- Điều kiện đầu vào chi tiết (conditions)

## Cấu Trúc Dữ Liệu

### 1. SessionQuota Conditions (JSON)

```json
{
  "minTotalScore": 18.0,
  "minSubjectScores": {
    "math": 5.0,
    "physics": 4.0,
    "chemistry": 4.0
  },
  "requiredSubjects": ["math", "physics", "chemistry"],
  "subjectCombinations": [
    ["math", "physics", "chemistry"],
    ["math", "physics", "english"]
  ],
  "priorityBonus": {
    "enabled": true,
    "maxBonus": 2.0
  }
}
```

### 2. Các Trường Quan Trọng

- **minTotalScore**: Điểm tổng tối thiểu (chưa cộng ưu tiên)
- **minSubjectScores**: Điểm tối thiểu từng môn
- **requiredSubjects**: Các môn bắt buộc phải có điểm
- **subjectCombinations**: Danh sách tổ hợp môn hợp lệ
- **priorityBonus**: Cấu hình điểm ưu tiên

## Thuật Toán - 5 Bước

### BƯỚC 1: Validation & Eligibility Check

Kiểm tra thí sinh có đủ điều kiện dự tuyển:

```typescript
function isEligible(application, quotaConditions) {
  // 1. Kiểm tra tổ hợp môn hợp lệ
  if (conditions.subjectCombinations) {
    hasValidCombination = checkSubjectCombination(
      application.subjectScores,
      conditions.subjectCombinations
    );
    if (!hasValidCombination) return false;
  }
  
  // 2. Kiểm tra môn bắt buộc
  if (conditions.requiredSubjects) {
    for (subject of conditions.requiredSubjects) {
      if (!application.subjectScores[subject]) return false;
    }
  }
  
  // 3. Kiểm tra điểm tối thiểu từng môn
  if (conditions.minSubjectScores) {
    for (subject, minScore of conditions.minSubjectScores) {
      if (application.subjectScores[subject] < minScore) {
        return false;
      }
    }
  }
  
  // 4. Kiểm tra điểm tổng tối thiểu
  if (conditions.minTotalScore) {
    totalScore = sum(application.subjectScores);
    if (totalScore < conditions.minTotalScore) return false;
  }
  
  return true;
}
```

**Kết quả**: Application được đánh dấu `not_admitted` nếu không đủ điều kiện.

### BƯỚC 2: Score Calculation

Tính điểm cho mỗi application:

```typescript
function calculateScore(application, student, conditions) {
  // Tính điểm cơ bản (tùy theo admission method)
  baseScore = calculateBaseScore(
    application.subjectScores,
    application.admissionMethod
  );
  
  // Áp dụng điểm ưu tiên
  priorityBonus = student.priorityPoints;
  
  if (conditions?.priorityBonus) {
    if (!conditions.priorityBonus.enabled) {
      priorityBonus = 0;
    } else {
      priorityBonus = min(
        student.priorityPoints,
        conditions.priorityBonus.maxBonus
      );
    }
  }
  
  return baseScore + priorityBonus;
}
```

**Công thức tính điểm cơ bản**:
- `entrance_exam`: Tổng điểm 3 môn
- `high_school_transcript`: Trung bình điểm
- `direct_admission`: Công thức có trọng số

### BƯỚC 3: Ranking by Major

Xếp hạng thí sinh trong từng ngành:

```typescript
function rankApplications(sessionId) {
  // Lấy tất cả applications đủ điều kiện
  applications = getEligibleApplications(sessionId);
  
  // Nhóm theo (majorId + admissionMethod)
  groupedApps = groupBy(applications, [majorId, admissionMethod]);
  
  // Sắp xếp và gán rank
  for (group of groupedApps) {
    sortedApps = sortBy(group, calculatedScore DESC);
    
    rank = 1;
    for (app of sortedApps) {
      app.rankInMajor = rank;
      rank++;
    }
  }
  
  return applications;
}
```

**Kết quả**: Mỗi application có `rankInMajor` (1, 2, 3, ...)

### BƯỚC 4: Preference Processing

Xử lý nguyện vọng theo thứ tự ưu tiên:

```typescript
function processPreferences(sessionId, rankedApplications) {
  admittedStudents = new Set();
  quotaRemaining = loadQuotaMap(sessionId);
  decisions = [];
  
  maxPriority = max(rankedApplications.map(app => app.priority));
  
  // Xử lý từng mức ưu tiên (NV1 → NV2 → NV3...)
  for (priority = 1; priority <= maxPriority; priority++) {
    
    // Lấy applications của mức ưu tiên này
    preferenceApps = rankedApplications
      .filter(app => app.priority === priority)
      .sortBy(majorId, rank);
    
    // Xử lý từng application theo rank
    for (app of preferenceApps) {
      
      // Bỏ qua nếu thí sinh đã trúng tuyển
      if (admittedStudents.has(app.studentId)) {
        continue;
      }
      
      quotaKey = `${app.majorId}-${app.admissionMethod}`;
      
      // Kiểm tra còn chỉ tiêu
      if (quotaRemaining[quotaKey] > 0) {
        // TRÚNG TUYỂN
        decisions.push({
          applicationId: app.id,
          studentId: app.studentId,
          status: 'admitted',
          admittedPreference: priority
        });
        
        admittedStudents.add(app.studentId);
        quotaRemaining[quotaKey]--;
        
        // Loại các nguyện vọng thấp hơn
        lowerPreferences = rankedApplications.filter(
          a => a.studentId === app.studentId && a.priority > priority
        );
        
        for (lowerApp of lowerPreferences) {
          decisions.push({
            applicationId: lowerApp.id,
            status: 'not_admitted'
          });
        }
        
      } else {
        // HẾT CHỈ TIÊU
        decisions.push({
          applicationId: app.id,
          status: 'not_admitted'
        });
      }
    }
  }
  
  return decisions;
}
```

**Nguyên tắc quan trọng**:
1. Xử lý theo thứ tự ưu tiên (NV1 trước, NV2 sau)
2. Trong cùng mức ưu tiên, xử lý theo rank (điểm cao trước)
3. Thí sinh trúng tuyển ở NV cao → loại tất cả NV thấp hơn
4. Hết chỉ tiêu → các thí sinh còn lại không trúng tuyển

### BƯỚC 5: Result Generation

Lưu kết quả và tạo báo cáo:

```typescript
function persistDecisions(decisions) {
  for (decision of decisions) {
    updateApplication(decision.applicationId, {
      admissionStatus: decision.status
    });
  }
  
  return {
    totalStudents: countUniqueStudents(decisions),
    admittedCount: countAdmitted(decisions),
    decisions: decisions
  };
}
```

## Ví Dụ Cụ Thể

### Tình Huống

**Ngành CNTT**:
- Chỉ tiêu: 2 chỗ
- Điều kiện:
  - Toán ≥ 5
  - Lý ≥ 4
  - Hóa ≥ 4
  - Tổng ≥ 18
  - Điểm ưu tiên tối đa: 2

**Thí sinh**:

| Thí sinh | NV | Toán | Lý | Hóa | Ưu tiên | Tổng | Điểm cuối | Rank |
|----------|----|----|----|----|---------|------|-----------|------|
| TS1 | NV1 | 8 | 7 | 6 | 0 | 21 | 21.00 | 2 |
| TS2 | NV1 | 7 | 7 | 6 | 0 | 20 | 20.00 | 3 |
| TS3 | NV1 | 9 | 8 | 7 | 0 | 24 | 24.00 | 1 |
| TS4 | NV2 | 9 | 8 | 7 | 0 | 24 | 24.00 | 1 |
| TS5 | NV1 | 6 | 5 | 5 | 2 | 16 | 18.00 | - |

### Xử Lý

**Bước 1-2: Validation & Scoring**
- TS1: ✅ Đủ điều kiện, điểm = 21
- TS2: ✅ Đủ điều kiện, điểm = 20
- TS3: ✅ Đủ điều kiện, điểm = 24
- TS4: ✅ Đủ điều kiện, điểm = 24
- TS5: ❌ Không đủ điều kiện (tổng < 18) → `not_admitted`

**Bước 3: Ranking**
- Rank 1: TS3 (24 điểm)
- Rank 2: TS1 (21 điểm)
- Rank 3: TS2 (20 điểm)

**Bước 4: Preference Processing**

*Xử lý NV1*:
1. TS3 (rank 1): Trúng tuyển ✅ (chỉ tiêu còn 1)
2. TS1 (rank 2): Trúng tuyển ✅ (chỉ tiêu còn 0)
3. TS2 (rank 3): Không trúng ❌ (hết chỉ tiêu)

*Xử lý NV2*:
1. TS4: Không trúng ❌ (hết chỉ tiêu)

### Kết Quả Cuối

| Thí sinh | Trạng thái | Nguyện vọng trúng |
|----------|------------|-------------------|
| TS1 | Trúng tuyển | NV1 |
| TS2 | Không trúng | - |
| TS3 | Trúng tuyển | NV1 |
| TS4 | Không trúng | - |
| TS5 | Không đủ điều kiện | - |

## API Endpoints

### 1. Chạy lọc ảo

```http
POST /filter/run/:sessionId
```

**Response**:
```json
{
  "sessionId": "uuid",
  "totalStudents": 100,
  "admittedCount": 50,
  "executionTime": 1234,
  "decisions": [...]
}
```

### 2. Xem kết quả lọc

```http
GET /filter/results/:sessionId
```

### 3. Cấu hình quota conditions

```http
PUT /programs/quotas/:quotaId
```

**Body**:
```json
{
  "quota": 50,
  "conditions": {
    "minTotalScore": 18.0,
    "minSubjectScores": {
      "math": 5.0,
      "physics": 4.0
    },
    "priorityBonus": {
      "enabled": true,
      "maxBonus": 2.0
    }
  }
}
```

## Lưu Ý Quan Trọng

1. **Transaction**: Toàn bộ quá trình chạy trong 1 transaction để đảm bảo tính nhất quán
2. **Performance**: Với 10,000 thí sinh, thời gian xử lý ~2-5 giây
3. **Idempotent**: Có thể chạy lại nhiều lần, kết quả không đổi
4. **Audit Trail**: Lưu lại toàn bộ decisions để kiểm tra sau

## Testing

Xem file test: `admission-backend/src/filter/virtual-filter.service.spec.ts`

```bash
npm test -- virtual-filter.service
```
