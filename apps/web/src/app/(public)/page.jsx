"use client";

import { useWebsite } from "@/hooks/useTenantWebsite";
import AccountingHero from "@/components/public/Hero";
import StatsSection from "@/components/public/StatsSection";
import AboutSection from "@/components/public/AboutSection";
import ServicesSection from "@/components/public/ServicesSection";
import FinalCTA from "@/components/public/FinalCTA";
import TestimonialSection from "@/components/public/TestimonialSection";

export default function HomePage() {
  const website = useWebsite();
  if (!website) return null;

  return (
    <div className="bg-background text-foreground overflow-hidden">
      <AccountingHero />
      <StatsSection />
      <AboutSection />
      <ServicesSection />
      <TestimonialSection />
      <FinalCTA />
    </div>
  );
}
