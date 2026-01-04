/**
 * handlePastedQuestions
 * ---------------------
 * Pure helper for handling pasted JSON questions
 */
export async function handlePastedQuestions({
  questions,
  selectedCourse,
  uploadQuestionsFromData,
  setStatus,
}) {
  console.log("Imported questions:", questions);
  if (!questions || !Array.isArray(questions)) {
    alert("Invalid pasted questions format");
    return;
  }
  const data = {
    course_id: selectedCourse,
    questions: questions,
  };
  try {
    setStatus("Uploading pasted questions...");
    await uploadQuestionsFromData({
      data,
      selectedCourse,
      setStatus,
    });
    setStatus("✅ Upload successful");
    return true;
  } catch (err) {
    console.error(err);
    alert("Error uploading pasted questions");
    setStatus("❌ Upload failed");
    return false;
  }
}
