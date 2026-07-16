"use client";

import { useState } from "react";
import {
  Menu,
  X,
  User,
  Search,
  HelpCircle,
  ChevronDown,
  Settings,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useSelector } from "react-redux";
import { useDispatch } from "react-redux";
import { logout as logoutAction } from "@/store/authSlice";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useLogout } from "@/hooks/useAuth";

const DashboardNavbar = () => {
  const ThemeToggle = dynamic(
    () => import("./theme/ThemeToggle").then((m) => m.ThemeToggle),
    { ssr: false },
  );

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const dispatch = useDispatch();
  const router = useRouter();
  const queryClient = useQueryClient();

  const currentUser = useSelector((state) => state.auth.user);
  const { mutate: logoutMutate, isPending } = useLogout();

  // Empty functions (no logic)
  const handleLogout = () => {
    logoutMutate(undefined, {
      onSuccess: () => {
        dispatch(logoutAction());
        queryClient.clear();
        router.push("/login");
      },
    });
  };

  if (isPending) return null;

  const handleSearch = () => {
    // No logic - empty function
  };
  const userData = {
    name: currentUser?.user.firstName + " " + currentUser?.user.lastName,
    email: currentUser?.user.email,
    role: "Business Admin",
    avatar: "",
    balance: currentUser?.type !== "EMPLOYEE" && currentUser?.wallet.balance,
  };

  const quickLinks = [
    {
      href: "/dashboard",
      label: "Dashboard",
      icon: <User className="h-5 w-5" />,
    },
    {
      href: "/dashboard/settings",
      label: "Settings",
      icon: <Settings className="h-5 w-5" />,
    },
    {
      href: "/dashboard/profile",
      label: "Profile",
      icon: <User className="h-5 w-5" />,
    },
  ];

  return (
    <nav className="sticky top-0 z-40 bg-card border-b border-border shadow-border">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left side - Logo and Search */}
          <div className="flex items-center flex-1">
            {/* Desktop Search */}
            <div className="hidden md:flex items-center flex-1 max-w-md">
              <div className="relative w-full">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-muted-foreground" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                  placeholder="Search transactions, users, reports..."
                  className="w-full pl-10 pr-4 py-2 border border-input bg-background rounded-border focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring"
                />
              </div>
            </div>
          </div>

          {/* Right side - Actions */}
          <div className="flex items-center space-x-4">
            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Help */}
            <button className="p-2 text-muted-foreground hover:text-primary hover:bg-accent rounded-border transition-colors">
              <HelpCircle className="h-5 w-5" />
            </button>

            {/* User Profile */}
            <div className="relative">
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center space-x-3 p-2 hover:bg-accent rounded-border transition-colors"
              >
                <div className="h-8 w-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-semibold">
                  {userData.name.charAt(0)}
                </div>
                <div className="hidden lg:block text-left">
                  <p className="text-sm font-medium text-foreground">
                    {userData.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {userData.role}
                  </p>
                </div>
                <ChevronDown className="h-4 w-4 text-muted-foreground hidden lg:block" />
              </button>

              {/* Profile Dropdown */}
              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-popover rounded-lg-border shadow-lg border border-border z-50">
                  {/* User Info */}
                  <div className="p-4 border-b border-border">
                    <div className="flex items-center">
                      <div className="h-10 w-10 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-semibold">
                        {userData.name.charAt(0)}
                      </div>
                      <div className="ml-3">
                        <p className="font-medium text-popover-foreground">
                          {userData.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {userData.email}
                        </p>
                      </div>
                    </div>
                    {currentUser?.type !== "EMPLOYEE" && (
                      <div className="mt-4 p-3 bg-accent rounded-border">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">
                            Wallet Balance
                          </span>
                          <Wallet className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <p className="text-lg font-bold text-popover-foreground mt-1">
                          ₹{userData?.balance?.toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Quick Actions */}
                  <div className="p-2">
                    <Link
                      href="/dashboard/profile"
                      className="flex items-center px-3 py-2 text-sm text-popover-foreground hover:bg-accent rounded-border"
                    >
                      <User className="h-4 w-4 mr-3" />
                      My Profile
                    </Link>
                    <Link
                      href="/dashboard/settings"
                      className="flex items-center px-3 py-2 text-sm text-popover-foreground hover:bg-accent rounded-border"
                    >
                      <Settings className="h-4 w-4 mr-3" />
                      Account Settings
                    </Link>
                  </div>

                  {/* Logout */}
                  <div className="p-3 border-t border-border">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center justify-center px-4 py-2 bg-primary text-primary-foreground rounded-border hover:bg-primary/90 transition-all"
                    >
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 text-muted-foreground hover:text-primary hover:bg-accent rounded-border transition-colors"
            >
              {isMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Search */}
        <div className="md:hidden py-3">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-muted-foreground" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              className="w-full pl-10 pr-4 py-2 border border-input bg-background rounded-border focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring"
            />
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-border">
            <div className="grid grid-cols-3 gap-2 mb-4">
              {quickLinks.map((link, index) => (
                <Link
                  key={index}
                  href={link.href}
                  className="flex flex-col items-center p-3 text-muted-foreground hover:text-primary hover:bg-accent rounded-border transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.icon}
                  <span className="text-xs mt-1">{link.label}</span>
                </Link>
              ))}
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-border">
              <ThemeToggle />
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default DashboardNavbar;
