import SettlementForm from "./forms/SettlementForm";
import useSidebar from "../../hooks/useSidebarContext";

function CreateSettlement() {
  const { navOpen } = useSidebar();
  return (
    <div
      className={`w-full max-w-full flex flex-col gap-5 overflow-x-hidden ${navOpen ? "md:ml-69 ml-10" : "ml-4 max-[480px]:mt-10 min-[480px]:ml-15"} mb-10 pt-3 pr-4 transition-all duration-300`}
    >
      <SettlementForm />
    </div>
  );
}

export default CreateSettlement;
