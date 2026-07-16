"use client";

import { Phone, Star } from "lucide-react";
import Button from "@/components/ui/Button";
import Image from "next/image";
import { motion } from "framer-motion";

export default function FintechHero() {
  return (
    <section className="relative py-28 overflow-hidden bg-gradient-to-br from-theme/10 via-background to-theme/5">
      {/* SOFT GRADIENT BLOBS */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-theme/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />

      <div className="container mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center relative z-10">
        {/* LEFT CONTENT */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true }}
        >
          <h1 className="text-6xl font-extrabold leading-tight mb-6">
            Smarter finance <br /> for the digital future
          </h1>

          <p className="text-muted-foreground text-lg mb-8 max-w-lg">
            Manage payments, insights, automation and growth tools — all in one
            powerful fintech ecosystem built for modern businesses.
          </p>

          <div className="flex gap-4 mb-10">
            <Button>Get Started</Button>
          </div>

          {/* TRUST BOXES */}
          <div className="flex gap-6 flex-wrap">
            <div className="bg-card shadow-border rounded-xl p-4 flex items-center gap-3">
              <div className="flex text-yellow-500">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className="h-4 w-4 fill-yellow-500" />
                ))}
              </div>
              <span className="text-sm text-muted-foreground">
                Rated 5.0 by founders
              </span>
            </div>

            <div className="bg-card shadow-border rounded-xl p-4 flex items-center gap-3">
              <Phone className="text-primary" />
              <span className="text-sm">24/7 Support</span>
            </div>
          </div>
        </motion.div>

        {/* RIGHT IMAGE */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, x: 40 }}
          whileInView={{ opacity: 1, scale: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="relative"
        >
          <Image
            width={1024}
            height={768}
            src="https://framerusercontent.com/images/MRPzW3jSq0Ju68AmCHq4Bem1P8.jpg?scale-down-to=1024"
            alt="fintech dashboard"
            className="rounded-2xl shadow-lg-border w-full"
          />

          {/* FLOATING FINTECH STATS */}
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="absolute -left-10 top-16 bg-card shadow-border rounded-xl p-4"
          >
            <p className="text-xs text-muted-foreground">Transactions</p>
            <p className="text-xl font-bold">$2.4M+</p>
          </motion.div>

          <motion.div
            initial={{ y: 40, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="absolute bottom-8 left-8 bg-card shadow-lg-border rounded-xl p-5 w-64"
          >
            <div className="mb-3">
              <div className="flex justify-between text-sm mb-1">
                <span>Growth</span>
                <span>+70%</span>
              </div>
              <div className="h-2 bg-muted rounded-full">
                <div className="h-2 bg-theme rounded-full w-[70%]" />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Security Score</span>
                <span>99.9%</span>
              </div>
              <div className="h-2 bg-muted rounded-full">
                <div className="h-2 bg-theme rounded-full w-[99%]" />
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
