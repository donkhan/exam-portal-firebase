import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebase";

/**
 * Returns a sorted list of unique chapter names
 * for a given course, derived from questions.
 */
export async function getChaptersForCourse(courseId) {
  if (!courseId) return [];
  const q = query(
    collection(db, "questions"),
    where("course_id", "==", courseId)
  );
  const snap = await getDocs(q);
  const chapters = [
    ...new Set(
      snap.docs
        .map((d) => d.data().chapter)
        .filter(Boolean)
        .map((ch) => ch.trim())
    ),
  ];
  return chapters.sort();
}
