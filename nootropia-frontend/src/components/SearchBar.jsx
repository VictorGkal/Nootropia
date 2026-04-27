// search bar component used for searching topics, publicaitons in the pages
function SearchBar({ value, onChange, placeholder }) {
  return (
    <input
      type="text"
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className="w-full bg-gray-800 text-gray-300 placeholder-gray-500 px-4 py-3 rounded-lg border border-gray-700 focus:outline-none focus:border-purple-500 transition duration-200"
    />
  );
}

export default SearchBar;
