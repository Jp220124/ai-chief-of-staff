"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Upload, FileJson, AlertCircle } from "lucide-react";
import { Message } from "@/lib/types";

interface UploadDataProps {
  onUpload: (messages: Message[]) => void;
}

export default function UploadData({ onUpload }: UploadDataProps) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validate = (data: unknown): data is Message[] => {
    if (!Array.isArray(data)) return false;
    return data.every(
      (m) =>
        typeof m.id === "number" &&
        typeof m.channel === "string" &&
        typeof m.from === "string" &&
        typeof m.timestamp === "string" &&
        typeof m.body === "string"
    );
  };

  const handleSubmit = () => {
    setError(null);
    try {
      const parsed = JSON.parse(text);
      if (!validate(parsed)) {
        setError("Invalid format. Each message needs: id (number), channel, from, timestamp, body.");
        return;
      }
      onUpload(parsed);
      setOpen(false);
      setText("");
    } catch {
      setError("Invalid JSON. Please check the format.");
    }
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setText(event.target?.result as string);
    };
    reader.readAsText(file);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-zinc-700 bg-zinc-900 text-sm text-zinc-300 hover:bg-zinc-800 cursor-pointer transition-colors">
          <Upload className="w-3.5 h-3.5" />
          Upload New Data
        </span>
      </DialogTrigger>
      <DialogContent className="max-w-2xl bg-zinc-900 border-zinc-700">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileJson className="w-5 h-5 text-indigo-400" />
            Upload New Messages
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <input
              type="file"
              ref={fileInputRef}
              accept=".json"
              onChange={handleFile}
              className="hidden"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="gap-1.5"
            >
              <Upload className="w-3.5 h-3.5" />
              Choose JSON File
            </Button>
          </div>
          <div>
            <p className="text-xs text-zinc-500 mb-2">Or paste JSON directly:</p>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder='[{"id": 1, "channel": "email", "from": "...", "timestamp": "...", "body": "..."}]'
              className="w-full h-48 p-3 rounded-md bg-zinc-950 border border-zinc-700 text-sm text-zinc-300 font-mono resize-none focus:outline-none focus:border-indigo-500"
            />
          </div>
          {error && (
            <div className="flex items-center gap-2 text-sm text-red-400">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={!text.trim()}>
              Analyze New Data
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
