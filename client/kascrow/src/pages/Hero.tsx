import Button from "../components/Button";
import { ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";

function Hero() {
  const navigate = useNavigate();
  return (
    <div className="w-full max-h-screen overflow-hidden flex flex-col gap-10 justify-center items-center h-screen max-[310px]:mt-10">
      <div className="w-full h-screen absolute bg-transparent top-0 left-0 overflow-hidden -z-10">
        <div className="size-125 rounded-full bg-linear-to-r from-cyan-500 to-purple-500 blur-[200px] absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-glow-flicker transition-all duration-300"></div>
      </div>
      <div className="w-full h-fit">
        <svg
          className="w-full h-screen absolute top-0 left-0 -z-1"
          preserveAspectRatio="none"
        >
          <path
            d="M0,100 C300,150 500,50 800,100 S1200,150 1400,100"
            fill="none"
            // stroke="#22D3EE"
            stroke-width="1"
            className="animate-dash stroke-[#22D3EE]/30 "
          ></path>
          <path
            d="M0,300 C200,250 600,350 1000,250 S1400,350 1600,250"
            fill="none"
            // stroke="#7C7CFF"
            stroke-width="1"
            className="animate-dash mt-20 stroke-[#7C7CFF]/30 "
            style={{ animationDuration: "7s" }}
          ></path>
        </svg>
      </div>
      <div className="flex flex-col gap-10 max-[310px]:gap-5 z-50">
        <div className="primary-gradient w-fit mx-auto p-4 rounded-xl">
          <ShieldCheck className="mx-auto text-white rounded-xl" size={40} />
        </div>
        <h1 className="text-center text-5xl md:text-7xl font-bold tracking-tighter text-white">
          Secure Escrow.{" "}
          <span className=" block text-transparent bg-clip-text bg-linear-to-r from-[#22D3EE] to-[#7C7CFF]">
            DAG Speed.
          </span>
        </h1>
        <p className=" text-center text-xl max-[310px]:text-sm text-gray-400 max-w-lg mx-auto leading-relaxed">
          The first production-grade escrow protocol built natively for Kaspa.
          Instant settlements. Zero trust required.
        </p>
      </div>
      <div className="flex gap-5 md:mt-10 justify-center items-center max-[310px]:flex-col max-[310px]:w-full">
        <Button
          className="shadow-md shadow-cyan-500/50 max-[310px]:w-full"
          onClick={() => navigate("/dashboard")}
        >
          View Demo
        </Button>
        <Button
          transparent={true}
          addIcon={true}
          className="max-[310px]:w-full"
        >
          View Docs
        </Button>
      </div>
    </div>
  );
}

export default Hero;
