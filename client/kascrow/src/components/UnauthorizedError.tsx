import { ShieldAlert } from "lucide-react";

function UnauthorizedError() {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto">
      <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
        <ShieldAlert className="w-8 h-8 text-red-500" />
      </div>

      <h3 className="text-xl font-bold mb-2">Access Restricted</h3>
      <p className="text-muted text-sm mb-8">
        You need to be connected to a wallet to view this content. Please
        connect your wallet to verify your identity.
      </p>
    </div>
  );
}

export default UnauthorizedError;
