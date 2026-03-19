function CentralBox({ children, onMouseEnter, onMouseLeave }) {
  return (
    <div
      className="bg-white/10 backdrop-blur-md border border-white/20 transition-all duration-500 hover:shadow-purple-500/50 hover:shadow-2xl min-w-[700px] min-h-[600px] rounded-xl shadow-xl/30 flex flex-col items-center justify-center gap-6"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {children}
    </div>
  );
}

export default CentralBox;
