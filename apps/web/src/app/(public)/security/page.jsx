"use client";
import PublicPageWrapper from "@/components/public/PublicPageWrapper";
import { ShieldCheck, Lock, Smartphone, Globe } from "lucide-react";

export default function SecurityPage() {
  const features = [
    {
      icon: <Lock />,
      title: "AES-256 Encryption",
      desc: "Data is encrypted at rest and in transit.",
    },
    {
      icon: <Smartphone />,
      title: "Two-Factor (2FA)",
      desc: "Mandatory 2FA for all withdrawals.",
    },
    {
      icon: <ShieldCheck />,
      title: "Fraud Detection",
      desc: "AI-powered monitoring for suspicious IP logins.",
    },
    {
      icon: <Globe />,
      title: "Secure APIs",
      desc: "Hardened endpoints with rate limiting.",
    },
  ];

  return (
    <PublicPageWrapper
      title="Security"
      subtitle="Protecting your assets with industry-leading technology and protocols."
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 not-prose mb-12">
        {features.map((f, i) => (
          <div
            key={i}
            className="flex gap-4 p-6 border border-slate-200 rounded-2xl"
          >
            <div className="text-blue-600">{f.icon}</div>
            <div>
              <h4 className="font-bold ">{f.title}</h4>
              <p className="text-sm ">{f.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <h2>Multi-Layer Protection</h2>
      <p>
        Our security architecture is modeled after top-tier banking systems. We
        utilize
        <strong> Multi-Signature (Multi-Sig)</strong> wallets for large asset
        movements and conduct regular third-party security audits to identify
        and patch vulnerabilities.
      </p>

      <div className="mt-8 p-8 bg-blue-600 rounded-3xl text-white text-center">
        <h3 className="">Your Security is our Priority</h3>
        <p className="text-blue-100">
          If you suspect any unauthorized activity on your account, please
          freeze your account immediately via the dashboard.
        </p>
      </div>
    </PublicPageWrapper>
  );
}
