"use client";

import { useState } from "react";
import { useCreateFundRequest } from "@/hooks/useFundRequest";
import FundRequestModal from "../modals/FundRequestModal";
import { useRouter } from "next/navigation";

export default function FundRequestClient() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(true);
  const { mutate, isPending } = useCreateFundRequest();

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleSubmit = (data, setError) => {
    mutate(data, {
      onSuccess: () => {
        setIsOpen(false);
        router.push("/dashboard");
      },
      onError: (error) => {
        setError("root", {
          message:
            error?.response?.data?.message || "Failed to create fund request",
        });
      },
    });
  };

  return (
    <FundRequestModal
      isOpen={isOpen}
      onSubmit={handleSubmit}
      isPending={isPending}
      onClose={handleClose}
    />
  );
}
