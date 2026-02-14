import Details from "./forms/Details";
import Deploy from "./forms/Deploy";
import Review from "./forms/Review";
import { ArrowLeft, ArrowRight } from "lucide-react";
import useSidebar from "../../hooks/useSidebarContext";
import Button from "../../components/Button";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import StepItem from "../../components/StepItem";
import { api } from "../../apis/axios";
import { useQueryClient } from "@tanstack/react-query";

type EscrowFormData = {
  title: string;
  amount: string;
  vendor: string;
};

function CreateEscrow() {
  const { navOpen } = useSidebar();
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [formData, setFormData] = useState<EscrowFormData>({
    title: "",
    amount: "",
    vendor: "",
  });
  const queryClient = useQueryClient();

  const validateStepOne = () => {
    if (!formData.amount || isNaN(Number(formData.amount))) {
      alert("Invalid amount");
      return false;
    }

    if (!formData.title.trim() || formData.title.length < 3) {
      alert("Title must be at least 3 characters");
      return false;
    }

    if (!formData.vendor.trim()) {
      alert("Vendor address required");
      return false;
    }

    return true;
  };

  const handleNext = () => {
    if (step === 1 && !validateStepOne()) return;

    setStep((prev) => (prev < 3 ? ((prev + 1) as 1 | 2 | 3) : prev));
  };

  const handleBack = () => {
    setStep((prev) => (prev > 1 ? ((prev - 1) as 1 | 2 | 3) : prev));
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return <Details formData={formData} setFormData={setFormData} />;
      case 2:
        return <Review formData={formData} />;
      case 3:
        return <Deploy />;
      default:
        return null;
    }
  };

  const handleFormSubmit = async () => {
    try {
      // call api
      const res = await api.post("/escrow/create", {
        title: formData.title,
        amount: formData.amount,
        vendorAddress: formData.vendor,
      });

      await queryClient.invalidateQueries({ queryKey: ["myEscrows"] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });

      setFormData({
        title: "",
        amount: "",
        vendor: "",
      });
      navigate("/escrows");
      console.log(res);
    } catch (error) {
      console.error("Error creating escrow:", error);
      alert("Failed to create escrow");
    }
  };

  return (
    <div
      className={`w-full max-w-full overflow-x-hidden ${navOpen ? "md:ml-64 ml-10" : "ml-4 max-[480px]:mt-10 min-[480px]:ml-10"} mb-10 pt-3 pr-4 transition-all duration-300`}
    >
      <div className="flex items-center gap-5">
        <ArrowLeft
          className="cursor-pointer"
          onClick={() => navigate("/dashboard")}
        />
        <div>
          <p className="text-xl font-bold">Create Safe Deal</p>
          <p className="text-sm text-muted/50">
            Trustless escrow powered by Kaspa blockchain.
          </p>
        </div>
      </div>
      <div className="w-full grid grid-cols-3 mt-10">
        <StepItem index={1} label="DETAILS" currentStep={step} />
        <StepItem index={2} label="REVIEW" currentStep={step} />
        <StepItem index={3} label="DEPLOY" currentStep={step} />
      </div>
      <div className="bg-card p-10 min-[480px]:ml-5 rounded-2xl mt-5">
        {/* Steps */}
        {renderStep()}
        {/* Controller */}
        <div className="w-full flex max-[425px]:flex-col gap-5 justify-end pt-5">
          {step !== 1 && (
            <Button transparent onClick={handleBack}>
              <ArrowLeft size={12} />
              Back
            </Button>
          )}

          {step < 3 ? (
            <Button onClick={handleNext}>
              Continue <ArrowRight size={12} />
            </Button>
          ) : (
            <Button onClick={() => handleFormSubmit()}>
              Generate & Deploy <ArrowRight />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default CreateEscrow;
