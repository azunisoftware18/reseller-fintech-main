"use client";

import Button from "@/components/ui/Button";
import { AlertTriangle, Home, ArrowLeft } from "lucide-react";
import { useSelector } from "react-redux";

export default function NotFound() {
  const { isAuthenticated } = useSelector((s) => s.auth);
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-primary px-4">
      <div className="relative glass rounded-lg-border shadow-lg-border p-10 max-w-md w-full text-center border border-border/60">
        {/* Decorative glow */}
        <div className="absolute -top-6 -left-6 h-24 w-24 bg-primary/20 rounded-full blur-3xl opacity-40" />
        <div className="absolute -bottom-6 -right-6 h-24 w-24 bg-theme/20 rounded-full blur-3xl opacity-40" />

        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="h-18 w-18 rounded-full bg-destructive/10 flex items-center justify-center shadow-inner">
            <AlertTriangle className="h-9 w-9 text-destructive" />
          </div>
        </div>

        {/* 404 */}
        <h1 className="text-7xl font-extrabold text-gradient-theme mb-3">
          404
        </h1>

        <p className="text-xl font-semibold text-foreground mb-2">
          Page Not Found
        </p>

        <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
          The page you&apos;re trying to access doesn&apos;t exist, was removed,
          or you don&apos;t have permission to view it.
        </p>

        {/* Actions - Using Button Component */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {isAuthenticated && (
            <Button
              href="/dashboard"
              variant="default"
              icon={Home}
              iconPosition="left"
              size="default"
            >
              Go to Dashboard
            </Button>
          )}
          <Button
            href="/"
            variant="secondary"
            icon={ArrowLeft}
            iconPosition="left"
            size="default"
          >
            Go Home
          </Button>
        </div>

        {/* Footer note */}
        <p className="mt-8 text-xs text-muted-foreground">
          If you believe this is an error, please contact support.
        </p>
      </div>
    </div>
  );
}
