import "./JsonPasteUpload.css";
import { useState, useEffect } from "react";



/**
 * JsonPasteUpload
 * ----------------
 * - Accepts raw JSON / JSONC text
 * - Strips comments
 * - Parses safely
 * - Validates structure
 * - Emits clean questions array
 */
export default function JsonPasteUpload({ onQuestionsReady, externalText,onClearExternalText }) {
 const [rawText, setRawText] = useState("");
  const [error, setError] = useState("");
  const [preview, setPreview] = useState(null);

  useEffect(() => {
  setRawText(externalText || "");
  setError("");
  setPreview(null);
}, [externalText]);


  // --- Remove // and /* */ comments (JSONC → JSON)
  const stripComments = (text) => {
    return text
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/\/\/.*$/gm, "");
  };

  // --- Validate schema minimally
  const validate = (data) => {
    if (!data || typeof data !== "object") {
      throw new Error("Root JSON must be an object");
    }

    if (!Array.isArray(data.questions)) {
      throw new Error("Missing or invalid 'questions' array");
    }
    data.questions.forEach((q, index) => {
      if (!q.question_text) {
        throw new Error(`Question ${index + 1}: missing question_text`);
      }
      if (!q.correct_answer) {
        q.is_sanitized = false;
      }
    });

  };

  const normalizeQuestions = (data) => {
  return data.questions.map((q) => ({
    ...q,
    chapter: q.chapter ?? data.chapter,
  }));
};


  // --- Handle Preview
  const handlePreview = () => {
    try {
      setError("");
      const clean = stripComments(rawText);
      const parsed = JSON.parse(clean);
      validate(parsed);
      const questions = normalizeQuestions(parsed);
      setPreview(questions);
    } catch (err) {
      setPreview(null);
      setError(err.message);
    }
  };

  // --- Confirm import
  const handleImport = () => {
    if (!preview) return;
    onQuestionsReady(preview);
    setRawText("");
    setPreview(null);
    onClearExternalText?.();
  };

  


  return (
    <div className="json-paste-box">
      <h3>Paste Questions (JSON)</h3>

      <textarea
        rows={12}
        placeholder="Paste JSON here..."
        value={rawText}
        onChange={(e) => setRawText(e.target.value)}
      />

      {error && <div className="error">{error}</div>}

      <div className="actions">
        <button onClick={handlePreview}>Preview</button>
        <button onClick={handleImport} disabled={!preview}>
          Import Questions
        </button>
      </div>

      {preview && (
        <div className="preview">
          <p>Previewing {preview.length} questions</p>
          <ul>
            {preview.slice(0, 5).map((q, i) => (
              <li key={i}>{q.question_text}</li>
            ))}
          </ul>
          {preview.length > 5 && <p>…and more</p>}
        </div>
      )}
    </div>
  );
}
