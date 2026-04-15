import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { register, login, getMe, setToken } from "../services/api";
import { useAuth } from "../context/AuthContext";
import LabelInput from "../components/LabelInput";
import Button1 from "../components/Button1";
import PageBackground from "../components/PageBackground";
import CentralBox from "../components/CentralBox";

function RegisterPage() {
  const navigate = useNavigate();
  const { loginUser } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match!");
      return;
    }

    try {
      setLoading(true);

      await register(email, password);

      const loginRes = await login(email, password);

      setToken(loginRes.data.access_token);

      const userRes = await getMe();

      loginUser(loginRes.data.access_token, userRes.data);

      navigate("/topics");
    } catch (err) {
      setError(err.response?.data?.detail || null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageBackground>
      <CentralBox>
        <div className="flex flex-col items-center justify-center gap-5">
          {/* Header */}
          <div className="flex flex-col items-center justify-center gap-2">
            <p className="text-gray-300 text-4xl">Create an Account</p>
            <span className="flex flex-row items-center justify-center gap-2">
              <h4 className="text-gray-300">Already have an account?</h4>
              <button
                className="text-blue-500 hover:text-blue-700"
                onClick={() => navigate("/login")}
              >
                Log in
              </button>
            </span>
            <button
              className="text-blue-300 hover:text-blue-500"
              onClick={() => navigate("/topics")}
            >
              Continue as a Guest
            </button>
          </div>

          {/* Error message */}
          {error && (
            <p className="text-red-400 text-sm bg-red-400/10 px-4 py-2 rounded-lg">
              {error}
            </p>
          )}

          {/* Form */}
          <form
            className="flex flex-col justify-center gap-4 w-80"
            onSubmit={handleRegister}
            noValidate
          >
            <div className="flex flex-col justify-center gap-2">
              <LabelInput
                label="Email"
                type="email"
                placeholder="Enter your Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <LabelInput
                label="Password"
                type="password"
                placeholder="Enter a Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <LabelInput
                label="Confirm Password"
                type="password"
                placeholder="Enter Password again"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            <Button1
              type="submit"
              textButton="Register"
              disabled={loading}
              className="font-mono p-[15px] rounded-lg text-xl font-semibold text-purple-400 border-2 border-purple-400 hover:bg-purple-400 hover:text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </form>
        </div>
      </CentralBox>
    </PageBackground>
  );
}

export default RegisterPage;
