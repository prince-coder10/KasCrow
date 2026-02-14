import { Check } from "lucide-react";

type StepItemProps = {
  index: 1 | 2 | 3;
  label: string;
  currentStep: 1 | 2 | 3;
};

export default function StepItem({ index, label, currentStep }: StepItemProps) {
  const isActive = currentStep === index;
  const isCompleted = currentStep > index;

  return (
    <div className="flex flex-col gap-1 items-center">
      <div
        className={`
          size-8 rounded-full flex items-center justify-center font-bold transition-all
          ${
            isCompleted
              ? "bg-primary text-black"
              : isActive
                ? "bg-primary text-black ring-4 ring-primary/20"
                : "bg-card/70 text-muted/80"
          }
        `}
      >
        {isCompleted ? <Check size={16} /> : index}
      </div>

      <p
        className={`text-[12px] transition-colors
          ${isCompleted || isActive ? "text-primary" : "text-muted/80"}
        `}
      >
        {label}
      </p>
    </div>
  );
}
