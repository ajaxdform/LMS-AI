# Quiz Management Fix

## Problem
The quiz page was going blank when trying to add a quiz. The frontend was treating quizzes as an array of multiple quiz objects, but the backend has a different structure where there is ONE quiz per topic, and that quiz contains an array of questions.

## Backend Structure
```java
// Quizz entity
{
  id: String,
  title: String,
  topicId: String,
  question: List<Questions>  // Array of questions (note: field name is "question" but it's plural)
}

// Questions entity
{
  id: String,
  question: String,
  options: List<String>,
  correctOptionIndex: int
}
```

## Frontend Changes

### State Management
**Before:**
```javascript
const [quizzes, setQuizzes] = useState([]);  // Array of quizzes
```

**After:**
```javascript
const [quiz, setQuiz] = useState(null);       // Single quiz object
const [questions, setQuestions] = useState([]); // Questions from quiz.question
```

### New Workflow
1. **Create Quiz**: First create the quiz container for the topic (only once per topic)
2. **Add Questions**: Add questions to the quiz's question array
3. **Edit Questions**: Update individual questions within the quiz
4. **Delete Questions**: Remove questions from the quiz's question array
5. **Delete Quiz**: Remove the entire quiz with all questions

### API Endpoints Used
- `POST /admin/topics/{topicId}/quizzes` - Create quiz with title and empty questions array
- `PUT /admin/quizzes/{quizId}` - Update quiz (used to add/edit/delete questions)
- `DELETE /admin/quizzes/{quizId}` - Delete entire quiz
- `GET /topics/{topicId}/quizzes` - Get quiz for topic (returns single quiz or null)

### Key Implementation Details

**Question Management:**
Since there's no direct API for individual question CRUD, we update the entire quiz's question array:
- **Add Question**: Append to questions array, then PUT to update quiz
- **Edit Question**: Replace question in array, then PUT to update quiz  
- **Delete Question**: Filter out question from array, then PUT to update quiz

**UI Flow:**
1. If no quiz exists → Show "Create Quiz" button
2. After quiz created → Show "Add Question" button and question list
3. Questions displayed as cards with edit/delete buttons
4. Form for adding/editing questions

## Files Modified

### `AdminQuizzes.jsx`
- Changed state from array to single object + questions array
- Updated `fetchTopicAndQuiz()` to handle single quiz response
- Added `createQuizForTopic()` to create quiz container
- Updated `handleSubmit()` to add/edit questions via quiz update
- Updated `handleDeleteQuestion()` to remove from array and update quiz
- Added `handleDeleteQuiz()` to delete entire quiz
- Complete UI rewrite to show quiz status and questions list
- Added toast notifications and confirmation dialogs

## Features Added
✅ Toast notifications for all operations
✅ Confirmation dialogs for delete actions
✅ Proper error handling with user-friendly messages
✅ Loading states during operations
✅ Empty state messages for no quiz/no questions
✅ Question counter in header
✅ Clean breadcrumb navigation

## Testing Checklist
- [ ] Create quiz for topic
- [ ] Add first question to quiz
- [ ] Add multiple questions
- [ ] Edit existing question
- [ ] Delete individual question
- [ ] Delete entire quiz
- [ ] Verify toast notifications appear
- [ ] Verify confirmation dialogs work
- [ ] Check empty states display correctly
- [ ] Verify navigation breadcrumbs work
