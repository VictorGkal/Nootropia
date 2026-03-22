import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import SearchBar from "./SearchBar";

function Navbar({ onSearch }) {
  const navigate = useNavigate();
  const { user, logoutUser } = useAuth();
  const [search, setSearch] = useState("");

  const handleSearch = (e) => {
    setSearch(e.target.value);
    if (onSearch) {
      onSearch(e.target.value);
    }
  };

  const handleLogout = () => {
    logoutUser();
    navigate("/");
  };

  return (
    <nav className="w-full bg-gray-900/80 backdrop-blur-md border-b border-white/10 px-8 py-4 flex flex-row items-center justify-between gap-6 sticky top-0 z-50">
      {/* Left — Logo */}
      <button
        onClick={() => navigate("/feed")}
        className="text-purple-400 text-2xl font-mono font-bold hover:text-purple-300 transition duration-200 whitespace-nowrap"
      >
        Nootropia
      </button>

      {/* Middle — Search */}
      <div className="flex-1 max-w-xl">
        <SearchBar
          value={search}
          onChange={handleSearch}
          placeholder="Search for publications..."
        />
      </div>

      {/* Right — Auth */}
      <div className="flex flex-row items-center gap-4 whitespace-nowrap">
        {user ? (
          <>
            <span className="text-gray-300 text-sm">👤 {user.email}</span>
            <button
              className="text-red-400 hover:text-red-600 text-sm transition duration-200"
              onClick={handleLogout}
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <button
              className="text-blue-500 hover:text-blue-700 text-sm transition duration-200"
              onClick={() => navigate("/login")}
            >
              Log in
            </button>
            <button
              className="text-blue-500 hover:text-blue-700 text-sm transition duration-200"
              onClick={() => navigate("/register")}
            >
              Register
            </button>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
