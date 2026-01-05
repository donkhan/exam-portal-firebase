import { deleteCourse, updateCourse, addCourse } from "../services/course.service";

export async function confirmAndDeleteCourse({
  db,
  courseId,
  onSuccess,
}) {
  const ok = window.confirm(
    `Are you sure you want to DELETE course "${courseId}"?\n\nThis cannot be undone.`
  );

  if (!ok) return;

  try {
    await deleteCourse(db, courseId);
    if (onSuccess) onSuccess();
  } catch (err) {
    console.error("Failed to delete course:", err);
    alert("Delete failed. Check console for details.");
  }
}

export async function saveEditedCourse({
  db,
  courseId,
  courseName,
  active,
  onSuccess,
}) {
  if (!courseName || !courseName.trim()) {
    alert("Course name cannot be empty.");
    return;
  }

  try {
    await updateCourse(db, courseId, {
      courseName: courseName.trim(),
      active,
    });

    if (onSuccess) onSuccess();
  } catch (err) {
    console.error("Failed to update course:", err);
    alert("Update failed. Check console for details.");
  }
}

export async function createCourse({
  db,
  courseId,
  courseName,
  active,
  onSuccess,
}) {
  if (!courseId || !courseName) {
    alert("Course ID and Course Name are required.");
    return;
  }
  const normalizedId = courseId.trim().toUpperCase();
  try {
    await addCourse(db, {
      courseId: normalizedId,
      courseName: courseName.trim(),
      active,
    });

    if (onSuccess) onSuccess();
  } catch (err) {
    console.error("Failed to add course:", err);
    alert(
      "Failed to add course.\n\n" +
      "Possible reasons:\n" +
      "- Course ID already exists\n" +
      "- Network issue\n\n" +
      "Check console for details."
    );
  }
}

