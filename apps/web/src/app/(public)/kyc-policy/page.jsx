"use client";
import PublicPageWrapper from "@/components/public/PublicPageWrapper";
import { UserCheck, FileText, Camera } from "lucide-react";

export default function KYCPolicy() {
  const steps = [
    {
      icon: <FileText size={20} />,
      title: "Identity Document",
      desc: "Valid Passport, National ID, or Driver's License.",
    },
    {
      icon: <Camera size={20} />,
      title: "Liveness Check",
      desc: "A quick selfie to verify you are the document holder.",
    },
    {
      icon: <UserCheck size={20} />,
      title: "Verification",
      desc: "Our compliance team reviews details within 24 hours.",
    },
  ];

  return (
    <PublicPageWrapper
      title="KYC Policy"
      subtitle="Know Your Customer protocols to ensure a safe and verified financial ecosystem."
    >
      <h2>Why we verify identity</h2>
      <p>
        As a regulated fintech entity, we are required to verify the identity of
        our users. This prevents identity theft, financial fraud, and ensures
        that our services remain compliant with global banking standards.
      </p>

      <div className="grid md:grid-cols-3 gap-6 my-10 not-prose">
        {steps.map((step, i) => (
          <div
            key={i}
            className="p-6 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col items-center text-center"
          >
            <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center mb-4">
              {step.icon}
            </div>
            <h4 className="font-bold text-slate-900 mb-1">{step.title}</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              {step.desc}
            </p>
          </div>
        ))}
      </div>

      <h2>Data Protection</h2>
      <p>
        All documents uploaded during the KYC process are encrypted using
        bank-grade security protocols and stored in highly secure, isolated
        servers. We never share your personal identity data with unauthorized
        third parties.
      </p>
    </PublicPageWrapper>
  );
}
