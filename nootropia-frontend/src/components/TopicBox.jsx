// container component that shows all the available topics for selection or for clearing
function TopicBox({
  label, // this label is showed over the container
  buttonLabel, // button label (select all  or clear all)
  buttonColor, // depends if the container is for selecting or clearing
  onButtonClick, // handles logic for select all or clear all
  children, // all the topis for selection or clearing
}) {
  return (
    <div className="flex flex-col gap-2 flex-1">
      <div className="flex flex-row items-center justify-between">
        <p className="text-gray-400 text-sm">{label}</p>
        <button
          className={`${buttonColor} text-sm transition duration-200`}
          onClick={onButtonClick}
        >
          {buttonLabel}
        </button>
      </div>
      <div
        className="bg-gray-800/50 border border-gray-700 rounded-lg p-3 min-h-[220px] max-h-[220px] overflow-y-auto"
        style={{
          scrollbarWidth: "thin",
          scrollbarColor: "#7c3aed #1f2937",
        }}
      >
        {children}
      </div>
    </div>
  );
}

export default TopicBox;
