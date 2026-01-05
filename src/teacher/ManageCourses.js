import { useEffect, useState } from "react";
import { db } from "../firebase";
import QuestionBankManagement from "./QuestionBankManagement";
import ExamManagement from "./ExamManagement";
import CourseTable from "./../components/CourseTable";

import { fetchCourses } from "../services/courseService";
import {
  confirmAndDeleteCourse,
  saveEditedCourse,
  createCourse,
} from "../actions/courseActions";

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
          "Please check your internet connection and refresh the page." +
          err,
      );
    } finally {
      setLoading(false);
    }
  };

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

  if (createExamForCourse) {
    return (
      <ExamManagement
        preselectedCourseId={createExamForCourse.id}
        preselectedCourseName={createExamForCourse.name}
        onBack={() => setCreateExamForCourse(null)}
      />
    );
  }

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
          onViewQB={setViewQBForCourse}
          onCreateExam={setCreateExamForCourse}
        />
      )}
    </div>
  );
}
export default ManageCourses;
