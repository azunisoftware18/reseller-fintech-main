"use client";

import { useState } from "react";
import { Home, Users, Building, Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSelector, useDispatch } from "react-redux";
import { logout as logoutAction } from "@/store/authSlice";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Link from "next/link";
import { useLogout } from "@/hooks/useAuth";
import dynamic from "next/dynamic";
import { useWebsite } from "@/hooks/useTenantWebsite";
import Image from "next/image";

export default function Header() {
  const ThemeToggle = dynamic(
    () => import("./theme/ThemeToggle").then((m) => m.ThemeToggle),
    { ssr: false },
  );

  const { mutate: logoutMutate } = useLogout();
  const [mobileOpen, setMobileOpen] = useState(false);

  const dispatch = useDispatch();
  const router = useRouter();
  const { isAuthenticated } = useSelector((state) => state.auth || {});
  const website = useWebsite();

  const handleLogout = () => {
    logoutMutate(undefined, {
      onSuccess: () => {
        dispatch(logoutAction());
        router.push("/login");
      },
    });
  };

  const links = [
    { name: "Home", href: "/", icon: Home },
    { name: "About Us", href: "/about-us", icon: Users },
    { name: "Services", href: "/services", icon: Building },
  ];

  return (
    <header className={`sticky top-0 z-50 border border-b  bg-background `}>
      <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center">
          {website?.logoUrl ? (
            <Image
              width={100}
              height={100}
              src={website.logoUrl}
              alt="Logo"
              className="h-8 w-8 mr-2 object-contain"
            />
          ) : (
            <span className="text-foreground font-bold text-xl">
              {website?.brandName}
            </span>
          )}
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center space-x-4">
          {links.map((link) => (
            <Button
              key={link.name}
              href={link.href}
              variant="ghost"
              size="sm"
              icon={link.icon}
              className="text-foreground/90 hover:text-foreground hover:bg-primary-foreground/10"
            >
              {link.name}
            </Button>
          ))}
        </nav>

        {/* Desktop Right */}
        <div className="hidden md:flex items-center space-x-3">
          <ThemeToggle />
          {isAuthenticated ? (
            <>
              <Button href="/dashboard">Dashboard</Button>
              <button
                onClick={handleLogout}
                className="bg-red-600 py-2 px-3 rounded-sm text-foreground"
              >
                Logout
              </button>
            </>
          ) : (
            <Button
              href="/login"
              className="bg-primary-foreground text-primary hover:bg-primary-foreground/90"
            >
              Get Started
            </Button>
          )}
        </div>

        {/* Mobile Toggle */}
        <motion.button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden text-foreground"
          animate={{ rotate: mobileOpen ? 180 : 0 }}
          transition={{ duration: 0.3 }}
        >
          {mobileOpen ? <X size={28} /> : <Menu size={28} />}
        </motion.button>
      </div>

      {/* Mobile Menu Animated */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.25 }}
            className="md:hidden bg-background shadow-lg px-4 py-4 space-y-3 absolute w-full"
          >
            {links.map((link, i) => (
              <motion.div
                key={link.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center space-x-2 p-2 rounded hover:bg-muted"
                >
                  <link.icon size={18} />
                  <span>{link.name}</span>
                </Link>
              </motion.div>
            ))}

            <div className="flex gap-3">
              <ThemeToggle />
              {isAuthenticated ? (
                <>
                  <Button
                    href="/dashboard"
                    onClick={() => setMobileOpen(false)}
                  >
                    Dashboard
                  </Button>
                  <button
                    onClick={handleLogout}
                    className="w-full bg-red-600 p-4 rounded text-foreground"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <Button
                  href="/login"
                  className="w-full"
                  onClick={() => setMobileOpen(false)}
                >
                  Get Started
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
