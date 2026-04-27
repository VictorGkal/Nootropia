import { useState } from "react";
import { addBookmark, deleteBookmark } from "../services/api";
import { useAuth } from "../context/AuthContext";

// component that displays a publication in a container
function PublicationCard({
  publication,
  isBookmarked = false, // flag for knowing if a publication is bookmarked
  onBookmarkChange, // callback for when a publication gets bookmarked or not
}) {
  const { user } = useAuth(); // for getting user
  const [bookmarked, setBookmarked] = useState(isBookmarked); // for setting a publication bookmarked
  const [bookmarkLoading, setBookmarkLoading] = useState(false); // for bookmark animation
  const [popKey, setPopKey] = useState(0); // for restarting the bookmark animation

  const handleBookmark = async () => {
    if (!user) return; // if there is no user show no bookmark

    try {
      setBookmarkLoading(true);
      // if publication is already bookmarked then unbookmark it
      if (bookmarked) {
        await deleteBookmark(publication.id);
        setBookmarked(false);
        // notify parent component that publication was unbookmarked
        if (onBookmarkChange) onBookmarkChange(publication.id, false);
      } else {
        await addBookmark(publication.id);
        setBookmarked(true);
        // increment popKey so remount of bookmark svg can happen and the animation replays
        setPopKey((prev) => prev + 1);
        // notify parent component that publication was bookmarked
        if (onBookmarkChange) onBookmarkChange(publication.id, true);
      }
    } catch (err) {
      const detail = err.response?.data?.detail; // get details for error data
      // if frontend is out of sync with backend, correct the local state
      if (detail === "Already bookmarked") setBookmarked(true);
      if (detail === "Bookmark not found") setBookmarked(false);
      console.error(err);
    } finally {
      setBookmarkLoading(false);
    }
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-6 flex flex-col gap-3 hover:border-purple-500/50 hover:bg-white/10 transition-all duration-300">
      {/* On Top Left - Topic badges */}
      <div className="flex flex-wrap gap-2">
        {publication.topics && publication.topics.length > 0 ? (
          publication.topics.map((topic) => (
            <span
              key={topic}
              className="text-xs bg-purple-700/50 text-purple-300 px-3 py-1 rounded-full"
            >
              {topic}
            </span>
          ))
        ) : publication.topic ? (
          <span className="text-xs bg-purple-700/50 text-purple-300 px-3 py-1 rounded-full">
            {publication.topic}
          </span>
        ) : null}
      </div>

      {/* Under Topic Badges Left of The Container - Title */}
      <h2 className="text-white font-semibold text-lg leading-snug">
        {publication.title || "Untitled"}
      </h2>

      {/* Under Title Left of the Container - Authors + Year + Citations */}
      <div className="flex flex-row flex-wrap gap-3 text-sm text-gray-400">
        {publication.authors && (
          <span>
            {publication.authors.split(", ").length > 1
              ? `Authors: ${publication.authors}`
              : `Author: ${publication.authors}`}
          </span>
        )}
        {publication.authors && publication.year && <span>|</span>}
        {publication.year && <span>Published: {publication.year}</span>}
        {publication.year && publication.citations !== null && <span>|</span>}
        {publication.citations !== null && (
          <span>Citations: {publication.citations}</span>
        )}
      </div>
      {/* Under Authors left of the Container - First Lines of the Publication*/}
      {publication.abstract && (
        <p className="text-gray-400 text-sm leading-relaxed">
          {publication.abstract.length > 400
            ? publication.abstract.slice(0, 400) + "..."
            : publication.abstract}
        </p>
      )}

      {/* Under Abstraction Left of the Container — URL of the publication */}
      {/* On the same row as the URL but on the right of the Row - Bookmark Button*/}
      <div className="flex flex-row items-center justify-between mt-2">
        {publication.url ? (
          <a
            href={publication.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-purple-400 hover:text-purple-300 text-sm transition duration-200"
          >
            Read paper →
          </a>
        ) : (
          <span className="text-gray-600 text-sm">No link available</span>
        )}
        {/*Show bookmark button only if there is a user*/}
        {user && (
          <button
            onClick={handleBookmark}
            disabled={bookmarkLoading}
            className={`transition-all duration-200 disabled:opacity-50 ${
              bookmarkLoading ? "scale-90" : "hover:scale-110"
            }`}
          >
            {bookmarked ? (
              <svg
                key={popKey}
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-6 h-6 text-purple-400 animate-pop"
              >
                <path
                  fillRule="evenodd"
                  d="M6.32 2.577a49.255 49.255 0 0 1 11.36 0c1.497.174 2.57 1.46 2.57 2.93V21a.75.75 0 0 1-1.085.67L12 18.089l-7.165 3.583A.75.75 0 0 1 3.75 21V5.507c0-1.47 1.073-2.756 2.57-2.93Z"
                  clipRule="evenodd"
                />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-6 h-6 text-gray-400 hover:text-purple-400 transition duration-200"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z"
                />
              </svg>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

export default PublicationCard;
