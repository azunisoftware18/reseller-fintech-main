"use client";

import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  Home,
  ShieldAlert,
  Lock,
  HelpCircle,
} from "lucide-react";

export default function UnauthorizedPage() {
  const handleGoBack = () => window.history.back();

  const suggestions = [
    "Contact admin for access",
    "Login with another account",
    "Check your subscription plan",
    "Review role permissions",
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-2xl bg-card border rounded-lg-border shadow-md-border overflow-hidden">
        <div className="h-2 bg-linear-to-r from-destructive via-destructive/70 to-destructive/30" />

        <div className="p-8">
          {/* Icon */}
          <div className="flex justify-center mb-6 relative">
            <div className="w-24 h-24 rounded-full bg-destructive/10 flex items-center justify-center">
              <ShieldAlert className="w-12 h-12 text-destructive" />
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-destructive rounded-full flex items-center justify-center animate-pulse">
              <Lock className="w-4 h-4 text-white" />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-4xl font-bold text-center mb-2">
            403 - Access Denied
          </h1>

          <p className="text-center text-muted-foreground mb-6">
            You don’t have permission to access this page.
          </p>

          {/* Info Box */}
          <div className="mb-6 p-4 bg-destructive/5 border border-destructive/20 rounded-lg-border flex gap-3">
            <AlertCircle className="w-5 h-5 text-destructive mt-1" />
            <div>
              <p className="text-sm text-muted-foreground">Possible reasons:</p>
              <ul className="text-sm text-muted-foreground ml-4 list-disc">
                <li>RBAC restriction</li>
                <li>Plan limitation</li>
                <li>Session expired</li>
              </ul>
            </div>
          </div>

          {/* Suggestions */}
          <div className="mb-6">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-primary" />
              What you can do:
            </h3>

            <div className="grid md:grid-cols-2 gap-2 text-sm text-muted-foreground">
              {suggestions.map((s, i) => (
                <div key={i} className="flex gap-2">
                  <span>•</span> {s}
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-border bg-primary text-primary-foreground hover:bg-primary/90 transition font-medium"
            >
              <Home className="w-4 h-4" />
              Dashboard
            </Link>

            <button
              onClick={handleGoBack}
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-border border border-border bg-background hover:bg-muted transition font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
