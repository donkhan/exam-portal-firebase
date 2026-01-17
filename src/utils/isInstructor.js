export function isInstructor(user) {
  if (!user) return false;

  const email = user.email?.toLowerCase();
  if (!email) return false;

  // TEMPORARY BOOTSTRAP LOGIC
  // Replace this later with custom claims or Firestore roles

  return email === "kamil.k@cmr.edu.in";
}
