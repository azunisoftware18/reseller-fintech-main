"use client";
import PublicPageWrapper from "@/components/public/PublicPageWrapper";
import { Scale, AlertTriangle, Globe, Gavel } from "lucide-react";

export default function TermsPage() {
  const sections = [
    {
      icon: <Globe size={20} />,
      title: "Service Agreement",
      text: "By accessing this platform, you agree to be bound by these Terms of Service and all applicable laws and regulations.",
    },
    {
      icon: <Scale size={20} />,
      title: "User Eligibility",
      text: "Users must be at least 18 years old and reside in a supported jurisdiction to open an account and conduct financial transactions.",
    },
  ];

  return (
    <PublicPageWrapper
      title="Terms & Conditions"
      subtitle="The legal framework governing your use of our financial technology services."
    >
      <div className="grid md:grid-cols-2 gap-6  mb-12">
        {sections.map((s, i) => (
          <div key={i} className="p-6 border border-slate-100 rounded-2xl">
            <div className="text-blue-600 mb-3">{s.icon}</div>
            <h4 className="font-bold mb-2">{s.title}</h4>
            <p className="text-sm  leading-relaxed">{s.text}</p>
          </div>
        ))}
      </div>

      <h2>1. Account Responsibilities</h2>
      <p>
        When you create an account with us, you must provide information that is
        accurate, complete, and current at all times. Failure to do so
        constitutes a breach of the Terms, which may result in immediate
        termination of your account.
      </p>
      <ul>
        <li>
          You are responsible for safeguarding the password used to access the
          Service.
        </li>
        <li>You agree not to disclose your password to any third party.</li>
        <li>
          You must notify us immediately upon becoming aware of any breach of
          security or unauthorized use of your account.
        </li>
      </ul>

      <h2>2. Prohibited Activities</h2>
      <p>
        You may not use the Service for any purpose that is unlawful or
        prohibited by these Terms. Prohibited activities include, but are not
        limited to:
      </p>
      <div className="bg-red-50 border-l-4 border-red-500 p-4 my-6 not-prose">
        <div className="flex items-center gap-2 text-red-700 font-bold mb-2">
          <AlertTriangle size={18} />
          <span>Restricted Usage</span>
        </div>
        <ul className="text-sm text-red-900 space-y-1 list-disc pl-5">
          <li>Money laundering or financing terrorist activities.</li>
          <li>Fraudulent exchange or deceptive financial maneuvers.</li>
          <li>Circumventing platform security or API rate limits.</li>
          <li>
            Using the service in a jurisdiction where such services are
            restricted.
          </li>
        </ul>
      </div>

      <h2>3. Intellectual Property</h2>
      <p>
        The Service and its original content (excluding content provided by
        users), features, and functionality are and will remain the exclusive
        property of the platform and its licensors. Our trademarks and trade
        dress may not be used in connection with any product or service without
        prior written consent.
      </p>

      <h2>4. Limitation of Liability</h2>
      <p>
        In no event shall the platform, nor its directors, employees, partners,
        or agents, be liable for any indirect, incidental, special,
        consequential, or punitive damages, including without limitation, loss
        of profits, data, use, goodwill, or other intangible losses, resulting
        from your access to or use of or inability to access or use the Service.
      </p>

      <h2>5. Governing Law</h2>
      <div className="flex items-start gap-4 p-6 border border-slate-200 rounded-2xl not-prose">
        <Gavel className="text-slate-400 shrink-0" size={24} />
        <p className="text-sm  italic">
          These Terms shall be governed and construed in accordance with the
          laws of the jurisdiction in which the platform is registered, without
          regard to its conflict of law provisions.
        </p>
      </div>

      <h2 className="mt-12">6. Changes to Terms</h2>
      <p>
        We reserve the right, at our sole discretion, to modify or replace these
        Terms at any time. If a revision is material, we will try to provide at
        least 30 days&apos; notice prior to any new terms taking effect.
      </p>
    </PublicPageWrapper>
  );
}
