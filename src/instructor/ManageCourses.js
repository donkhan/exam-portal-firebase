import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { db } from "../firebase";
import CourseTable from "./../components/CourseTable";

import { fetchCourses } from "../services/course.service";
import {
  confirmAndDeleteCourse,
  saveEditedCourse,
  createCourse,
} from "../actions/courseActions";

function ManageCourses() {
  const navigate = useNavigate();

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

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    setLoading(true);
    try {
      const list = await fetchCourses(db);
      setCourses(list);
    } catch (err) {
      console.error("Error fetching courses:", err);
      alert(
        "Unable to load courses.\n\n" +
          "Please check your internet connection and refresh the page."
      );
    } finally {
      setLoading(false);
    }
  };

  /* ---------- CRUD ACTIONS ---------- */

  const handleAdd = () =>
    createCourse({
      db,
      courseId: newId,
      courseName: newName,
      active: newActive,
      onSuccess: () => {
        setShowAdd(false);
        setNewId("");
        setNewName("");
        setNewActive(true);
        loadCourses();
      },
    });

  const handleDelete = (courseId) =>
    confirmAndDeleteCourse({
      db,
      courseId,
      onSuccess: loadCourses,
    });

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

  const saveEdit = (courseId) =>
    saveEditedCourse({
      db,
      courseId,
      courseName: editName,
      active: editActive,
      onSuccess: () => {
        cancelEdit();
        loadCourses();
      },
    });

  /* ---------- UI ---------- */

  

  return (
  <div style={styles.page}>
    <div style={styles.card}>
      <h2>Manage Courses</h2>

      <button
        onClick={() => navigate("/instructor")}
        style={{ marginBottom: "12px" }}
      >
        ← Back
      </button>

      <hr />

      <button onClick={() => setShowAdd(!showAdd)}>
        {showAdd ? "Cancel Add" : "Add Course"}
      </button>

      {showAdd && (
        <div style={{ marginTop: "10px" }}>
          {/* existing add-course inputs */}
        </div>
      )}

      <hr />

      {loading && <p>Loading courses...</p>}

      {!loading && courses.length === 0 && <p>No courses found.</p>}

      {!loading && (
        <CourseTable
          courses={courses}
          editingId={editingId}
          editName={editName}
          editActive={editActive}
          onEditStart={startEdit}
          onEditNameChange={setEditName}
          onEditActiveChange={setEditActive}
          onEditSave={saveEdit}
          onEditCancel={cancelEdit}
          onDelete={handleDelete}
          onViewQB={(course) =>
            navigate(`/instructor/courses/${course.id}/questions`)
          }
          onCreateExam={(course) =>
            navigate(`/instructor/exams?courseId=${course.id}`)
          }
          onSanitize={(course) =>
            navigate(`/instructor/courses/${course.id}/sanitize`)
          }
        />
      )}
    </div>
  </div>
);

}


const styles = {
  page: {
    minHeight: "100vh",
    background: "#f4f6f8",
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-start",
    paddingTop: "40px",
  },
  card: {
    width: "100%",
    maxWidth: "1100px",
    background: "#fff",
    padding: "24px",
    borderRadius: "8px",
    boxShadow: "0 6px 20px rgba(0,0,0,0.08)",
  },
};


export default ManageCourses;
