import { addDoc, collection } from "firebase/firestore";
import { db } from "../../firebase";

/**
 * uploadQuestionsFromData
 * -----------------------
 * Domain logic for bulk question upload
 */
export async function uploadQuestionsFromData({
  data,
  selectedCourse,
  setStatus,
  
}) {
  const effectiveCourseId = selectedCourse || data.course_id;

  if (!effectiveCourseId) {
    alert("Please select a course or provide course_id in the JSON.");
    setStatus("❌ Upload failed: Course not specified");
    return false;
  }

  if (!Array.isArray(data.questions)) {
    alert("Invalid JSON format");
    return false;
  }

  let count = 0;

  for (const q of data.questions) {
    if (
      !q.chapter ||
      !q.question_type ||
      !q.question_text ||
      !q.correct_answer
    ) {
      alert("Invalid question entry detected " + q.question_no);
      setStatus("❌ Failed to read");
      return;
    }
    if(!q.marks){
      q.marks = 1;
    }
    if(!q.difficulty){
      q.difficulty = 'EASY';
    }
    if(q.question_type === 'NUMERICAL') q.question_type = 'FILL_BLANK';

    await addDoc(collection(db, "questions"), {
      course_id: effectiveCourseId,
      question_id: crypto.randomUUID(),
      chapter: q.chapter.trim(), // defensive normalization
      difficulty: q.difficulty,
      question_type: q.question_type,
      question_text: q.question_text,
      options: q.options || {},
      correct_answer: q.correct_answer || [],
      marks: q.marks,
      created_at: Date.now(),
    });

    count++;
  }

  setStatus(`✅ ${count} questions uploaded successfully`);
  return true;
 
}
