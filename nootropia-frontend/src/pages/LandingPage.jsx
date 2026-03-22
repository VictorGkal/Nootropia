import { useState } from "react";
import SplitText from "../components/SplitText";
import FadeContent from "../components/FadeContent";
import Button1 from "../components/Button1";
import PageBackground from "../components/PageBackground";
import CentralBox from "../components/CentralBox";

function LandingPage() {
  const [hovered, setHovered] = useState(false);

  return (
    <PageBackground>
      <CentralBox
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Welcome message — hide on hover */}
        {!hovered && (
          <div className="flex flex-col items-center gap-4">
            <div className="text-[80px] text-purple-400 font-mono text-center">
              <SplitText
                text={"Welcome to \nNootropia"}
                className="whitespace-pre-line"
              />
            </div>
            <p className="text-gray-300 text-lg text-center max-w-md px-8">
              Discover the latest academic publications tailored to your
              interests. Powered by OpenAlex.
            </p>
          </div>
        )}

        {/* Buttons — show on hover */}
        {hovered && (
          <FadeContent duration={500} easing="ease-out" initialOpacity={0}>
            <div className="flex flex-col justify-center gap-6">
              <Button1 navigation="/register" textButton="Register"></Button1>
              <Button1 navigation="/login" textButton="Log in"></Button1>
              <Button1
                navigation="/topics"
                textButton="Continue as Guest"
                className="p-[15px] rounded-lg text-xl font-semibold text-gray-400 border-2 border-gray-400 hover:bg-gray-400 hover:text-white transition-all duration-300 bg-transparent shadow-none"
              />
            </div>
          </FadeContent>
        )}
      </CentralBox>
    </PageBackground>
  );
}

export default LandingPage;
