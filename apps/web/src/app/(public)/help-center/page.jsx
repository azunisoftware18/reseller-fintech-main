import PublicPageWrapper from "@/components/public/PublicPageWrapper";
import { HelpCircle, CreditCard, Lock, UserCheck } from "lucide-react";

export default function HelpCenter() {
  const categories = [
    {
      title: "Payments",
      icon: <CreditCard />,
      desc: "Deposits, withdrawals & settlements",
    },
    {
      title: "Security",
      icon: <Lock />,
      desc: "2FA, passwords & account safety",
    },
    {
      title: "Verification",
      icon: <UserCheck />,
      desc: "KYC documents & identity help",
    },
    {
      title: "General",
      icon: <HelpCircle />,
      desc: "Platform features & navigation",
    },
  ];

  return (
    <PublicPageWrapper
      title="Help Center"
      subtitle="Find answers to your questions or reach out to our specialists."
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 not-prose mb-12">
        {categories.map((cat) => (
          <div
            key={cat.title}
            className="p-6 border border-slate-200 rounded-2xl hover:border-blue-500 hover:shadow-lg transition-all cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              {cat.icon}
            </div>
            <h4 className="font-bold ">{cat.title}</h4>
            <p className="text-sm mt-1">{cat.desc}</p>
          </div>
        ))}
      </div>

      <h2 className="text-center">Can&apos;t find what you need?</h2>
      <p className="text-center">
        Our support team typically responds within 2 hours during business
        sessions.
      </p>
    </PublicPageWrapper>
  );
}
