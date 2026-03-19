import { useNavigate } from "react-router-dom";
import { twMerge } from "tailwind-merge";

function Button1({
  navigation,
  textButton,
  className,
  disabled,
  type = "button",
}) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (navigation) {
      navigate(navigation);
    }
    // if no navigation → do nothing
    // let the form handle the submit
  };

  return (
    <button
      type={type}
      onClick={type === "submit" ? undefined : handleClick}
      disabled={disabled}
      className={twMerge(
        "p-[15px] rounded-lg text-xl font-semibold hover:text-gray-200 bg-purple-700 border-purple-800 hover:bg-purple-900 text-white shadow-xl disabled:opacity-50 disabled:cursor-not-allowed",
        className,
      )}
    >
      {textButton}
    </button>
  );
}

export default Button1;
