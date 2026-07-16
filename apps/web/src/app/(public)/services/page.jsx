"use client";

import { useSelector } from "react-redux";

const services = [
  {
    title: "Digital Wallet Solutions",
    desc: "Secure and scalable wallet systems with real-time transaction processing.",
    icon: "💳",
  },
  {
    title: "Payment Gateway Integration",
    desc: "Seamless integration with global payment networks and APIs.",
    icon: "🌍",
  },
  {
    title: "API Banking Infrastructure",
    desc: "Robust APIs enabling fintech apps and digital banking services.",
    icon: "🔗",
  },
  {
    title: "Fraud Detection Systems",
    desc: "AI-powered monitoring to protect transactions and user data.",
    icon: "🛡️",
  },
  {
    title: "White-label Fintech Platform",
    desc: "Launch your own branded fintech ecosystem with our technology stack.",
    icon: "🏦",
  },
  {
    title: "Real-time Analytics",
    desc: "Track transactions, users, and revenue with live dashboards.",
    icon: "📊",
  },
];

export default function ServicesPage() {
  const website = useSelector((s) => s.tenantWebsite.currentWebsite);

  if (!website) return null;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* HERO */}
      <section
        className="py-24 text-center text-white  bg-primary"
      >
        <h1 className="text-5xl font-extrabold mb-4">Our Services</h1>
        <p className="max-w-2xl mx-auto text-lg opacity-90">
          {website.brandName} delivers next-generation fintech solutions
          designed for speed, security, and scalability.
        </p>
      </section>

      {/* SERVICES GRID  */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
          {services.map((service) => (
            <div
              key={service.title}
              className="p-8 rounded-2xl border border-border bg-muted/40 hover:shadow-lg transition"
            >
              <div
                className="text-4xl mb-4"
              >
                {service.icon}
              </div>
              <h3 className="text-xl font-bold mb-3">{service.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {service.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 text-center text-white  bg-primary">
        <h2 className="text-3xl font-bold mb-6">
          Ready to build with {website.brandName}?
        </h2>
        <p className="opacity-90 mb-6">
          Let&apos;s create powerful financial solutions together.
        </p>
        <button className="px-8 py-3 bg-white text-black font-semibold rounded-lg shadow hover:bg-primary/90">
          Get Started
        </button>
      </section>
    </div>
  );
}
