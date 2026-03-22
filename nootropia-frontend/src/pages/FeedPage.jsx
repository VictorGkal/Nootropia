import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import {
  getRecentPublications,
  getPopularPublications,
  searchPublications,
  getMyBookmarks,
  addPreference,
  deletePreference,
  getPreferences,
} from "../services/api";
import Navbar from "../components/Navbar";
import PublicationCard from "../components/PublicationCard";
import PageBackground from "../components/PageBackground";
import TopicBox from "../components/TopicBox";
import TopicBadge from "../components/TopicBadge";
import SearchBar from "../components/SearchBar";

const LIMIT = 10;
const NO_PAGINATION_TABS = ["bookmarks"];

const HOT_TOPICS = [
  "artificial intelligence",
  "machine learning",
  "cybersecurity",
  "computer networks",
  "data science",
  "software engineering",
  "database systems",
  "cloud computing",
  "internet of things",
  "blockchain",
  "deep learning",
  "natural language processing",
  "computer vision",
  "robotics",
  "quantum computing",
  "augmented reality",
  "virtual reality",
  "big data",
  "edge computing",
  "5g networks",
  "bioinformatics",
  "cryptography",
  "distributed systems",
  "operating systems",
  "computer architecture",
  "web development",
  "mobile development",
  "devops",
  "microservices",
  "api design",
];

