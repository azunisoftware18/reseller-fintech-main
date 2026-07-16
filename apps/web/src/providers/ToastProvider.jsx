"use client";

import ToastContainer from "@/components/ToastContainer";
import { registerToastHandler } from "@/lib/toast";
import { useState, useCallback, useEffect } from "react";

export default function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((type, message) => {
    const id = crypto.randomUUID();

    setToasts((prev) => [...prev, { id, type, message }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 2500);
  }, []);

  useEffect(() => {
    registerToastHandler(showToast);
  }, [showToast]);

  return (
    <>
      {children}
      <ToastContainer toasts={toasts} />
    </>
  );
}
