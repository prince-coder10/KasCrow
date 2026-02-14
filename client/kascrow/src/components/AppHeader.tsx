import logo from "../assets/kascrow.png";

function AppHeader() {
  return (
    <div className="fixed top-0 left-0 w-full flex items-center justify-start select-none p-1">
      <div className="flex justify-center items-center">
        <img
          src={logo}
          alt="KasCrow Logo"
          className="w-9 object-contain select-none"
          draggable={false}
        />

        <p className="text-[18px] font-extrabold">
          <span className="text-primary">Kas</span>Crow
        </p>
      </div>
    </div>
  );
}

export default AppHeader;
