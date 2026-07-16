"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import Image from "next/image";

const services = [
  {
    title: "Custom Payroll Solutions",
    desc: "Streamlined payroll services to ensure timely and accurate employee payments every time.",
    details:
      "We handle tax filings, employee benefits, compliance, salary structures, and reporting with precision.",
  },
  {
    title: "Financial Statement",
    desc: "Professional preparation of financial reports and balance sheets.",
    details:
      "Includes P&L, balance sheet, cash flow analysis, forecasting, and financial advisory insights.",
  },
  {
    title: "Tax Planning",
    desc: "Smart tax strategies to reduce liabilities.",
    details:
      "Year-round tax planning, deductions optimization, audit defense, and regulatory compliance.",
  },
];

export default function ServicesSection() {
  const [active, setActive] = useState(null);

  return (
    <section className="py-28 bg-background">
      <div className="container mx-auto px-6 grid lg:grid-cols-2 gap-16 items-start">
        {/* LEFT SERVICES LIST */}
        <div className="space-y-6">
          <h2 className="text-5xl font-bold mb-6">
            Achieving financial clarity through services
          </h2>

          {services.map((service, i) => (
            <div
              key={i}
              onClick={() => setActive(service)}
              className="bg-card p-8 rounded-xl shadow-border cursor-pointer hover:shadow-md-border transition"
            >
              <h3 className="text-xl font-semibold mb-2">{service.title}</h3>
              <p className="text-muted-foreground">{service.desc}</p>
            </div>
          ))}
        </div>

        {/* RIGHT IMAGE */}
        <div>
          <Image
            width={1024}
            height={768}
            src="https://framerusercontent.com/images/CQ9xcxgDhNL3pXQtXkl0gKrxY.jpg?scale-down-to=1024"
            alt="logo"
            className="rounded-2xl shadow-lg-border"
          />
        </div>
      </div>

      {/* SLIDING PANEL */}
      <AnimatePresence>
        {active && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ duration: 0.4 }}
            className="fixed bottom-0 left-0 w-full bg-card shadow-2xl border-t border-border p-10 rounded-t-3xl z-50"
          >
            <div className="max-w-5xl mx-auto relative">
              <button
                onClick={() => setActive(null)}
                className="absolute right-0 top-0"
              >
                <X />
              </button>

              <h3 className="text-3xl font-bold mb-4">{active.title}</h3>
              <p className="text-muted-foreground mb-6">{active.details}</p>

              <button className="bg-theme text-primary-foreground px-6 py-3 rounded-lg">
                Learn More
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
