import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../../apis/axios";
import useSidebar from "../../hooks/useSidebarContext";
import { useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import {
  Copy,
  Check,
  FileText,
  Download,
  Clock,
  ShieldCheck,
  AlertCircle,
  Loader2,
  FileIcon,
  Eye,
} from "lucide-react";

interface ISettlement {
  type: "TEXT" | "DOCUMENT";
  content?: string;
  file?: {
    signedUrl: string;
    expiresIn: string;
  };
}

function ViewSettlement() {
  const { id } = useParams<{ id: string }>();
  // Use optional chaining or default in case useSidebar or navOpen is not available
  // But assuming it fits the project structure
  const sidebarContext = useSidebar();
  const navOpen = sidebarContext?.navOpen ?? true;
  const queryClient = useQueryClient();

  const [settlement, setSettlement] = useState<ISettlement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState(10 * 60); // 24 hours in seconds

  useEffect(() => {
    const fetchSettlement = async () => {
      try {
        setLoading(true);
        const response = await api.post(`/escrow/${id}/allow`);
        // Refresh settlements list as status might have changed (e.g. from unacked to acked/viewed)
        await queryClient.invalidateQueries({ queryKey: ["settlements"] });

        // Notify other tabs/windows that this escrow has been viewed/updated
        const channel = new BroadcastChannel("escrow_updates");
        channel.postMessage({ type: "SETTLEMENT_VIEWED", escrowId: id });
        channel.close();

        console.log("Settlement Data:", response.data.settlement);
        setSettlement(response.data.settlement);
        // setTimeLeft(Number(response.data.settlement.file.expiresIn));
      } catch (err: any) {
        console.error("Error fetching settlement:", err);
        setError(
          "Failed to load settlement details. It may have expired or is invalid.",
        );
      } finally {
        setLoading(false);
      }
    };
    if (id) {
      fetchSettlement();
    }
  }, [id, queryClient]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours}h ${minutes}m ${secs}s`;
  };

  const handleCopy = () => {
    if (settlement?.content) {
      navigator.clipboard.writeText(settlement.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    if (settlement?.file) {
      try {
        const { signedUrl } = settlement.file;
        window.open(signedUrl, "_blank", "noopener,noreferrer");
      } catch (e) {
        console.error("Download failed", e);
        toast.error("Failed to download file", { id: "download-error" });
      }
    }
  };

  if (loading) {
    return (
      <div
        className={`flex items-center justify-center min-h-[50vh] transition-all duration-300 ${
          navOpen
            ? "md:ml-69 ml-10"
            : "ml-4 max-[480px]:mt-10 min-[480px]:ml-15"
        }`}
      >
        <Loader2 className="w-10 h-10 animate-spin text-[--color-primary]" />
      </div>
    );
  }

  if (error || !settlement) {
    return (
      <div
        className={`flex items-center justify-center min-h-[50vh] transition-all duration-300 ${
          navOpen
            ? "md:ml-69 ml-10"
            : "ml-4 max-[480px]:mt-10 min-[480px]:ml-15"
        }`}
      >
        <div className="text-center p-8 bg-[--color-card] border border-red-500/30 rounded-2xl max-w-md w-full">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Unavailable</h2>
          <p className="text-gray-400">{error || "Settlement not found"}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen text-gray-100 flex flex-col items-center p-4 pt-10 transition-all duration-300 ${
        navOpen ? "md:ml-69 ml-10" : "ml-4 max-[480px]:mt-10 min-[480px]:ml-15"
      }`}
    >
      <div className="w-full display-flex flex-col justify-center  items-center">
        {/* Header Section */}
        <div className="mb-8 text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3 bg-[--color-primary]/10 rounded-full mb-4 ring-1 ring-[--color-primary]/30 shadow-[0_0_15px_-3px_var(--color-primary)]">
            <ShieldCheck className="w-10 h-10 text-[--color-primary]" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold bg-linear-to-r from-[--color-primary] to-[--color-secondary] bg-clip-text text-transparent">
            Secure Settlement
          </h1>
          <p className="text-gray-400 max-w-md mx-auto">
            Decrypt and view your secure settlement data. This content is
            protected and time-sensitive.
          </p>
        </div>

        {/* Main Card */}
        <div className="relative group">
          {/* Glow effect */}
          <div className="absolute -inset-0.5 bg-linear-to-r from-[--color-primary] to-[--color-secondary] rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>

          <div className="relative bg-[--color-card] border border-white/10 rounded-2xl p-6 md:p-10 shadow-2xl backdrop-blur-xl">
            {/* TEXT VIEW */}
            {settlement.content && (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-gray-800 pb-4">
                  <label className="text-sm font-semibold text-[--color-primary] tracking-wider uppercase flex items-center gap-2">
                    <FileText className="w-4 h-4" /> Decrypted Content
                  </label>
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-2 text-xs font-medium bg-black/40 hover:bg-black/60 border border-gray-700 hover:border-[--color-primary]/50 rounded-lg px-4 py-2 transition-all text-gray-300 hover:text-white group/btn"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-green-400" />
                        <span className="text-green-400">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 group-hover/btn:text-[--color-primary] transition-colors" />
                        <span>Copy to Clipboard</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="relative group/code">
                  <div className="absolute inset-0 bg-linear-to-br from-[--color-primary]/5 to-[--color-secondary]/5 rounded-xl pointer-events-none"></div>
                  <pre className="w-full min-h-[300px] max-h-[600px] overflow-y-auto p-6 rounded-xl bg-bg-base/80 border border-gray-800 font-mono text-sm text-[--color-muted] whitespace-pre-wrap leading-relaxed shadow-inner">
                    {settlement.content || "No content available."}
                  </pre>
                </div>
              </div>
            )}

            {/* DOCUMENT VIEW */}
            {settlement.file && (
              <div className="flex flex-col items-center justify-center space-y-8 py-12">
                <div className="relative">
                  <div className="absolute inset-0 bg-[--color-primary] blur-2xl opacity-20 rounded-full"></div>
                  <div className="relative w-32 h-32 rounded-3xl bg-linear-to-br from-[#1F2937] to-card flex items-center justify-center border border-white/10 shadow-2xl  transition-transform duration-500">
                    <FileIcon className="w-14 h-14 text-[--color-primary]" />
                    {/* Badge */}
                    <div className="absolute -top-3 -right-3 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full border border-[--color-card] shadow-lg">
                      SECURE
                    </div>
                  </div>
                </div>

                <div className="text-center space-y-1">
                  <h3 className="text-2xl font-bold text-white tracking-tight break-all max-w-lg">
                    {/* {settlement.file?.filename spdf"} */}
                  </h3>
                  <p className="text-sm text-gray-500 font-mono px-3 py-1 bg-gray-900 rounded-full inline-block border border-gray-800">
                    {/* {settlement.file?.mimeType || "application/octet-stream"} */}
                    application/octet-stream
                  </p>
                </div>

                <button
                  onClick={handleDownload}
                  className="group/dl relative inline-flex items-center gap-3 px-8 py-4 bg-linear-to-r from-[--color-primary] to-[--color-secondary] hover:brightness-110 text-white font-bold rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-[--color-primary]/25"
                >
                  <Download className="w-5 h-5" />
                  <span>Download Secure File</span>
                  <div className="absolute inset-0 rounded-xl ring-2 ring-white/20 group-hover/dl:ring-white/40 transition-all"></div>
                </button>
              </div>
            )}

            {/* Footer / Expiry */}
            <div className="mt-10 pt-6 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-[--color-primary]" />
                {settlement.content ? (
                  <span>This file is active for one-time use securely.</span>
                ) : (
                  <span>This link is active for one-time use securely.</span>
                )}
              </div>
              {settlement.file && (
                <div className="flex items-center gap-2 bg-red-500/5 text-red-400 px-4 py-2 rounded-lg border border-red-500/10 shadow-[0_0_10px_-5px_red]">
                  <Clock className="w-4 h-4 animate-pulse" />
                  <span className="font-mono font-medium tracking-wide">
                    Expires in: {formatTime(timeLeft)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ViewSettlement;
