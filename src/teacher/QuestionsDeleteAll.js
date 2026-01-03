import React from "react";
import { collection, getDocs, query, where, deleteDoc, doc } from "firebase/firestore";
import { db } from "../firebase";

/**
 * QuestionsDeleteAll
 * ------------------
 * Handles:
 * - Confirmation flow
 * - Firestore deletion
 * - UI button
 */
function QuestionsDeleteAll({ selectedCourse, onAfterDelete }) {
  const deleteAllQuestions = async () => {
    if (!selectedCourse) {
      alert("Please select a course first");
      return;
    }

    const confirm1 = window.confirm(
      `Are you sure you want to DELETE ALL questions for course ${selectedCourse}?`
    );
    if (!confirm1) return;

    const confirm2 = window.prompt(
      `Type DELETE to confirm permanent deletion of ALL questions for ${selectedCourse}`
    );
    if (confirm2 !== "DELETE") {
      alert("Deletion cancelled");
      return;
    }

    try {
      const q = query(
        collection(db, "questions"),
        where("course_id", "==", selectedCourse)
      );

      const snap = await getDocs(q);

      let count = 0;
      for (const docSnap of snap.docs) {
        await deleteDoc(doc(db, "questions", docSnap.id));
        count++;
      }

      alert(`❌ ${count} questions permanently deleted`);

      if (onAfterDelete) {
        onAfterDelete();
      }
    } catch (err) {
      console.error(err);
      alert("Failed to delete questions");
    }
  };

  if (!selectedCourse) return null;

  return (
    <button
      onClick={deleteAllQuestions}
      style={{
        background: "#b00020",
        color: "white",
        padding: "8px 12px",
        border: "none",
        cursor: "pointer",
      }}
    >
      🚨 Delete ALL Questions for {selectedCourse}
    </button>
  );
}

export default QuestionsDeleteAll;
