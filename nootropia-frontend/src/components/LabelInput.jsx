import { useState } from "react";
import { EyeInvisibleOutlined, EyeOutlined } from "@ant-design/icons";

// a div component used for email and password
function LabelInput({
  label, // arguemnt for setting text in the label
  type = "text", // arguement for setting type for input
  placeholder = "", // arguement for setting placeholder for input
  value, // controlled input value from parent state
  onChange, // arguement for setting data outside the component
}) {
  const [error, setError] = useState(""); // deals with errors for user input
  const [visible, setVisible] = useState(false); // tracks whether password text is shown in plaintext

  // for validating input based on the type of input, email or password
  const validate = (value) => {
    // email validation
    if (type === "email") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        setError("Please enter a valid email address");
      } else {
        setError("");
      }
    }

    // password validation
    if (type === "password") {
      if (value.length < 6) {
        setError("Password must be at least 6 characters");
      } else if (!/[A-Z]/.test(value)) {
        setError("Password must contain at least 1 uppercase letter");
      } else if (!/[!@#$%^&*(),.?":{}|<>]/.test(value)) {
        setError("Password must contain at least 1 special character");
      } else {
        setError("");
      }
    }
  };

  // set visability for password input
  const inputType =
    type === "password" ? (visible ? "text" : "password") : type;

  return (
    <div className="flex flex-col justify-center gap-2">
      <label className="text-gray-100">{label}</label>
      <div className="relative">
        <input
          type={inputType} // set input type
          placeholder={placeholder} // set placeholder
          value={value} // for lenght of input
          onChange={(e) => {
            // validate on every keystroke so feedback is immediate
            validate(e.target.value);
            onChange(e);
          }}
          // style with tailwind css
          className="w-full bg-gray-300 hover:bg-gray-500 text-gray-600 hover:text-gray-900 font-semibold py-3 px-6 rounded-lg transition duration-200"
        />
        {/* This is a button component for setting password visable to the user when he clicks on it.*/}
        {type === "password" && (
          <div
            className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-gray-600"
            onClick={() => setVisible((prev) => !prev)}
          >
            {visible ? <EyeOutlined /> : <EyeInvisibleOutlined />}
          </div>
        )}
      </div>
      {/* if there is an error show it under label and input */}
      {error && <p className="text-red-400 text-sm">{error}</p>}
    </div>
  );
}

export default LabelInput;
