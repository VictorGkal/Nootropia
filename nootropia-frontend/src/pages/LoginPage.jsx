import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login, getMe, setToken } from "../services/api";
import { useAuth } from "../context/AuthContext";
import LabelInput from "../components/LabelInput";
import Button1 from "../components/Button1";
import PageBackground from "../components/PageBackground";
import CentralBox from "../components/CentralBox";

function LoginPage() {
  const navigate = useNavigate();
  const { loginUser } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      setLoading(true);
      const res = await login(email, password);

      setToken(res.data.access_token);

      const userRes = await getMe();

      // save both token and user data
      loginUser(res.data.access_token, userRes.data);

      navigate("/feed");
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
            <p className="text-gray-300 text-4xl">Welcome Back</p>
            <span className="flex flex-row items-center justify-center gap-2">
              <h4 className="text-gray-300">Don't have an account?</h4>
              <button
                className="text-blue-500 hover:text-blue-700"
                onClick={() => navigate("/register")}
              >
                Register
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
            onSubmit={handleLogin}
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
                placeholder="Enter your Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <Button1
              type="submit"
              textButton="Log in"
              disabled={loading}
              className="font-mono p-[15px] rounded-lg text-xl font-semibold text-purple-400 border-2 border-purple-400 hover:bg-purple-400 hover:text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </form>
        </div>
      </CentralBox>
    </PageBackground>
  );
}

export default LoginPage;
