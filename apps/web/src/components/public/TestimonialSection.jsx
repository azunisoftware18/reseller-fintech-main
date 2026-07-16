"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

const testimonials = [
  {
    name: "Natalie Evans",
    role: "CEO of Innovatech Solutions",
    image:
      "https://framerusercontent.com/images/evT8pi4EF2q0Uvlr9LtqiMharto.jpg",
    text: "Unmatched service and expertise! They revolutionized our financial strategy, unlocking significant savings while enhancing operational efficiency to drive exceptional results.",
  },
  {
    name: "James Carter",
    role: "Founder, FinCore",
    image:
      "https://framerusercontent.com/images/8aTY9vGkN9TQEIYwZRFL0RyBJk.jpg",
    text: "Their accounting guidance helped us scale with confidence. Highly professional and incredibly responsive.",
  },
];

export default function TestimonialSection() {
  const [index, setIndex] = useState(0);

  const next = () => setIndex((p) => (p + 1) % testimonials.length);
  const prev = () =>
    setIndex((p) => (p - 1 + testimonials.length) % testimonials.length);

  const t = testimonials[index];

  return (
    <section className="py-16 sm:py-20 lg:py-28 text-foreground">
      <div className="container mx-auto px-4 sm:px-6 text-center">
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-12 lg:mb-16"
        >
          Client testimonials and success stories
        </motion.h2>

        <div className="relative rounded-2xl border border-border bg-card p-6 sm:p-8 lg:p-12 shadow-lg-border flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
          {/* IMAGE */}
          <motion.div
            key={t.image}
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
            className="shrink-0"
          >
            <Image
              width={200}
              height={200}
              alt="client"
              src={t.image}
              className="w-32 h-32 sm:w-40 sm:h-40 lg:w-48 lg:h-48 object-cover rounded-xl shadow-md-border"
            />
          </motion.div>

          {/* TEXT */}
          <div className="flex-1 text-center lg:text-left">
            <motion.h4
              key={t.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-lg sm:text-xl font-semibold"
            >
              {t.name}
            </motion.h4>

            <p className="text-foreground/70 text-sm mb-4">{t.role}</p>

            <AnimatePresence mode="wait">
              <motion.p
                key={t.text}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="text-base sm:text-lg lg:text-2xl leading-relaxed"
              >
                {t.text}
              </motion.p>
            </AnimatePresence>
          </div>

          {/* NAVIGATION */}
          <div className="flex lg:flex-col gap-3 lg:absolute lg:right-6 lg:top-1/2 lg:-translate-y-1/2 mt-4 lg:mt-0">
            <button
              onClick={prev}
              className="bg-[#083b44] text-white p-3 rounded-lg hover:scale-110 transition"
            >
              <ArrowLeft size={18} />
            </button>

            <button
              onClick={next}
              className="bg-[#083b44] text-white p-3 rounded-lg hover:scale-110 transition"
            >
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
