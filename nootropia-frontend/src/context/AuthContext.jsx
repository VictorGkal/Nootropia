import { createContext, useContext, useState, useEffect } from "react";
import { getMe, setToken, clearToken, refresh } from "../services/api";

// create auth context to share user state across the app
const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  // on app load restore session if one exists
  useEffect(() => {
    setLoading(true);

    const restore = async () => {
      // see if there is been a session established
      const hasSession = localStorage.getItem("hasSession");

      // if no session stop loading and effect
      if (!hasSession) {
        setLoading(false);
        return;
      }

      // if there is a session
      try {
        // try to get access token via httpOnly refresh cookie
        const res = await refresh();
        const newAccessToken = res.data.access_token;

        // store access token in memory
        setToken(newAccessToken);

        // fetch and set current user data based on the new access token
        const currentUser = await getMe();
        setUser(currentUser.data);
      } catch {
        // on refresh error or others clear token in memory
        // clear session and user data
        clearToken();
        localStorage.removeItem("hasSession");
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    restore();
  }, []);

  // called after login
  // it saves access token in memory
  // marks that a session is made
  // sets user data based on the access token
  const loginUser = (token, userData) => {
    setToken(token);
    localStorage.setItem("hasSession", "true");
    setUser(userData);
  };

  // called after logout
  // clears access token in memory
  // marks that the session has ended
  // clears user data
  const logoutUser = () => {
    clearToken();
    localStorage.removeItem("hasSession");
    setUser(null);
  };

  // block rendering until auth state is resolved
  return (
    <AuthContext.Provider value={{ user, loading, loginUser, logoutUser }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
