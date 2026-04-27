// shows topic in a container with different styles if the topic is selected or not
function TopicBadge({ topic, onClick, selected = false }) {
  return (
    <span
      onClick={() => onClick(topic)}
      className={`px-3 py-2 rounded-full text-sm cursor-pointer transition duration-200 whitespace-nowrap
        ${
          selected
            ? "bg-purple-700 hover:bg-red-700 text-white"
            : "bg-gray-700 hover:bg-purple-700 text-gray-300 hover:text-white"
        }`}
    >
      {topic} {selected && "✕"}
    </span>
  );
}

export default TopicBadge;
