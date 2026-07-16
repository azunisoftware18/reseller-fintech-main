"use client";

import {
  Facebook,
  Twitter,
  Linkedin,
  Mail,
  Phone,
  Globe,
  Instagram,
  Youtube,
} from "lucide-react";
import Button from "@/components/ui/Button";
import { useWebsite } from "@/hooks/useTenantWebsite";
import Link from "next/link";

const DEFAULT_FOOTER_PAGES = {
  company: [
    { title: "About", slug: "about-us" },
    { title: "Contact", slug: "contact" },
  ],
  resources: [
    { title: "Help Center", slug: "help-center" },
    { title: "Security", slug: "security" },
  ],
  legal: [
    { title: "Privacy Policy", slug: "privacy-policy" },
    { title: "Terms", slug: "terms" },
    { title: "Refund Policy", slug: "refund-policy" },
    { title: "KYC Policy", slug: "kyc-policy" },
  ],
};

export default function Footer() {
  const website = useWebsite();
  if (!website) return null;

  const social = website.socialLinks || {};
  const socialItems = [
    { icon: Instagram, href: social.instagram, label: "Instagram" },
    { icon: Facebook, href: social.facebook, label: "Facebook" },
    { icon: Twitter, href: social.twitter, label: "Twitter" },
    { icon: Linkedin, href: social.linkedin, label: "LinkedIn" },
    { icon: Youtube, href: social.youtube, label: "YouTube" },
  ].filter((s) => s.href);

  const tenantPages = website.footerPages || {};
  const companyPages = tenantPages.company || DEFAULT_FOOTER_PAGES.company;
  const resourcePages = tenantPages.resources || DEFAULT_FOOTER_PAGES.resources;
  const legalPages = tenantPages.legal || DEFAULT_FOOTER_PAGES.legal;

  return (
    <footer className="bg-card border-t border-border text-card-foreground">
      <div className="mx-32 px-4 sm:px-6 lg:px-8">
        {/* TOP SECTION */}
        <div className="py-12 sm:py-16 grid gap-10 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-bold">
              {website.brandName}
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {website.tagLine}
            </p>

            <div className="space-y-2 text-sm text-muted-foreground">
              {website.supportPhone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  {website.supportPhone}
                </div>
              )}
              {website.supportEmail && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  {website.supportEmail}
                </div>
              )}
            </div>
          </div>

          {/* Company */}
          <FooterColumn title="Company" pages={companyPages} />

          {/* Resources */}
          <FooterColumn title="Resources" pages={resourcePages} />

          {/* Social */}
          <div className="space-y-4 sm:col-span-2 lg:col-span-1">
            <h3 className="font-semibold">Connect</h3>

            <div className="flex flex-wrap gap-3">
              {socialItems.map((s) => (
                <Button
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  variant="ghost"
                  size="icon"
                  className="bg-muted hover:bg-accent"
                  icon={s.icon}
                />
              ))}
            </div>

            {website.brandName?.toLowerCase().includes("azzunique") && (
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Globe className="h-4 w-4" />
                Multi-tenant SaaS Platform
              </div>
            )}
          </div>
        </div>

        {/* BOTTOM LEGAL */}
        <div className="border-t border-border py-6 text-center text-muted-foreground text-xs sm:text-sm space-y-3">
          <p>© 2026 {website.brandName}. All rights reserved.</p>

          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
            {legalPages.map((page) => (
              <Button
                key={page.slug}
                href={`/${page.slug}`}
                variant="link"
                className="p-0 h-auto"
              >
                {page.title}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

/* Reusable column */
function FooterColumn({ title, pages }) {
  return (
    <div className="space-y-4 flex flex-col">
      <h3 className="font-semibold">{title}</h3>
      <div className="flex flex-col gap-2 text-sm">
        {pages.map((page) => (
          <Link
            key={page.slug}
            href={`/${page.slug}`}
            className="p-0 h-auto text-muted-foreground w-fit"
          >
            {page.title}
          </Link>
        ))}
      </div>
    </div>
  );
}
