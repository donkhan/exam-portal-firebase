import { collection, addDoc, getDocs, where, query } from "firebase/firestore";
import { db } from "../firebase";

/**
 * Creates a new exam metadata entry.
 * Returns the created document reference.
 */
export async function createExam(examMeta) {
  if (!examMeta || !examMeta.exam_id) {
    throw new Error("Invalid exam metadata");
  }
}



/**
 * Tries to create an exam using exam_id as document ID.
 *
 * @returns {boolean}
 *   true  -> exam created successfully
 *   false -> exam_id already exists
 */
export async function createExamIfNotExists(examId, examMeta) {
  if (!examId) {
    throw new Error("examId is required");
  }
  const snap = await getDocs(
        query(collection(db, "exams_meta"), where("exam_id", "==", examId)),
  );
  if (!snap.empty) {
    return false; // exam_id already present
  }
 return await addDoc(collection(db, "exams_meta"), examMeta);
}
