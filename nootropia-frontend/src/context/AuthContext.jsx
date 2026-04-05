import { createContext, useContext, useState, useEffect } from "react";
import { getMe, setToken, clearToken, refresh } from "../services/api";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);

    const restore = async () => {
      const hasSession = localStorage.getItem("hasSession");
      if (!hasSession) {
        setLoading(false);
        return;
      }

      try {
        const res = await refresh();
        const newAccessToken = res.data.access_token;
        setToken(newAccessToken);
        const currentUser = await getMe();
        setUser(currentUser.data);
      } catch {
        clearToken();
        localStorage.removeItem("hasSession");
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    restore();
  }, []);

  const loginUser = (token, userData) => {
    setToken(token);
    localStorage.setItem("hasSession", "true");
    setUser(userData);
  };

  const logoutUser = () => {
    clearToken();
    localStorage.removeItem("hasSession");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginUser, logoutUser }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
