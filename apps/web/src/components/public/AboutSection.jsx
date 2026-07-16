"use client";

import { Check } from "lucide-react";
import Button from "@/components/ui/Button";
import { Image } from "lucide-react";

export default function AboutSection() {
  return (
    <section className="py-28 bg-background">
      <div className="container mx-auto px-6 grid lg:grid-cols-2 gap-20 items-center">
        {/* LEFT IMAGE COLLAGE */}
        <div className="relative">
          <Image
            width={1024}
            height={768}
            src="https://framerusercontent.com/images/MRPzW3jSq0Ju68AmCHq4Bem1P8.jpg?scale-down-to=1024"
            alt={"logo"}
            className="rounded-xl shadow-lg-border w-[85%]"
          />

          <Image
            width={1024}
            height={768}
            src="https://framerusercontent.com/images/MRPzW3jSq0Ju68AmCHq4Bem1P8.jpg?scale-down-to=1024"
            alt={"logo"}
            className="rounded-xl shadow-lg-border absolute -bottom-12 right-0 w-[70%]"
          />

          {/* FLOATING METRIC CARD */}
          <div className="absolute top-10 right-4 bg-card shadow-border rounded-xl p-5 w-64">
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-1">
                <span>Success in IRS Audits</span>
                <span>98%</span>
              </div>
              <div className="h-2 bg-muted rounded-full">
                <div className="h-2 bg-theme rounded-full w-[98%]"></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>On-Time Project Delivery</span>
                <span>95%</span>
              </div>
              <div className="h-2 bg-muted rounded-full">
                <div className="h-2 bg-theme rounded-full w-[95%]"></div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT CONTENT */}
        <div>
          <h2 className="text-5xl font-bold mb-6">
            Your trusted accounting partner awaits
          </h2>

          <p className="text-muted-foreground text-lg mb-8">
            At Accruefy, we blend expertise with technology to deliver
            bookkeeping, tax planning & financial consulting for businesses of
            all sizes.
          </p>

          {/* CHECKLIST */}
          <div className="space-y-4 mb-10">
            {[
              "Expert Team of Professionals",
              "Client-Centric Approach",
              "Trusted by Industry Leaders",
              "Tailored Financial Solutions",
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-6 w-6 rounded-md bg-theme/10 flex items-center justify-center">
                  <Check className="text-theme h-4 w-4" />
                </div>
                <span>{item}</span>
              </div>
            ))}
          </div>

          {/* METRICS */}
          <div className="flex gap-16 mb-8">
            <div>
              <div className="text-4xl font-bold">20+</div>
              <div className="text-muted-foreground text-sm">
                Years of Experience
              </div>
            </div>

            <div>
              <div className="text-4xl font-bold">8K</div>
              <div className="text-muted-foreground text-sm">Happy Clients</div>
            </div>
          </div>

          <Button>Learn more about us</Button>
        </div>
      </div>
    </section>
  );
}
