import { collection, getDocs } from "firebase/firestore";

/**
 * Fetch all courses from Firestore.
 * Returns: [{ id, course_id, course_name, active }]
 */
export async function fetchCourses(db) {
  const snapshot = await getDocs(collection(db, "courses"));

  return snapshot.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  }));
}
