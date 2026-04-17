// reusable div container componter used in Landing Page, Login Page, Register Page, Topics Page
function CentralBox({ children, onMouseEnter, onMouseLeave }) {
  return (
    <div
      // style in tailwind css
      className="bg-white/10 backdrop-blur-md border border-white/20 transition-all duration-500 hover:shadow-purple-500/50 hover:shadow-2xl min-w-[700px] min-h-[600px] rounded-xl shadow-xl/30 flex flex-col items-center justify-center gap-6"
      onMouseEnter={onMouseEnter} // arguement called when mouse enters div
      onMouseLeave={onMouseLeave} // arguement called when mouse leaves div
    >
      {children}
    </div>
  );
}

export default CentralBox;
