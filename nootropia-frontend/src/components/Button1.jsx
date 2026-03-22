import { useNavigate } from "react-router-dom";
import { twMerge } from "tailwind-merge";

function Button1({
  navigation,
  textButton,
  className,
  disabled,
  type = "button",
  onClick,
}) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (navigation) {
      navigate(navigation);
    }
  };

  return (
    <button
      type={type}
      onClick={type === "submit" ? undefined : handleClick}
      disabled={disabled}
      className={twMerge(
        "font-mono p-[15px] rounded-lg text-xl font-semibold text-purple-400 border-2 border-purple-400 hover:bg-purple-400 hover:text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed",
        className,
      )}
    >
      {textButton}
    </button>
  );
}

export default Button1;
