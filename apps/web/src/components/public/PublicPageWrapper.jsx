"use client";
import { useSelector } from "react-redux";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function PublicPageWrapper({ title, subtitle, children }) {
  const website = useSelector((s) => s.tenantWebsite.currentWebsite);

  if (!website) return null;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* HERO SECTION (same as About) */}
      <section className="relative py-24 overflow-hidden text-white bg-primary">
        <div className="absolute inset-0 bg-linear-to-b from-black/30 to-black/70" />
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />

        <div className="relative z-10 max-w-5xl mx-auto px-6">
          <Link
            href="/"
            className="inline-flex items-center text-sm text-white/70 hover:text-white transition mb-8"
          >
            <ArrowLeft size={16} className="mr-2" /> Back to Home
          </Link>

          <h1 className="text-5xl font-extrabold tracking-tight mb-4">
            {title}
          </h1>

          {subtitle && (
            <p className="text-lg text-white/80 max-w-2xl">{subtitle}</p>
          )}
        </div>
      </section>

      {/* CONTENT SECTION (dark themed) */}
      <section className="max-w-5xl mx-auto px-6 py-20">
        <article className="prose prose-invert max-w-none prose-headings:text-white prose-p:text-white/80 prose-strong:text-white prose-li:text-white/70">
          {children}
        </article>
      </section>

      {/* FOOTER CTA (same theme) */}
      <section className="py-20 text-center text-white bg-primary border-t border-white/10">
        <h2 className="text-2xl font-bold mb-4">
          Need more help from {website.brandName}?
        </h2>
        <div className="flex flex-col md:flex-row justify-center items-center gap-6 text-sm opacity-90">
          <span>{website.supportEmail}</span>
          <span className="hidden md:block">|</span>
          <span>{website.supportPhone}</span>
        </div>
      </section>
    </div>
  );
}
