import { useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebase";

/**
 * useQuestions
 * ------------
 * Centralized question state + loader
 */
export function useQuestions() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadQuestions = async (courseId) => {
    if (!courseId) {
      setQuestions([]);
      return;
    }

    setLoading(true);

    const q = query(
      collection(db, "questions"),
      where("course_id", "==", courseId)
    );

    const snap = await getDocs(q);
    const list = snap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    setQuestions(list);
    setLoading(false);
  };

  return {
    questions,
    loading,
    setQuestions,   // needed for edit/delete hooks
    loadQuestions,  // SAME function, just moved
  };
}
