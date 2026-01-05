function CourseTable({
  courses,
  editingId,
  editName,
  editActive,
  onEditStart,
  onEditNameChange,
  onEditActiveChange,
  onEditSave,
  onEditCancel,
  onDelete,
  onViewQB,
  onCreateExam,
}) {
  if (!courses || courses.length === 0) {
    return <p>No courses found.</p>;
  }

  return (
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
                  onChange={(e) => onEditNameChange(e.target.value)}
                />
              ) : (
                c.course_name
              )}
            </td>

            <td>
              {editingId === c.id ? (
                <select
                  value={editActive ? "true" : "false"}
                  onChange={(e) =>
                    onEditActiveChange(e.target.value === "true")
                  }
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
                  onViewQB({
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
                  onCreateExam({
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
                  <button onClick={() => onEditSave(c.id)}>Save</button>
                  <button onClick={onEditCancel}>Cancel</button>
                </>
              ) : (
                <>
                  <button onClick={() => onEditStart(c)}>Edit</button>
                  <button
                    onClick={() => onDelete(c.course_id)}
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
  );
}

export default CourseTable;
