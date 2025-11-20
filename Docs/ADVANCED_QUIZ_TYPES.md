# 📝 Advanced Quiz Types - Feature Documentation

## Overview
Enhanced quiz system supporting multiple question types for comprehensive learning assessment.

## Question Types

### 1. Single Choice (Traditional Multiple Choice)
- **One correct answer** from multiple options
- Radio button selection
- Classic quiz format

**Backend Structure:**
```java
{
  "type": "SINGLE_CHOICE",
  "question": "What is 2 + 2?",
  "options": ["3", "4", "5", "6"],
  "correctOptionIndex": 1,
  "points": 1
}
```

### 2. Multiple Choice (Multi-Select)
- **Multiple correct answers**
- Checkbox selection
- All correct options must be selected

**Backend Structure:**
```java
{
  "type": "MULTIPLE_CHOICE",
  "question": "Which are programming languages?",
  "options": ["Java", "HTML", "Python", "CSS"],
  "correctOptionIndices": [0, 2],
  "points": 2
}
```

### 3. True/False
- **Boolean questions**
- Simple true or false selection
- Quick comprehension checks

**Backend Structure:**
```java
{
  "type": "TRUE_FALSE",
  "question": "Java is an object-oriented language",
  "correctAnswer": true,
  "points": 1
}
```

### 4. Code Evaluation
- **Code writing questions**
- Syntax-highlighted code editor
- Expected output validation
- Supports multiple programming languages

**Backend Structure:**
```java
{
  "type": "CODE_EVALUATION",
  "question": "Write a function to calculate factorial",
  "programmingLanguage": "java",
  "sampleCode": "public int factorial(int n) {\n  // Your code here\n}",
  "expectedOutput": "factorial(5) = 120",
  "testCases": "[{\"input\":5,\"output\":120}]",
  "points": 5
}
```

## Backend Changes

### Entity: Questions.java
```java
public enum QuestionType {
    SINGLE_CHOICE,      // One correct answer
    MULTIPLE_CHOICE,    // Multiple correct answers
    TRUE_FALSE,         // True or False
    CODE_EVALUATION     // Code writing
}
```

**New Fields:**
- `type` - QuestionType enum
- `correctOptionIndices` - List<Integer> for multi-select
- `correctAnswer` - Boolean for true/false
- `testCases` - JSON string for code tests
- `expectedOutput` - Expected code result
- `sampleCode` - Starter code template
- `programmingLanguage` - java, python, javascript, etc.
- `points` - Question weight
- `explanation` - Hint/explanation text

### DTO: QuizzSubmissionDTO.java
```java
{
  "answers": {},  // Single choice & true/false
  "multipleChoiceAnswers": {},  // Multi-select answers
  "codeAnswers": {}  // Code submissions
}
```

### Service: QuizzService.java
Enhanced `submitQuizz()` method with type-specific evaluation:
- Single choice: String matching
- Multiple choice: List comparison
- True/False: Boolean comparison
- Code evaluation: Basic validation (expandable)

## Frontend Changes

### Component: EnhancedQuizPage.jsx
New comprehensive quiz component supporting all question types.

**Features:**
- Type-specific rendering
- Progress tracking per question type
- Code editor with syntax highlighting
- Hint/explanation toggling
- Points-based scoring

**State Management:**
```javascript
const [answers, setAnswers] = useState({});  // Single & T/F
const [multipleChoiceAnswers, setMultipleChoiceAnswers] = useState({});
const [codeAnswers, setCodeAnswers] = useState({});
```

### Routing
- Primary: `/chapters/:chapterId/quiz` - EnhancedQuizPage
- Legacy: `/chapters/:chapterId/quiz/simple` - Original QuizPage

## Usage Guide

### For Instructors

**Creating Different Question Types:**

1. **Single Choice Question:**
   ```json
   POST /admin/chapters/{chapterId}/quizzes/{quizId}/questions
   {
     "type": "SINGLE_CHOICE",
     "question": "What is the capital of France?",
     "options": ["London", "Paris", "Berlin", "Rome"],
     "correctOptionIndex": 1,
     "points": 1
   }
   ```

2. **Multiple Choice Question:**
   ```json
   {
     "type": "MULTIPLE_CHOICE",
     "question": "Select all prime numbers:",
     "options": ["2", "4", "5", "9", "11"],
     "correctOptionIndices": [0, 2, 4],
     "points": 2
   }
   ```

