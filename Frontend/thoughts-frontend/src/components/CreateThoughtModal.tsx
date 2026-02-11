import { useState } from "react";
import { X, Image, Film, Feather } from "lucide-react";
import { postMultipart } from "@/lib/api";
import { useNavigate } from "react-router-dom";

const MAX_CHARS = 500;

interface Props {
  open: boolean;
  onClose: () => void;
}

export function CreateThoughtModal({ open, onClose }: Props) {
  const [text, setText] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const navigate = useNavigate();

  if (!open) return null;

  const remaining = MAX_CHARS - text.length;
  const overLimit = remaining < 0;

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
      <div
        className="absolute inset-0 bg-foreground/20 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className="relative w-full max-w-lg bg-card rounded-t-2xl sm:rounded-2xl border border-border/50 animate-slide-up"
        style={{ boxShadow: "var(--shadow-elevated)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-secondary transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
          <span className="text-sm font-semibold">New Thought</span>
          <button
            disabled={text.length === 0 || overLimit}
            className="h-8 px-4 rounded-full bg-primary text-primary-foreground text-sm font-medium disabled:opacity-40 transition-all duration-200 hover:opacity-90"
          >
            Post
          </button>
        </div>

        {/* Body */}
        <div className="p-4">
          <div className="flex gap-3">
            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
              <Feather className="h-4 w-4 text-muted-foreground" />
            </div>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="What's on your mind?"
              className="flex-1 bg-transparent text-[15px] leading-relaxed resize-none outline-none min-h-[120px] placeholder:text-muted-foreground"
              autoFocus
            />
          </div>
        </div>
        {/* Files preview */}
        {files.length > 0 && (
          <div className="p-4 grid grid-cols-3 gap-2">
            {files.map((f, i) => (
              <div
                key={i}
                className="rounded overflow-hidden bg-muted p-2 text-xs text-muted-foreground"
              >
                {f.name}
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-border/50">
          <div className="flex gap-2">
            <label className="p-2 rounded-full hover:bg-secondary transition-colors cursor-pointer">
              <Image className="h-5 w-5 text-muted-foreground" />
              <input
                type="file"
                accept="image/*,video/*"
                multiple
                className="hidden"
                onChange={(e) => setFiles(Array.from(e.target.files || []))}
              />
            </label>
            <button className="p-2 rounded-full hover:bg-secondary transition-colors">
              <Film className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>
          <div className="flex items-center gap-3">
            <span
              className={`text-xs font-medium ${
                overLimit
                  ? "text-destructive"
                  : remaining < 50
                  ? "text-primary"
                  : "text-muted-foreground"
              }`}
            >
              {remaining}
            </span>
            <button
              disabled={text.length === 0 || overLimit}
              onClick={async (e) => {
                e.preventDefault();
                try {
                  const form = new FormData();
                  form.append("text", text);
                  files.forEach((f) => form.append("media", f));
                  await postMultipart("/thoughts", form);
                  setText("");
                  setFiles([]);
                  onClose();
                  // redirect to feed so user sees new post
                  navigate("/feed");
                } catch (err: any) {
                  alert(err?.response?.data?.message || "Failed to post");
                }
              }}
              className="h-8 px-4 rounded-full bg-primary text-primary-foreground text-sm font-medium disabled:opacity-40 transition-all duration-200 hover:opacity-90"
            >
              Post
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
