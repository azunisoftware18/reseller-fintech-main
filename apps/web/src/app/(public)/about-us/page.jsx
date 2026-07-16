"use client";

import Image from "next/image";
import { useEffect } from "react";
import { useSelector } from "react-redux";

export default function AboutUsPage() {
  const website = useSelector((s) => s.tenantWebsite.currentWebsite);

  useEffect(() => {
    if (website?.brandName) {
      document.title = `About ${website.brandName}`;
    }
  }, [website]);

  if (!website) return null;

  const isSuperAdmin = website.brandName?.toLowerCase().includes("azzunique");
  const isReseller = !isSuperAdmin;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* HERO SECTION */}
      <section className="relative py-24 overflow-hidden text-white bg-primary">
        <div className="absolute inset-0 bg-linear-to-b from-black/30 to-black/70" />
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />

        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
          {website.logoUrl && (
            <div className="inline-block p-4 bg-white rounded-2xl mb-8 shadow-xl">
              <Image
                width={120}
                height={120}
                src={website.logoUrl}
                alt={`${website.brandName} logo`}
                className="h-16 w-auto object-contain"
              />
            </div>
          )}

          <h1 className="text-5xl font-extrabold tracking-tight mb-4">
            {isSuperAdmin
              ? "The Backbone of Digital Finance"
              : `About ${website.brandName}`}
          </h1>

          <p className="max-w-2xl mx-auto text-xl text-white/90">
            {website.tagLine ||
              "Empowering the next generation of financial inclusion."}
          </p>
        </div>
      </section>

      {/* CORE IDENTITY */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-widest text-primary mb-2">
              Our Identity
            </h2>
            <h3 className="text-3xl font-bold mb-6">
              {isSuperAdmin
                ? "Architecting Global Fintech Infrastructure"
                : "Your Trusted Partner in Financial Growth"}
            </h3>

            <p className="text-lg leading-relaxed text-muted-foreground mb-6">
              {isSuperAdmin
                ? `Azzunique is a premier technology provider specializing in robust, scalable financial ecosystems. We provide the infrastructure that powers resellers and financial institutions globally.`
                : `${website.brandName} delivers secure, high-speed financial services designed for modern users. Leveraging world-class technology, we ensure your capital is managed with precision and integrity.`}
            </p>
          </div>

          <div className="bg-muted/40 rounded-3xl p-8 border border-border shadow-sm">
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-primary font-bold">01</span>
                </div>
                <div>
                  <h4 className="font-bold">Secure Infrastructure</h4>
                  <p className="text-sm text-muted-foreground">
                    Bank-grade encryption and multi-layer security protocols.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-primary font-bold">02</span>
                </div>
                <div>
                  <h4 className="font-bold">Real-time Processing</h4>
                  <p className="text-sm text-muted-foreground">
                    Instant settlements and seamless API integrations.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MISSION & VISION */}
      <section className="py-20 border-y border-border bg-background">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 px-6">
          <div className="p-10 rounded-2xl shadow-sm border border-border bg-muted/40">
            <h3 className="text-2xl font-bold mb-4">Our Mission</h3>
            <p className="text-muted-foreground">
              {isSuperAdmin
                ? "To democratize financial technology by providing turnkey solutions for resellers worldwide."
                : "To provide accessible, transparent, and innovative financial tools for every individual."}
            </p>
          </div>

          <div className="p-10 rounded-2xl shadow-sm border border-border bg-muted/40">
            <h3 className="text-2xl font-bold mb-4">Our Vision</h3>
            <p className="text-muted-foreground">
              {isReseller
                ? "To lead the regional market as the most reliable distributor of digital banking services."
                : "To bridge the gap between traditional finance and the digital future."}
            </p>
          </div>
        </div>
      </section>

      {/* FOOTER CTA SECTION */}
      <section className="py-24 text-center px-6 text-white  bg-primary">
        <h2 className="text-3xl font-bold mb-8">Ready to evolve?</h2>

        <div className="flex flex-col md:flex-row justify-center items-center gap-8 text-lg">
          <div className="flex items-center gap-3">
            <span className="opacity-80">Support:</span>
            <span className="font-semibold">{website.supportEmail}</span>
          </div>

          <div className="hidden md:block w-px h-6 bg-white/40" />

          <div className="flex items-center gap-3">
            <span className="opacity-80">Contact:</span>
            <span className="font-semibold">{website.supportPhone}</span>
          </div>
        </div>
      </section>
    </div>
  );
}