function FeedPage() {
  const { user } = useAuth();
  const [publications, setPublications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("recent");
  const [hasMore, setHasMore] = useState(false);
  const [topics, setTopics] = useState([]);
  const [topicSearch, setTopicSearch] = useState("");
  const [bookmarkedIds, setBookmarkedIds] = useState([]);

  const bottomRef = useRef(null);
  const skipRef = useRef(0);
  const hasMoreRef = useRef(false);
  const loadingRef = useRef(false);
  const activeTabRef = useRef("recent");
  const userRef = useRef(user);
  const topicsRef = useRef([]);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  useEffect(() => {
    topicsRef.current = topics;
  }, [topics]);

  // load initial topics
  useEffect(() => {
    if (user) {
      getPreferences().then((res) => {
        const loadedTopics = res.data.map((p) => p.topic);
        setTopics(loadedTopics);
        topicsRef.current = loadedTopics;
        fetchPublications(activeTabRef.current, "", 0);
      });
    } else {
      const guestTopics = JSON.parse(
        localStorage.getItem("guestTopics") || "[]",
      );
      setTopics(guestTopics);
      topicsRef.current = guestTopics;
      fetchPublications(activeTabRef.current, "", 0);
    }
  }, [user]);

  // load bookmarked ids
  useEffect(() => {
    if (user) {
      getMyBookmarks().then((res) => {
        setBookmarkedIds(res.data.map((p) => p.id));
      });
    } else {
      setBookmarkedIds([]);
    }
  }, [user]);

  const tabs = [
    { id: "recent", label: "Recent" },
    { id: "popular", label: "Popular" },
    ...(user
      ? [
          {
            id: "bookmarks",
            label: (
              <span className="flex flex-row items-center gap-2">
                Saved Publications
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-4 h-4"
                >
                  <path
                    fillRule="evenodd"
                    d="M6.32 2.577a49.255 49.255 0 0 1 11.36 0c1.497.174 2.57 1.46 2.57 2.93V21a.75.75 0 0 1-1.085.67L12 18.089l-7.165 3.583A.75.75 0 0 1 3.75 21V5.507c0-1.47 1.073-2.756 2.57-2.93Z"
                    clipRule="evenodd"
                  />
                </svg>
              </span>
            ),
          },
        ]
      : []),
  ];

  const filteredSuggestions = HOT_TOPICS.filter(
    (t) =>
      t.toLowerCase().includes(topicSearch.toLowerCase()) &&
      !topics.includes(t),
  );

  const handleAddTopic = async (topic) => {
    if (topics.includes(topic)) return;
    const newTopics = [...topics, topic];
    setTopics(newTopics);
    topicsRef.current = newTopics;
    setTopicSearch("");

    if (user) {
      await addPreference(topic);
    } else {
      localStorage.setItem("guestTopics", JSON.stringify(newTopics));
    }

    skipRef.current = 0;
    fetchPublications(activeTabRef.current, "", 0);
  };

  const handleRemoveTopic = async (topic) => {
    const newTopics = topics.filter((t) => t !== topic);
    setTopics(newTopics);
    topicsRef.current = newTopics;

    if (user) {
      await deletePreference(topic);
    } else {
      localStorage.setItem("guestTopics", JSON.stringify(newTopics));
    }

    skipRef.current = 0;
    fetchPublications(activeTabRef.current, "", 0);
  };

  const handleSelectAll = async () => {
    const newTopics = [...topics, ...filteredSuggestions];
    setTopics(newTopics);
    topicsRef.current = newTopics;

    if (user) {
      for (const topic of filteredSuggestions) {
        await addPreference(topic);
      }
    } else {
      localStorage.setItem("guestTopics", JSON.stringify(newTopics));
    }

    skipRef.current = 0;
    fetchPublications(activeTabRef.current, "", 0);
  };

  const handleClearAll = async () => {
    const topicsToRemove = [...topics];
    setTopics([]);
    topicsRef.current = [];

    if (user) {
      for (const topic of topicsToRemove) {
        await deletePreference(topic);
      }
    } else {
      localStorage.setItem("guestTopics", JSON.stringify([]));
    }

    skipRef.current = 0;
    fetchPublications(activeTabRef.current, "", 0);
  };

  // called from PublicationCard when bookmark toggled
  const handleBookmarkChange = (publicationId, isBookmarked) => {
    if (isBookmarked) {
      setBookmarkedIds((prev) => [...prev, publicationId]);
    } else {
      setBookmarkedIds((prev) => prev.filter((id) => id !== publicationId));
      // if on bookmarks tab → remove from list immediately
      if (activeTabRef.current === "bookmarks") {
        setPublications((prev) => prev.filter((p) => p.id !== publicationId));
      }
    }
  };

  const fetchPublications = async (tab, searchQuery = "", currentSkip = 0) => {
    if (loadingRef.current && currentSkip > 0) return;

    try {
      loadingRef.current = true;

      if (currentSkip === 0) {
        setLoading(true);
        setError(null);
      } else {
        setLoadingMore(true);
      }

      let res;
      const currentUser = userRef.current;
      const currentTopics = topicsRef.current;
      const guestTopics = !currentUser ? currentTopics : [];

      if (searchQuery) {
        res = await searchPublications(searchQuery, LIMIT);
      } else if (tab === "recent") {
        res = await getRecentPublications(LIMIT, currentSkip, guestTopics);
      } else if (tab === "popular") {
        res = await getPopularPublications(LIMIT, currentSkip, guestTopics);
      } else if (tab === "bookmarks") {
        if (!currentUser) {
          setError("Please login to see your bookmarks!");
          setPublications([]);
          return;
        }
        res = await getMyBookmarks();
      }

      const newPublications = res?.data || [];

      if (currentSkip === 0) {
        setPublications(newPublications);
      } else {
        setPublications((prev) => {
          const existingIds = new Set(prev.map((p) => p.id));
          const unique = newPublications.filter((p) => !existingIds.has(p.id));
          return [...prev, ...unique];
        });
      }

      const canPaginate = !NO_PAGINATION_TABS.includes(tab);
      const more = canPaginate && newPublications.length === LIMIT;

      setHasMore(more);
      hasMoreRef.current = more;
    } catch (err) {
      setError("Failed to load publications!");
      console.error(err);
    } finally {
      loadingRef.current = false;
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    if (!user && activeTab === "bookmarks") {
      setActiveTab("recent");
      return;
    }
    activeTabRef.current = activeTab;
    skipRef.current = 0;
    hasMoreRef.current = false;
    fetchPublications(activeTab, "", 0);
  }, [activeTab, user]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const target = entries[0];
        if (
          target.isIntersecting &&
          hasMoreRef.current &&
          !loadingRef.current
        ) {
          const newSkip = skipRef.current + LIMIT;
          skipRef.current = newSkip;
          fetchPublications(activeTabRef.current, "", newSkip);
        }
      },
      { root: null, rootMargin: "20px", threshold: 0 },
    );

    if (bottomRef.current) {
      observer.observe(bottomRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const handleSearch = (query) => {
    skipRef.current = 0;
    if (query.length > 2) {
      fetchPublications(activeTabRef.current, query, 0);
    } else if (query.length === 0) {
      fetchPublications(activeTabRef.current, "", 0);
    }
  };

  return (
    <PageBackground>
      <div className="min-h-screen w-full flex flex-col">
        {/* Navbar */}
        <Navbar onSearch={handleSearch} />

        <div className="flex flex-row gap-6 px-8 py-8 w-full mx-auto">
          {/* Left sidebar */}
          <div className="flex flex-col gap-4 max-w-[400px] shrink-0">
            {/* Title */}
            <p className="text-purple-400 font-mono text-lg">Your Topics</p>

            {/* Search bar */}
            <SearchBar
              value={topicSearch}
              onChange={(e) => setTopicSearch(e.target.value)}
              placeholder="Search for a topic..."
            />

            {/* Available topics box */}
            <div className="w-full">
              <TopicBox
                label="Available topics:"
                buttonLabel="Select all"
                buttonColor="text-blue-500 hover:text-blue-700"
                onButtonClick={handleSelectAll}
              >
                {filteredSuggestions.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {filteredSuggestions.map((topic) => (
                      <TopicBadge
                        key={topic}
                        topic={topic}
                        onClick={handleAddTopic}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No topics found</p>
                )}
              </TopicBox>
            </div>

            {/* Selected topics box */}
            <div className="w-full">
              <TopicBox
                label={`Selected (${topics.length}):`}
                buttonLabel="Clear all"
                buttonColor="text-red-500 hover:text-red-700"
                onButtonClick={handleClearAll}
              >
                {topics.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {topics.map((topic) => (
                      <TopicBadge
                        key={topic}
                        topic={topic}
                        onClick={handleRemoveTopic}
                        selected
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">
                    No topics selected. Showing all publications.
                  </p>
                )}
              </TopicBox>
            </div>

            {/* Filter tabs */}
            <div className="flex flex-col gap-2 mt-2">
              <p className="text-gray-500 text-xs uppercase tracking-wider">
                Filter by
              </p>
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`text-left px-3 text-white py-2 rounded-lg text-sm font-semibold transition duration-200 ${
                    activeTab === tab.id
                      ? "bg-purple-700 text-white"
                      : "text-gray.400 hover:text-white hover:bg-gray-800"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Right — Publications */}
          <div className="flex flex-col gap-4 flex-1">
            {/* Loading */}
            {loading && (
              <div className="flex items-center justify-center py-20">
                <p className="text-gray-400 text-lg animate-pulse">
                  Loading publications...
                </p>
              </div>
            )}

            {/* Error */}
            {error && (
              <p className="text-red-400 text-sm bg-red-400/10 px-4 py-2 rounded-lg text-center">
                {error}
              </p>
            )}

            {/* Empty state */}
            {!loading && !error && publications.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <p className="text-gray-400 text-lg">No publications found!</p>
                <p className="text-gray-500 text-sm">
                  Try adding different topics or searching for something else.
                </p>
              </div>
            )}

            {/* Publications */}
            {!loading && !error && publications.length > 0 && (
              <div className="flex flex-col gap-4">
                {publications.map((publication) => (
                  <PublicationCard
                    key={publication.id}
                    publication={publication}
                    isBookmarked={bookmarkedIds.includes(publication.id)}
                    onBookmarkChange={handleBookmarkChange}
                  />
                ))}
              </div>
            )}

            {/* Loading more */}
            {loadingMore && (
              <p className="text-gray-400 text-sm animate-pulse text-center">
                Loading more...
              </p>
            )}

            {/* No more */}
            {!loading && !hasMore && publications.length > 0 && (
              <p className="text-gray-600 text-sm text-center">
                No more publications to load
              </p>
            )}

            {/* Bottom observer */}
            <div ref={bottomRef} className="h-1 w-full" />
          </div>
        </div>
      </div>
    </PageBackground>
  );
}

export default FeedPage;
