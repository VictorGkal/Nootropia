import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import SearchBar from "./SearchBar";

// nav bar component for feed page
// takes an arguement for searching based on a func
function Navbar({ onSearch }) {
  const navigate = useNavigate(); // for navigation through buttons inside the nav bar
  const { user, logoutUser } = useAuth(); // for handling differences in the nav bar if there is a user
  const [search, setSearch] = useState(""); // for searching publication

  // handle search logic
  const handleSearch = (e) => {
    setSearch(e.target.value); // set search data based on the query
    // if there is a func for searching then search based on the users query
    if (onSearch) {
      onSearch(e.target.value);
    }
  };

  // for handling logic on logout button
  const handleLogout = () => {
    logoutUser();
    navigate("/");
  };

  return (
    <nav className="w-full bg-gray-900/80 backdrop-blur-md border-b border-white/10 px-8 py-4 flex flex-row items-center justify-between gap-6 sticky top-0 z-50">
      {/* left side Nootropia logo button for going back to the feed */}
      <button
        onClick={() => navigate("/feed")}
        className="text-purple-400 text-2xl font-mono font-bold hover:text-purple-300 transition duration-200 whitespace-nowrap"
      >
        Nootropia
      </button>

      {/* middle search bar for publications */}
      <div className="flex-1 max-w-xl">
        <SearchBar
          value={search}
          onChange={handleSearch}
          placeholder="Search for publications..."
        />
      </div>

      {/* right side with red logout button if there is a user or log in and register blue button if there isnt one*/}
      <div className="flex flex-row items-center gap-4 whitespace-nowrap">
        {user ? (
          <>
            <span className="text-gray-300 text-sm">{user.email}</span>
            <span className="text-gray-300"> | </span>
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
            <span className="text-gray-300"> | </span>
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
