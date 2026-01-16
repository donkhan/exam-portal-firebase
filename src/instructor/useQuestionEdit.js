import { useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";

/**
 * useQuestionEdit
 * ----------------
 * Encapsulates question edit state + logic
 */
export function useQuestionEdit(setQuestions) {
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});

  const startEdit = (question) => {
    setEditingId(question.id);
    setEditData({
      chapter: question.chapter,
      difficulty: question.difficulty || "",
      question_text: question.question_text,
      options: question.options || {},
      correct_answer: question.correct_answer || [],
      marks: question.marks,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditData({});
  };

  const saveEdit = async (questionId) => {
    try {
      await updateDoc(doc(db, "questions", questionId), {
        chapter: editData.chapter,
        difficulty: editData.difficulty,
        question_text: editData.question_text,
        options: editData.options,
        correct_answer: editData.correct_answer,
        marks: editData.marks,
      });

      // Update UI immediately
      setQuestions((prev) =>
        prev.map((q) =>
          q.id === questionId ? { ...q, ...editData } : q
        )
      );

      cancelEdit();
    } catch (err) {
      console.error(err);
      alert("Failed to update question");
    }
  };

  return {
    editingId,
    editData,
    setEditData,
    startEdit,
    cancelEdit,
    saveEdit,
  };
}
