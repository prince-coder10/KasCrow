import React from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  className?: string;
  transparent?: boolean;
  addIcon?: true;
  danger?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  className = "",
  transparent = false,
  addIcon = false,
  danger = false,
  type = "button",
  disabled,
  ...rest
}) => {
  const filled =
    "text-[14px] relative overflow-hidden font-medium rounded-lg transition-all duration-150 active:scale-95 flex items-center justify-center gap-2 px-6 py-3 disabled:opacity-50 disabled:pointer-events-none bg-[#22D3EE] text-[#0B0F14] hover:bg-[#67e8f9] shadow-[0_0_15px_rgba(34,211,238,0.3)]";
  const danger_filled =
    "text-[14px] relative overflow-hidden font-medium rounded-lg transition-all duration-150 active:scale-95 flex items-center justify-center gap-2 px-6 py-3 disabled:opacity-50 disabled:pointer-events-none bg-[#EF4444] text-white hover:bg-[#DC2626] shadow-[0_0_15px_rgba(239,68,68,0.3)]";
  const ghost =
    "inline-flex items-center py-3 gap-3 justify-center select-none rounded-xl font-normal transition-transform duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/50 bg-transparent backdrop-blur-sm border border-gray-700 text-gray-200 px-5 py-2 hover:bg-[#111827] hover:border-gray-600";

  const disabledCls = disabled ? "opacity-60 pointer-events-none" : "";

  return (
    <button
      type={type}
      onClick={onClick}
      className={`${danger ? danger_filled : transparent ? ghost : filled} ${disabledCls} ${className}`}
      aria-pressed={false}
      disabled={disabled}
      {...rest}
    >
      {children}

      {/* Right chevron used by the outlined/ghost button (optional) */}
      {transparent && addIcon && (
        <svg
          className="w-4 h-4 ml-1"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M9 6l6 6-6 6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </button>
  );
};

export default Button;
