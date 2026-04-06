import { useState } from "react";
import { EyeInvisibleOutlined, EyeOutlined } from "@ant-design/icons";

function LabelInput({
  label,
  type = "text",
  placeholder = "Enter",
  value,
  onChange,
}) {
  const [error, setError] = useState("");
  const [visible, setVisible] = useState(false);

  const validate = (value) => {
    if (type === "email") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        setError("Please enter a valid email address");
      } else {
        setError("");
      }
    }

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

  const inputType =
    type === "password" ? (visible ? "text" : "password") : type;

  return (
    <div className="flex flex-col justify-center gap-2">
      <label className="text-gray-100">{label}</label>
      <div className="relative">
        <input
          type={inputType}
          placeholder={placeholder}
          value={value}
          onChange={(e) => {
            validate(e.target.value);
            onChange(e);
          }}
          className="w-full bg-gray-300 hover:bg-gray-500 text-gray-600 hover:text-gray-900 font-semibold py-3 px-6 rounded-lg transition duration-200"
        />
        {type === "password" && (
          <div
            className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-gray-600"
            onClick={() => setVisible((prev) => !prev)}
          >
            {visible ? <EyeOutlined /> : <EyeInvisibleOutlined />}
          </div>
        )}
      </div>
      {error && <p className="text-red-400 text-sm">{error}</p>}
    </div>
  );
}

export default LabelInput;
