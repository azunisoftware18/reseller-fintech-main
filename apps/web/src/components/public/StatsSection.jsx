"use client";

import { motion } from "framer-motion";
import CountUp from "react-countup";

export default function StatsSection() {
  const stats = [
    { value: 96, suffix: "%", label: "Client Satisfaction Rate" },
    { value: 20, suffix: "+", label: "Years of Experience" },
    { value: 500, suffix: "", label: "Successful Tax Filings Annually" },
    { value: 50, suffix: "+", label: "Tax Professionals on Team" },
  ];

  return (
    <section className="py-24 bg-background text-center overflow-hidden">
      <div className="container mx-auto px-6">
        {/* Animated Heading */}
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-4xl font-bold mb-16"
        >
          Transforming numbers into financial success
        </motion.h2>

        {/* Stats Grid */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={{
            hidden: {},
            visible: {
              transition: { staggerChildren: 0.2 },
            },
          }}
          className="grid grid-cols-2 md:grid-cols-4 gap-12"
        >
          {stats.map((stat, i) => (
            <motion.div
              key={i}
              variants={{
                hidden: { opacity: 0, y: 40 },
                visible: { opacity: 1, y: 0 },
              }}
              whileHover={{ scale: 1.05 }}
              className="space-y-4 bg-card/40 backdrop-blur-sm p-6 rounded-xl shadow-border transition"
            >
              <div className="text-5xl font-bold text-theme">
                <CountUp end={stat.value} duration={2} suffix={stat.suffix} />
              </div>

              <div className="h-px bg-border w-20 mx-auto" />

              <p className="text-muted-foreground text-sm tracking-wide">
                {stat.label}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
