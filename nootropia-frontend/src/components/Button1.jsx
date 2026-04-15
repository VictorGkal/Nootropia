import { useNavigate } from "react-router-dom";

// reusable button component for login, register, continue as guest
function Button1({
  navigation, // arguement for navigation after button is clicked
  textButton, // arguement for text inside button
  className, // arguement for tailwind css styling
  disabled, // for loading purposes
  type = "button", // default type is button
  onClick, // custom click handler, takes priority over navigation
}) {
  //
  const navigate = useNavigate();

  // func for handling click or navigate
  const handleClick = () => {
    // if there is a custom on click function then run it
    if (onClick) {
      onClick();
    }
    // else if there is a navigation arguement navigate to it
    else if (navigation) {
      navigate(navigation);
    }
  };

  // Button1 component will return a button with all the above arguements
  return (
    <button
      type={type}
      // if the button type is submit dont attach onClick else use func
      onClick={type === "submit" ? undefined : handleClick}
      disabled={disabled}
      className={className}
    >
      {textButton}
    </button>
  );
}

export default Button1;
