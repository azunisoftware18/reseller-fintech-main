"use client";
import PublicPageWrapper from "@/components/public/PublicPageWrapper";

export default function PrivacyPolicy() {
  return (
    <PublicPageWrapper
      title="Privacy Policy"
      subtitle="Transparency regarding how we handle and protect your personal information."
    >
      <h2>1. Information We Collect</h2>
      <p>To provide our financial services, we collect:</p>
      <ul>
        <li>
          <strong>Personal Identifiers:</strong> Name, email, date of birth, and
          address.
        </li>
        <li>
          <strong>Financial Data:</strong> Transaction history and payment
          methods.
        </li>
        <li>
          <strong>Technical Data:</strong> IP address, device type, and login
          logs for security.
        </li>
      </ul>

      <h2>2. How We Use Your Data</h2>
      <p>We use your information strictly to:</p>
      <ul>
        <li>Process transactions and prevent fraudulent activity.</li>
        <li>Comply with legal and regulatory requirements.</li>
        <li>Provide technical support and improve platform performance.</li>
      </ul>

      <div className="p-6 bg-slate-900 text-white rounded-2xl my-8">
        <h4 className="text-white mt-0">Our Privacy Promise</h4>
        <p className="text-slate-300 mb-0 text-sm">
          We do not sell, rent, or trade your personal data to third-party
          advertisers. Your data is used solely for the functionality and
          security of your account.
        </p>
      </div>
    </PublicPageWrapper>
  );
}
