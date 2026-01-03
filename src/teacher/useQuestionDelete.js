import { doc, deleteDoc } from "firebase/firestore";
import { db } from "../firebase";

/**
 * useQuestionDelete
 * ------------------
 * Encapsulates single-question delete logic
 */
export function useQuestionDelete(setQuestions) {
  const deleteSingleQuestion = async (questionId) => {
    const ok = window.confirm(
      "Are you sure you want to DELETE this question?\n\nThis cannot be undone."
    );

    if (!ok) return;

    try {
      await deleteDoc(doc(db, "questions", questionId));

      // Update UI immediately without reload
      setQuestions((prev) =>
        prev.filter((q) => q.id !== questionId)
      );
    } catch (err) {
      console.error(err);
      alert("Failed to delete question");
    }
  };

  return { deleteSingleQuestion };
}
