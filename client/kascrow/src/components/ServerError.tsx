import { AlertTriangle, RefreshCcw } from "lucide-react";
import Button from "./Button";

interface ServerErrorProps {
  message?: string;
  onRetry?: () => void;
}

function ServerError({ message, onRetry }: ServerErrorProps) {
  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else {
      window.location.reload();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto min-h-[50vh]">
      <div className="w-20 h-20 bg-warning/10 rounded-3xl flex items-center justify-center mb-6 rotate-3">
        <AlertTriangle className="w-10 h-10 text-warning -rotate-3" />
      </div>

      <h3 className="text-2xl font-bold mb-3">Something went wrong</h3>
      <p className="text-muted text-sm mb-8 max-w-xs mx-auto">
        {message ||
          "We encountered an unexpected error while processing your request. Please try again."}
      </p>

      <Button onClick={handleRetry} className="group">
        <RefreshCcw
          size={16}
          className="mr-2 group-hover:rotate-180 transition-transform duration-500"
        />
        Try Again
      </Button>
    </div>
  );
}

export default ServerError;
