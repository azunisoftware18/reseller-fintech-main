"use client";

import { useState, useCallback, useEffect } from "react";
import { useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import KycSubmitModal from "@/components/modals/KycSubmitModal";
import Button from "@/components/ui/Button";
import { toast } from "@/lib/toast";
import { useSubmitKyc, useResubmitKyc, useKycStatus } from "@/hooks/useKyc";
import { CheckCircle, Clock, XCircle } from "lucide-react";

export default function KycReqClient() {
  const router = useRouter();
  const userData = useSelector((s) => s.auth.user);

  const [isKycModalOpen, setIsKycModalOpen] = useState(false);
  const [isResubmit, setIsResubmit] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const { data: myKycData, refetch: refetchMyKyc } = useKycStatus(
    userData?.user?.id,
  );

  const {
    mutate: submitKyc,
    isPending: submitting,
    reset: resetSubmit,
  } = useSubmitKyc();

  const {
    mutate: resubmitKyc,
    isPending: resubmitting,
    reset: resetResubmit,
  } = useResubmitKyc();

  // Auto-redirect if KYC is approved
  useEffect(() => {
    if (myKycData?.data?.status === "APPROVED") {
      router.push("/dashboard");
    }
  }, [myKycData?.data?.status, router]);

  const handleSubmitKyc = useCallback(
    (formData, setFormError) => {
      // Determine which mutation to use
      const action = isResubmit ? resubmitKyc : submitKyc;

      // Reset mutation state BEFORE calling mutate (clears previous error states)
      if (isResubmit) resetResubmit();
      else resetSubmit();

      setSubmitError(null); // Clear local error state

      action(formData, {
        onSuccess: () => {
          toast.success(
            isResubmit
              ? "KYC resubmitted successfully"
              : "KYC submitted successfully",
          );
          setIsKycModalOpen(false);
          setSubmitError(null);
          refetchMyKyc();
        },
        onError: (err) => {
          console.error("KYC Submission Error:", err);

          const errorMessage =
            err?.message ||
            err?.response?.data?.message ||
            "Submission failed. Please try again.";
          setSubmitError(errorMessage);

          // Handle FIELD errors
          if (err?.type === "FIELD" && Array.isArray(err.errors)) {
            err.errors.forEach(({ field, message }) => {
              try {
                setFormError(field, { type: "server", message });
              } catch (e) {
                // Field doesn't exist in form
              }
            });

            const allMessages = err.errors
              .map((e) => `${e.field}: ${e.message}`)
              .join(", ");
            setFormError("root", {
              type: "server",
              message: allMessages || errorMessage,
            });
            return;
          }

          // Handle validation errors from backend
          if (err?.errors && Array.isArray(err.errors)) {
            const allMessages = err.errors
              .map((e) => `${e.field}: ${e.message}`)
              .join(", ");
            setFormError("root", {
              type: "server",
              message: allMessages || errorMessage,
            });
            return;
          }

          // Non-field errors
          setFormError("root", {
            type: "server",
            message: errorMessage,
          });
        },
      });
    },
    [
      isResubmit,
      resubmitKyc,
      submitKyc,
      refetchMyKyc,
      resetSubmit,
      resetResubmit,
    ],
  );

  const handleOpenKycModal = () => {
    const kycStatus = myKycData?.data?.status;
    setIsResubmit(kycStatus === "REJECTED");
    setSubmitError(null);

    // Reset mutation states when opening modal so previous errors don't block
    resetSubmit();
    resetResubmit();

    setIsKycModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsKycModalOpen(false);
    setSubmitError(null);
  };

  const kycStatus = myKycData?.data?.status;

  const renderContent = () => {
    switch (kycStatus) {
      case "APPROVED":
        return (
          <div className="bg-card border border-border rounded-lg shadow-xl w-full max-w-md p-8 text-center">
            <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-success" />
            </div>
            <h2 className="text-2xl font-bold mb-2">KYC Approved</h2>
            <p className="text-muted-foreground mb-6">
              Your KYC has been approved. Redirecting to dashboard...
            </p>
            <Button
              onClick={() => router.push("/dashboard")}
              className="w-full"
            >
              Go to Dashboard
            </Button>
          </div>
        );

      case "PENDING":
        return (
          <div className="bg-card border border-border rounded-lg shadow-xl w-full max-w-md p-8 text-center">
            <div className="w-16 h-16 bg-warning/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8 text-warning" />
            </div>
            <h2 className="text-2xl font-bold mb-2">KYC Under Review</h2>
            <p className="text-muted-foreground mb-6">
              Your KYC has been submitted and is pending approval. Please wait
              while we verify your documents.
            </p>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Submitted at:{" "}
                {new Date(myKycData?.data?.submittedAt).toLocaleString()}
              </p>
              <Button
                onClick={() => refetchMyKyc()}
                variant="outline"
                className="w-full"
              >
                Check Status
              </Button>
            </div>
          </div>
        );

      case "REJECTED":
        return (
          <div className="bg-card border border-border rounded-lg shadow-xl w-full max-w-md p-8 text-center">
            <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-8 h-8 text-destructive" />
            </div>
            <h2 className="text-2xl font-bold mb-2">KYC Rejected</h2>
            <p className="text-muted-foreground mb-4">
              Your KYC was rejected. Please review the reason and resubmit.
            </p>
            {myKycData?.data?.rejectionReason && (
              <div className="mb-6 p-3 bg-destructive/10 border border-destructive rounded-lg overflow-hidden">
                <p className="text-sm text-destructive font-medium wrap-break-word whitespace-pre-wrap">
                  Reason: {myKycData?.data?.rejectionReason}
                </p>
              </div>
            )}
            <Button onClick={handleOpenKycModal} className="w-full">
              Resubmit KYC
            </Button>
          </div>
        );

      default:
        return (
          <div className="bg-card border border-border rounded-lg shadow-xl w-full max-w-md p-8 text-center">
            <div className="w-16 h-16 bg-warning/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-warning"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold mb-2">
              KYC Verification Required
            </h2>
            <p className="text-muted-foreground mb-6">
              Please complete your KYC verification to access the dashboard.
            </p>

            {submitError && (
              <div className="mb-4 p-3 bg-destructive/10 border border-destructive rounded-lg">
                <p className="text-sm text-destructive">{submitError}</p>
              </div>
            )}

            <Button onClick={handleOpenKycModal} className="w-full">
              Submit KYC
            </Button>
          </div>
        );
    }
  };

  return (
    <>
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        {renderContent()}
      </div>

      <KycSubmitModal
        open={isKycModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmitKyc}
        isPending={submitting || resubmitting}
        userId={userData?.user?.id}
        isResubmit={isResubmit}
        kycId={myKycData?.data?.id}
        initialData={isResubmit ? myKycData?.data : null}
      />
    </>
  );
}
