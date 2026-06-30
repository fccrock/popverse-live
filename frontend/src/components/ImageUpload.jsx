import { useState, useRef } from "react";

import { API_BASE as API } from "../config.js";

/**
 * A reusable AWS S3 image uploader component.
 * 
 * @param {string} currentImage - URL of the current image, if any
 * @param {function} onUploadComplete - callback(publicUrl) when upload succeeds
 * @param {string} className - optional styling
 * @param {string} label - text to display on the button
 */
export default function ImageUpload({ currentImage, onUploadComplete, className = "", label = "Upload Image" }) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError]             = useState("");
  const fileInputRef                  = useRef(null);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Basic validation
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file (JPEG, PNG, WEBP).");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be smaller than 5MB.");
      return;
    }

    setError("");
    setIsUploading(true);

    try {
      // 1. Get presigned URL from our backend
      const res = await fetch(`${API}/api/upload/presigned-url`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: file.name, fileType: file.type }),
      });

      if (!res.ok) {
        throw new Error("Failed to get upload URL from server");
      }

      const { signedUrl, publicUrl } = await res.json();

      // 2. Upload directly to AWS S3 using the presigned URL
      const uploadRes = await fetch(signedUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!uploadRes.ok) {
        const errorText = await uploadRes.text();
        console.error("S3 Upload Failed:", uploadRes.status, errorText);
        // Extract the Message from XML if possible to keep it concise, else show status
        let shortMsg = `S3 Error ${uploadRes.status}`;
        const match = errorText.match(/<Message>(.*?)<\/Message>/);
        if (match && match[1]) {
          shortMsg += `: ${match[1]}`;
        } else {
          shortMsg += ` - ${uploadRes.statusText}`;
        }
        throw new Error(shortMsg);
      }

      // 3. Inform parent component
      onUploadComplete(publicUrl);
      
    } catch (err) {
      console.error(err);
      setError(err.message || "Something went wrong during upload");
    } finally {
      setIsUploading(false);
      // Reset input so the same file can be selected again if needed
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className={`relative ${className}`}>
      <input
        type="file"
        accept="image/jpeg, image/png, image/webp"
        className="hidden"
        ref={fileInputRef}
        onChange={handleFileChange}
      />
      
      <button
        type="button"
        disabled={isUploading}
        onClick={() => fileInputRef.current?.click()}
        className="group relative flex w-full flex-col items-center justify-center gap-2 overflow-hidden rounded-xl border border-dashed border-white/20 bg-white/5 p-6 transition-colors hover:border-violet-500/50 hover:bg-violet-500/5 disabled:opacity-50"
      >
        {isUploading ? (
          <div className="flex flex-col items-center text-violet-400">
            <svg className="h-8 w-8 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span className="mt-2 text-sm font-semibold">Uploading...</span>
          </div>
        ) : (
          <>
            {currentImage ? (
              <div className="absolute inset-0 z-0">
                <img src={currentImage} alt="Preview" className="h-full w-full object-cover opacity-40 blur-sm grayscale transition-all group-hover:opacity-20" />
                <div className="absolute inset-0 bg-black/50" />
              </div>
            ) : null}
            
            <div className="relative z-10 flex flex-col items-center">
              <div className="grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white transition-transform group-hover:scale-110 group-hover:bg-violet-500 text-xl shadow-lg">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
              </div>
              <span className="mt-3 text-sm font-bold text-white shadow-black drop-shadow-md">{label}</span>
              <span className="mt-1 text-xs text-zinc-400 shadow-black drop-shadow-md">JPG, PNG or WEBP (Max 5MB)</span>
            </div>
          </>
        )}
      </button>

      {error && (
        <p className="mt-2 text-center text-xs font-semibold text-rose-400">{error}</p>
      )}
    </div>
  );
}
