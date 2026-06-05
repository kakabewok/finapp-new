"use client";

import { useState, useRef } from "react";
import { UploadCloud, Camera, Loader2, FileImage, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScanResponse } from "@/types";
import { toast } from "sonner";
import Image from "next/image";

interface ReceiptUploaderProps {
  onScanComplete: (result: ScanResponse) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

export function ReceiptUploader({ onScanComplete, isLoading, setIsLoading }: ReceiptUploaderProps) {
  const [dragActive, setDragActive] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file (JPEG, PNG, etc.)");
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File is too large. Maximum size is 5MB.");
      return;
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  const clearSelection = () => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const processReceipt = async () => {
    if (!selectedFile) return;

    setIsLoading(true);
    const formData = new FormData();
    formData.append("receipt", selectedFile);

    try {
      const response = await fetch("/api/scan", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to scan receipt");
      }

      const data: ScanResponse = await response.json();
      onScanComplete(data);
      toast.success("Receipt scanned successfully!");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="border-2 border-dashed bg-muted/30">
      <CardContent className="p-6">
        {previewUrl ? (
          <div className="space-y-4">
            <div className="relative aspect-auto max-h-[400px] w-full rounded-lg overflow-hidden flex items-center justify-center bg-black/5">
              <Button 
                variant="destructive" 
                size="icon" 
                className="absolute top-2 right-2 z-10 h-8 w-8 rounded-full"
                onClick={clearSelection}
                disabled={isLoading}
              >
                <X className="h-4 w-4" />
              </Button>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={previewUrl} 
                alt="Receipt Preview" 
                className="object-contain max-h-[400px]"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                variant="outline" 
                className="flex-1" 
                onClick={clearSelection}
                disabled={isLoading}
              >
                Choose Another
              </Button>
              <Button 
                className="flex-1" 
                onClick={processReceipt}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Scanning with AI...
                  </>
                ) : (
                  <>
                    <Scan className="mr-2 h-4 w-4" />
                    Process Receipt
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div
            className={`flex flex-col items-center justify-center py-12 px-4 transition-colors ${
              dragActive ? "bg-primary/5 rounded-lg" : ""
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
              <UploadCloud className="h-10 w-10 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Upload your receipt</h3>
            <p className="text-muted-foreground text-center mb-8 max-w-sm">
              Drag and drop your image here, or click to browse. We support JPG, PNG, and WebP up to 5MB.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <Button 
                onClick={() => inputRef.current?.click()} 
                className="w-full sm:w-auto"
              >
                <FileImage className="mr-2 h-4 w-4" />
                Browse Files
              </Button>
              {/* Note: In a real mobile app, capture="environment" on input type="file" opens camera */}
              <div className="relative">
                <Button 
                  variant="outline" 
                  className="w-full sm:w-auto"
                  onClick={() => {
                    if (inputRef.current) {
                      // Hack to trigger camera on mobile devices
                      inputRef.current.setAttribute("capture", "environment");
                      inputRef.current.click();
                      // Remove it after so regular browsing works next time
                      setTimeout(() => inputRef.current?.removeAttribute("capture"), 100);
                    }
                  }}
                >
                  <Camera className="mr-2 h-4 w-4" />
                  Take Photo
                </Button>
              </div>
            </div>
            
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleChange}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Temporary icon component to avoid adding another lucide import above
function Scan(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 7V5a2 2 0 0 1 2-2h2" />
      <path d="M17 3h2a2 2 0 0 1 2 2v2" />
      <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
      <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
      <path d="M7 12h10" />
    </svg>
  );
}
