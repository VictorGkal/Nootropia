function PageBackground({ children }) {
  return (
    <div
      className="min-h-screen bg-gray-950 flex flex-col items-center justify-center"
      style={{
        backgroundImage:
          "radial-gradient(circle, #4a4a6a 1px, transparent 1px)",
        backgroundSize: "30px 30px",
      }}
    >
      {children}
    </div>
  );
}

export default PageBackground;