3. **True/False Question:**
   ```json
   {
     "type": "TRUE_FALSE",
     "question": "The Earth is flat",
     "correctAnswer": false,
     "points": 1,
     "explanation": "The Earth is a sphere"
   }
   ```

4. **Code Question:**
   ```json
   {
     "type": "CODE_EVALUATION",
     "question": "Implement a function to reverse a string",
     "programmingLanguage": "python",
     "sampleCode": "def reverse_string(s):\n    # Your code here\n    pass",
     "expectedOutput": "reverse_string('hello') == 'olleh'",
     "points": 5
   }
   ```

### For Students

**Taking Quizzes:**
1. Navigate to chapter
2. Click "Take Quiz"
3. Answer all questions:
   - **Single Choice**: Select one option
   - **Multiple Choice**: Check all correct answers
   - **True/False**: Choose true or false
   - **Code**: Write code in editor
4. Review progress indicator
5. Submit when all answered

**Scoring:**
- Each question has configurable points
- Total score = sum of earned points
- Pass threshold: 50% of total points
- Detailed results shown after submission

## API Endpoints

### Quiz Submission
```http
POST /api/v1/quizzes/{quizId}/submit
Content-Type: application/json

{
  "userId": "user123",
  "courseId": "course456",
  "chapterId": "chapter789",
  "answers": {
    "question1": "Option B"
  },
  "multipleChoiceAnswers": {
    "question2": [0, 2, 3]
  },
  "codeAnswers": {
    "question3": "public int sum(int a, int b) { return a + b; }"
  }
}
```

## Code Evaluation

### Current Implementation
Basic validation checking:
- Code is not empty
- Contains expected keywords
- Contains expected output patterns

### Production Recommendations
Integrate with code execution services:
- **Judge0**: https://judge0.com/
- **Piston API**: https://github.com/engineer-man/piston
- **HackerRank API**
- **LeetCode API**

**Security Considerations:**
- Use sandboxed execution environments
- Set time limits
- Limit memory usage
- Prevent infinite loops
- Block system calls

## Points System

### Configurable Weights
- Default: 1 point per question
- Can assign higher points to difficult questions
- Example distribution:
  - True/False: 1 point
  - Single Choice: 1-2 points
  - Multiple Choice: 2-3 points
  - Code Evaluation: 5-10 points

### Pass Criteria
- Pass: >= 50% of total points
- Can be configured per quiz
- Shows percentage and raw score

## Future Enhancements

### Planned Features
1. **Fill-in-the-blank questions**
2. **Drag-and-drop ordering**
3. **Image-based questions**
4. **Audio/Video responses**
5. **Timed quizzes**
6. **Randomized question order**
7. **Question pools/banks**
8. **Partial credit for multi-select**
9. **Code auto-completion**
10. **Real-time code execution**

### Code Evaluation Enhancements
- Syntax highlighting themes
- Multiple test cases display
- Performance metrics
- Code quality scoring
- Plagiarism detection
- Language-specific linting

## Testing

### Backend Tests
```bash
cd lms-backend
./mvnw test -Dtest=QuizzServiceTest
```

### Frontend Tests
```bash
cd lcm-frontend
npm test -- EnhancedQuizPage.test.jsx
```

## Migration

### Existing Quizzes
- Old quizzes automatically treated as SINGLE_CHOICE
- No data migration required
- Backward compatible with original QuizPage

### Upgrade Path
1. System continues working with old format
2. New quizzes can use enhanced types
3. Admin can edit old quizzes to add types

## Performance

### Optimizations
- Questions cached in memory
- Code editor lazy-loaded
- Results calculated server-side
- Progress saved in localStorage

### Scalability
- Supports 100+ questions per quiz
- Code answers limited to 10KB
- Submission batched for large quizzes

## Security

### Input Validation
- All inputs sanitized
- Code injection prevention
- XSS protection
- SQL injection blocked

### Authentication
- Firebase JWT required
- CSRF disabled (stateless API)
- Rate limiting on submissions

## Documentation Links

- **Backend API**: `/swagger-ui/index.html`
- **Entity Documentation**: `Questions.java`, `QuizzSubmissionDTO.java`
- **Frontend Component**: `EnhancedQuizPage.jsx`
- **Service Logic**: `QuizzService.java`

---

**Feature Status:** ✅ **Implemented**
**Version:** 1.0.0
**Last Updated:** November 20, 2025
