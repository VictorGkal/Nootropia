import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { addPreference } from "../services/api";
import PageBackground from "../components/PageBackground.jsx";
import CentralBox from "../components/CentralBox.jsx";
import Button1 from "../components/Button1.jsx";
import TopicBadge from "../components/TopicBadge.jsx";
import TopicBox from "../components/TopicBox.jsx";
import SearchBar from "../components/SearchBar.jsx";

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

function TopicsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [selectedTopics, setSelectedTopics] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const filteredTopics = HOT_TOPICS.filter(
    (topic) =>
      topic.toLowerCase().includes(search.toLowerCase()) &&
      !selectedTopics.includes(topic),
  );

  const handleSelectTopic = (topic) => {
    if (!selectedTopics.includes(topic)) {
      setSelectedTopics([...selectedTopics, topic]);
    }
  };

  const handleRemoveTopic = (topic) => {
    setSelectedTopics(selectedTopics.filter((t) => t !== topic));
  };

  const handleSelectAll = () => {
    setSelectedTopics([...selectedTopics, ...filteredTopics]);
  };

  const handleClearAll = () => {
    setSelectedTopics([]);
  };

  const handleContinue = async () => {
    if (selectedTopics.length === 0) {
      setError("Please select at least one topic!");
      return;
    }
    setError(null);

    if (user) {
      try {
        setLoading(true);
        for (const topic of selectedTopics) {
          await addPreference(topic);
        }
        navigate("/feed");
      } catch (err) {
        setError(err.response?.data?.detail || null);
      } finally {
        setLoading(false);
      }
    } else {
      localStorage.setItem("guestTopics", JSON.stringify(selectedTopics));
      navigate("/feed");
    }
  };

  return (
    <PageBackground>
      <CentralBox>
        <div className="flex flex-col w-full px-12 gap-6">
          {/* Title */}
          <p className="text-purple-400 text-3xl font-mono">
            Choose your interests
          </p>

          {/* Instruction + Error */}
          <div className="text-gray-400 text-sm flex flex-row gap-6">
            <span>Select at least one topic to personalize your feed.</span>
            {error && <span className="text-red-400 text-sm">{error}</span>}
          </div>

          {/* Search bar */}
          <SearchBar
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search for a topic..."
          />

          {/* Two boxes row */}
          <div className="flex flex-row gap-4 min-w-[900px] max-w-[900px] self-center">
            {/* Available topics box */}
            <TopicBox
              label="Available topics:"
              buttonLabel="Select all"
              buttonColor="text-blue-500 hover:text-blue-700"
              onButtonClick={handleSelectAll}
            >
              {filteredTopics.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {filteredTopics.map((topic) => (
                    <TopicBadge
                      key={topic}
                      topic={topic}
                      onClick={handleSelectTopic}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No topics found</p>
              )}
            </TopicBox>

            {/* Selected topics box */}
            <TopicBox
              label={`Selected (${selectedTopics.length}):`}
              buttonLabel="Clear all"
              buttonColor="text-red-500 hover:text-red-700"
              onButtonClick={handleClearAll}
            >
              {selectedTopics.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {selectedTopics.map((topic) => (
                    <TopicBadge
                      key={topic}
                      topic={topic}
                      onClick={handleRemoveTopic}
                      selected
                    />
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No topics selected yet</p>
              )}
            </TopicBox>
          </div>

          {/* Bottom row */}
          <div className="flex flex-row items-center justify-between">
            <Button1
              textButton={loading ? "Saving..." : "Continue →"}
              disabled={loading}
              onClick={handleContinue}
            />
            <div className="flex flex-row items-center gap-4">
              {!user && (
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
                    Create account
                  </button>
                </>
              )}
              <button
                className="text-gray-500 hover:text-gray-300 transition duration-200 text-sm"
                onClick={() => navigate("/feed")}
              >
                Skip →
              </button>
            </div>
          </div>
        </div>
      </CentralBox>
    </PageBackground>
  );
}

export default TopicsPage;
