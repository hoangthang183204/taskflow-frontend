// components/VoiceInput.js
"use client";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export default function VoiceInput({ onResult, onListeningChange }) {
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = false;
      recognitionInstance.lang = 'vi-VN';
      
      recognitionInstance.onresult = (event) => {
        const text = event.results[0][0].transcript;
        console.log("Voice result:", text);
        onResult?.(text);
        setIsListening(false);
        onListeningChange?.(false);
        toast.success(`Đã nhận: "${text}"`);
      };
      
      recognitionInstance.onerror = (event) => {
        console.error("Voice error:", event.error);
        toast.error("Không thể nhận diện giọng nói");
        setIsListening(false);
        onListeningChange?.(false);
      };
      
      recognitionInstance.onend = () => {
        setIsListening(false);
        onListeningChange?.(false);
      };
      
      setRecognition(recognitionInstance);
    } else {
      console.log("Browser doesn't support speech recognition");
    }
  }, [onResult, onListeningChange]);

  const startListening = () => {
    if (recognition) {
      try {
        recognition.start();
        setIsListening(true);
        onListeningChange?.(true);
      } catch (error) {
        console.error("Error starting recognition:", error);
      }
    } else {
      toast.warning("Trình duyệt của bạn không hỗ trợ nhập giọng nói");
    }
  };

  const stopListening = () => {
    if (recognition) {
      recognition.stop();
      setIsListening(false);
      onListeningChange?.(false);
    }
  };

  return (
    <button
      type="button"
      onClick={isListening ? stopListening : startListening}
      className={`p-2 rounded-full transition-all ${
        isListening 
          ? "bg-red-500 text-white animate-pulse" 
          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
      }`}
      title={isListening ? "Đang nghe..." : "Nhập bằng giọng nói"}
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
          d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m-4 0h8m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
      </svg>
    </button>
  );
}