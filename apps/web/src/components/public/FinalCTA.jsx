"use client";

import Button from "@/components/ui/Button";
import Image from "next/image";

export default function FinalCTA() {
  return (
    <section className="py-16 sm:py-20 lg:py-24 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-2xl bg-[#083b44] px-6 sm:px-10 lg:px-16 py-12 sm:py-16 lg:py-20">
          <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-10">
            {/* LEFT CONTENT */}
            <div className="text-white max-w-xl text-center lg:text-left">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight mb-6">
                Get expert accounting assistance now
              </h2>

              <Button className="mt-2 sm:mt-4">Get Started</Button>
            </div>

            {/* RIGHT IMAGE */}
            <div className="hidden absolute right-0 sm:flex w-full max-w-sm sm:max-w-md lg:max-w-lg justify-end ">
              <Image
                width={250}
                height={300}
                alt="Illustration"
                src="https://framerusercontent.com/images/U2rjF15tssJbMbZPjIC1z6SoGT8.png?scale-down-to=768"
                className=" object-contain"
              />
            </div>
          </div>

          {/* BACKGROUND GLOW */}
          <div className="absolute -top-10 -right-10 w-72 h-72 sm:w-96 sm:h-96 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-10 right-20 w-60 h-60 sm:w-80 sm:h-80 bg-white/10 rounded-full blur-2xl" />
        </div>
      </div>
    </section>
  );
}
