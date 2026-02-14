import logo from "../assets/kascrow.png";

function HeroHeader() {
  return (
    <div className="fixed top-0 left-0w-full flex items-center justify-start select-none p-4">
      <div className="flex justify-center items-center">
        <img
          src={logo}
          alt="KasCrow Logo"
          className="w-14 object-contain select-none"
          draggable={false}
        />

        <p className="text-4xl font-extrabold">
          <span className="text-primary">Kas</span>Crow
        </p>
      </div>
    </div>
  );
}

export default HeroHeader;
