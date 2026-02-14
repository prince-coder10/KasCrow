import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../../../apis/axios";
import { Upload, FileText, CheckCircle, AlertCircle } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

type SettlementType = "TEXT" | "DOCUMENT";

function SettlementForm() {
  const { id: escrowId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const [type, setType] = useState<SettlementType>("TEXT");
  const [content, setContent] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];

      const allowedMimeTypes = [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/octet-stream", // fallback for some browsers
      ];

      const allowedExtensions = [".pdf", ".docx"];

      const fileExtension = selectedFile.name
        .toLowerCase()
        .slice(selectedFile.name.lastIndexOf("."));

      if (
        !allowedMimeTypes.includes(selectedFile.type) &&
        !allowedExtensions.includes(fileExtension)
      ) {
        setError("Only .pdf and .docx files are allowed");
        setFile(null);
        return;
      }

      setFile(selectedFile);
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (type === "TEXT" && !content.trim()) {
      setError("Please provide settlement details.");
      return;
    }
    if (type === "DOCUMENT" && !file) {
      setError("Please upload a document.");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("type", type);

      if (type === "TEXT") {
        formData.append("content", content);
      } else if (type === "DOCUMENT" && file) {
        formData.append("file", file);
      }

      await api.post(`/escrow/${escrowId}/settlement/ack`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      // Clear form and navigate
      setContent("");
      setFile(null);
      await queryClient.invalidateQueries({ queryKey: ["settlements"] });
      navigate(`/escrow/${escrowId}`);
    } catch (err: any) {
      console.error("Settlement submission error:", err);
      setError(err.response?.data?.message || "Failed to submit settlement.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="border-b border-muted/20 pb-10 flex flex-col gap-5 w-full max-w-2xl mx-auto"
    >
      <div className="flex flex-col gap-2">
        <h2 className="text-xl font-semibold text-white">Submit Settlement</h2>
        <p className="text-sm text-muted mb-4">
          Provide proof of delivery or service completion to acknowledge this
          escrow.
        </p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-center gap-3 text-red-400 text-sm">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      {/* Type Selection */}
      <div className="flex flex-col gap-2">
        <label className="text-[12px] md:text-sm font-medium text-muted">
          Settlement Type
        </label>
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => {
              setType("TEXT");
              setError(null);
            }}
            className={`flex items-center justify-center gap-2 p-3 rounded-lg border transition-all ${
              type === "TEXT"
                ? "bg-primary/20 border-primary text-primary"
                : "bg-bg-base border-gray-700 text-muted hover:border-gray-600"
            }`}
          >
            <FileText size={18} />
            <span className="text-sm font-medium">Text Description</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setType("DOCUMENT");
              setError(null);
            }}
            className={`flex items-center justify-center gap-2 p-3 rounded-lg border transition-all ${
              type === "DOCUMENT"
                ? "bg-primary/20 border-primary text-primary"
                : "bg-bg-base border-gray-700 text-muted hover:border-gray-600"
            }`}
          >
            <Upload size={18} />
            <span className="text-sm font-medium">Document Upload</span>
          </button>
        </div>
      </div>

      {/* Dynamic Fields */}
      {type === "TEXT" ? (
        <div className="flex flex-col gap-2 transition-all duration-300">
          <label
            htmlFor="content"
            className="text-[12px] md:text-sm font-medium text-muted"
          >
            Description
          </label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Describe the service provided or delivery details..."
            rows={6}
            className="w-full bg-bg-base border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-gray-600 resize-none"
          />
        </div>
      ) : (
        <div className="flex flex-col gap-2 transition-all duration-300">
          <label className="text-[12px] md:text-sm font-medium text-muted">
            Upload Document (PDF or DOCX)
          </label>
          <div className="relative">
            <input
              type="file"
              id="file"
              accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={handleFileChange}
              className="hidden"
            />
            <label
              htmlFor="file"
              className={`flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                file
                  ? "border-success bg-success/5"
                  : "border-gray-700 bg-bg-base hover:border-primary/50 hover:bg-bg-base/50"
              }`}
            >
              {file ? (
                <div className="flex flex-col items-center gap-2 text-success">
                  <CheckCircle size={32} />
                  <p className="text-sm font-medium">{file.name}</p>
                  <p className="text-xs opacity-70">Click to change file</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 text-muted">
                  <Upload size={32} />
                  <p className="text-sm font-medium">
                    Click to upload document
                  </p>
                  <p className="text-xs text-muted/60">
                    Supported: .pdf, .docx (Max 10MB)
                  </p>
                </div>
              )}
            </label>
          </div>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading}
        className="mt-4 w-full bg-primary hover:bg-primary/90 text-black font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <div className="size-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
        ) : (
          <CheckCircle size={20} />
        )}
        {loading ? "Submitting..." : "Submit Settlement"}
      </button>
    </form>
  );
}

export default SettlementForm;
