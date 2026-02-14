import { Zap } from "lucide-react";

function Deploy() {
  return (
    <div className="w-full py-5 flex flex-col gap-4 justify-center items-center border-b border-muted/20">
      <div className="text-primary bg-primary/10 size-18 flex justify-center items-center rounded-full">
        <Zap size={40} />
      </div>
      <p className="sm font-bold text-white">Ready to Deploy</p>
      <p className="text-muted/50 text-[13px] text-center w-[80%] mx-auto pb-5 ">
        This will generate a unique escrow address. You will need to fund this
        address to activate the escrow.
      </p>
    </div>
  );
}

export default Deploy;
