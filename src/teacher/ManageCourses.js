import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  setDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import QuestionBankManagement from "./QuestionBankManagement";
import ExamManagement from "./ExamManagement";

function ManageCourses({ onBack }) {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  /* ---------- EDIT STATE ---------- */
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editActive, setEditActive] = useState(true);

  /* ---------- ADD STATE ---------- */
  const [showAdd, setShowAdd] = useState(false);
  const [newId, setNewId] = useState("");
  const [newName, setNewName] = useState("");
  const [newActive, setNewActive] = useState(true);

  /* ---------- QUESTION BANK VIEW ---------- */
  // will store: { id, name }
  const [viewQBForCourse, setViewQBForCourse] = useState(null);

  /* ---------- CREATE EXAM VIEW ---------- */
  // will store: { id, name }
  const [createExamForCourse, setCreateExamForCourse] = useState(null);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const snapshot = await getDocs(collection(db, "courses"));
      const list = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));
      setCourses(list);
    } catch (err) {
      console.error("Error fetching courses:", err);
    } finally {
      setLoading(false);
    }
  };

  /* ---------- ADD COURSE ---------- */
  const handleAdd = async () => {
    if (!newId.trim() || !newName.trim()) {
      alert("Course ID and Course Name are required.");
      return;
    }

    const courseId = newId.trim().toUpperCase();

    try {
      await setDoc(doc(db, "courses", courseId), {
        course_id: courseId,
        course_name: newName.trim(),
        active: newActive,
      });

      setShowAdd(false);
      setNewId("");
      setNewName("");
      setNewActive(true);

      fetchCourses();
    } catch (err) {
      alert("Add failed (course may already exist).");
      console.error(err);
    }
  };

  /* ---------- DELETE COURSE ---------- */
  const handleDelete = async (courseId) => {
    const ok = window.confirm(
      `Are you sure you want to DELETE course "${courseId}"?\n\nThis cannot be undone.`,
    );
    if (!ok) return;

    try {
      await deleteDoc(doc(db, "courses", courseId));
      fetchCourses();
    } catch (err) {
      alert("Delete failed.");
      console.error(err);
    }
  };

  /* ---------- EDIT COURSE ---------- */
  const startEdit = (course) => {
    setEditingId(course.id);
    setEditName(course.course_name);
    setEditActive(course.active);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName("");
    setEditActive(true);
  };

  const saveEdit = async (courseId) => {
    try {
      await updateDoc(doc(db, "courses", courseId), {
        course_name: editName,
        active: editActive,
      });
      cancelEdit();
      fetchCourses();
    } catch (err) {
      alert("Update failed.");
      console.error(err);
    }
  };

  /* ---------- CREATE EXAM ---------- */
  if (createExamForCourse) {
    return (
      <ExamManagement
        preselectedCourseId={createExamForCourse.id}
        preselectedCourseName={createExamForCourse.name}
        onBack={() => setCreateExamForCourse(null)}
      />
    );
  }

  /* ---------- QUESTION BANK ---------- */
  if (viewQBForCourse) {
    return (
      <QuestionBankManagement
        courseId={viewQBForCourse.id}
        courseName={viewQBForCourse.name}
        onBack={() => setViewQBForCourse(null)}
      />
    );
  }

  /* ---------- COURSE LIST UI ---------- */
  return (
    <div>
      <h3>Manage Courses</h3>
      <button onClick={onBack}>← Back</button>
      <hr />

      <button onClick={() => setShowAdd(!showAdd)}>
        {showAdd ? "Cancel Add" : "Add Course"}
      </button>

      {showAdd && (
        <div style={{ marginTop: "10px" }}>
          <input
            placeholder="Course ID (e.g. ADBMS)"
            value={newId}
            onChange={(e) => setNewId(e.target.value)}
          />

          <input
            placeholder="Course Name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />

          <select
            value={newActive ? "true" : "false"}
            onChange={(e) => setNewActive(e.target.value === "true")}
          >
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>

          <button onClick={handleAdd}>Save</button>
        </div>
      )}

      <hr />

      {loading && <p>Loading courses...</p>}

      {!loading && courses.length === 0 && <p>No courses found.</p>}

      {!loading && courses.length > 0 && (
        <table border="1" cellPadding="8">
          <thead>
            <tr>
              <th>Course ID</th>
              <th>Course Name</th>
              <th>Active</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {courses.map((c) => (
              <tr key={c.id}>
                <td>{c.course_id}</td>

                <td>
                  {editingId === c.id ? (
                    <input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                    />
                  ) : (
                    c.course_name
                  )}
                </td>

                <td>
                  {editingId === c.id ? (
                    <select
                      value={editActive ? "true" : "false"}
                      onChange={(e) => setEditActive(e.target.value === "true")}
                    >
                      <option value="true">YES</option>
                      <option value="false">NO</option>
                    </select>
                  ) : c.active ? (
                    "YES"
                  ) : (
                    "NO"
                  )}
                </td>

                <td>
                  <button
                    onClick={() =>
                      setViewQBForCourse({
                        id: c.course_id,
                        name: c.course_name,
                      })
                    }
                    style={{ marginRight: "6px" }}
                  >
                    View Question Bank
                  </button>

                  <button
                    onClick={() =>
                      setCreateExamForCourse({
                        id: c.course_id,
                        name: c.course_name,
                      })
                    }
                    style={{ marginRight: "6px" }}
                  >
                    Create Exam
                  </button>

                  {editingId === c.id ? (
                    <>
                      <button onClick={() => saveEdit(c.id)}>Save</button>
                      <button onClick={cancelEdit}>Cancel</button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => startEdit(c)}>Edit</button>
                      <button
                        onClick={() => handleDelete(c.id)}
                        style={{ color: "red" }}
                      >
                        Delete
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default ManageCourses;
