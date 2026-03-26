"use client";
import { useState, useRef, useCallback } from "react";

export function useCamera() {
  const [isCapturing, setIsCapturing] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsCapturing(true);
    } catch (err) {
      console.error("Camera access denied:", err);
    }
  }, []);

  const capturePhoto = useCallback(async (): Promise<File | null> => {
    if (!videoRef.current) return null;

    const canvas = document.createElement("canvas");
    const video = videoRef.current;

    // Resize to max 1024px
    const maxSize = 1024;
    const ratio = Math.min(
      maxSize / video.videoWidth,
      maxSize / video.videoHeight,
      1
    );
    canvas.width = video.videoWidth * ratio;
    canvas.height = video.videoHeight * ratio;

    const ctx = canvas.getContext("2d");
    ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);

    return new Promise<File | null>((resolve) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(new File([blob], "capture.jpg", { type: "image/jpeg" }));
          } else {
            resolve(null);
          }
        },
        "image/jpeg",
        0.85
      );
    });
  }, []);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setIsCapturing(false);
    setPreview(null);
  }, []);

  const handleFileUpload = useCallback((file: File): File => {
    const url = URL.createObjectURL(file);
    setPreview(url);
    return file;
  }, []);

  return {
    isCapturing,
    preview,
    videoRef,
    startCamera,
    capturePhoto,
    stopCamera,
    handleFileUpload,
  };
}
