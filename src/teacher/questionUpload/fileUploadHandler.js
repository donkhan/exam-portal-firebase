import { stripJsonComments } from "../../utils/jsonutils";

/**
 * handleQuestionFileUpload
 * ------------------------
 * Pure helper to process JSON question file upload
 */
export async function handleQuestionFileUpload({
  event,
  setStatus,
  fileInputRef,
}) {
  const file = event.target.files[0];
  if (!file) return;

  try {
    setStatus("Reading file...");
    const text = await file.text();
    setStatus("✅ File read successfully");
    return text;
  } catch (err) {
    console.error(err);
    alert("Error uploading questions: " + err.message);
    setStatus("❌ Upload failed");
    return false;
  } finally {
    if (fileInputRef?.current) {
      fileInputRef.current.value = "";
    }
  }
}
