import { collection, getDocs, updateDoc, setDoc, deleteDoc, doc } from "firebase/firestore";

export async function fetchCourses(db) {
  const snapshot = await getDocs(collection(db, "courses"));

  return snapshot.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  }));
}


export async function addCourse(db, { courseId, courseName, active }) {
  await setDoc(doc(db, "courses", courseId), {
    course_id: courseId,
    course_name: courseName,
    active,
  });
}

export async function updateCourse(db, courseId, { courseName, active }) {
  await updateDoc(doc(db, "courses", courseId), {
    course_name: courseName,
    active,
  });
}

export async function deleteCourse(db, courseId) {
  await deleteDoc(doc(db, "courses", courseId));
}