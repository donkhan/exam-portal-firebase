import { deleteDoc, doc } from "firebase/firestore";
import { db } from "../firebase";

export async function deleteAttempt(attemptId) {
   if (!attemptId) return;

  await deleteDoc(
    doc(db, "exams",attemptId)
  );
}
