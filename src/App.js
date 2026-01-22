import { BrowserRouter } from "react-router-dom";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";

import { ThemeProvider } from "./ThemeContext";
import "./themes.css";

import AppRoutes from "./routes/AppRoutes";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
  }, []);

  if (loading) return <p>Loading...</p>;

  return (
    <ThemeProvider>
      <BrowserRouter>
        <AppRoutes user={user} />
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
