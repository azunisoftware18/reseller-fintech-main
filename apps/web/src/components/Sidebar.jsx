"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  Shield,
  Users,
  Percent,
  Settings,
  Play,
  LogOut,
  History,
  Wallet,
  BadgeIndianRupee,
  FileCode,
  Building2,
  ChevronRight,
  Cog,
  CreditCard,
  Landmark,
  Receipt,
  ArrowUpRight,
} from "lucide-react";

import { useState, useEffect } from "react";
import { useLogout } from "@/hooks/useAuth";
import Button from "./ui/Button";
import { useDispatch, useSelector } from "react-redux";
import { logout as logoutAction } from "@/store/authSlice";
import { useQueryClient } from "@tanstack/react-query";

import { PERMISSIONS } from "@/lib/permissionKeys";
import { permissionChecker } from "@/lib/permissionCheker";
import { ADMIN_ROLE } from "@/lib/constants";
import { Album } from "lucide-react";

const Sidebar = () => {
  const queryClient = useQueryClient();
  const pathname = usePathname();
  const router = useRouter();
  const { mutate: logoutMutate, isPending } = useLogout();
  const dispatch = useDispatch();

  const website = useSelector((state) => state.tenantWebsite.currentWebsite);
  const currentUser = useSelector((state) => state.auth.user);

  const perms = currentUser?.permissions;
  const roleCode = currentUser?.role?.roleCode;
  const isEmployee = currentUser?.type === "EMPLOYEE";

  const can = (resource, action) => permissionChecker(perms, resource, action);

  const [openMenus, setOpenMenus] = useState({});
  const [showAllWallets, setShowAllWallets] = useState(false);

  useEffect(() => {
    if (!currentUser || !pathname?.startsWith("/dashboard/recharge")) return;

    const isAdmin = roleCode === ADMIN_ROLE;
    const isOnAdminPath = pathname.startsWith("/dashboard/recharge/admin");

    if (isAdmin && pathname === "/dashboard/recharge") {
      router.replace("/dashboard/recharge/admin");
      return;
    }

    if (!isAdmin && isOnAdminPath) {
      router.replace("/dashboard/recharge");
      return;
    }
  }, [currentUser, roleCode, pathname, router]);

  const toggleMenu = (id) => {
    setOpenMenus((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleLogout = () => {
    logoutMutate(undefined, {
      onSuccess: () => {
        dispatch(logoutAction());
        queryClient.clear();
        router.push("/login");
      },
    });
  };

  const getRechargePath = () => {
    if (roleCode === ADMIN_ROLE) {
      return "/dashboard/recharge/admin";
    }
    return "/dashboard/recharge";
  };

  // ============ WALLET DATA ============
  const wallets = currentUser?.wallets || {};
  const mainWallet = wallets.MAIN;
  const hasMultipleWallets = wallets.GST || wallets.TDS;

  const walletConfig = {
    MAIN: {
      label: "Main Balance",
      icon: Wallet,
      color: "primary",
      bgColor: "bg-primary/5",
      borderColor: "border-primary/20",
      textColor: "text-primary",
      iconBg: "bg-primary/10",
      gradient: "from-primary/5 to-primary/10",
    },
    GST: {
      label: "GST Payable",
      icon: Receipt,
      color: "orange",
      bgColor: "bg-orange-50",
      borderColor: "border-orange-200",
      textColor: "text-orange-700",
      iconBg: "bg-orange-100",
      gradient: "from-orange-50 to-orange-100",
    },
    TDS: {
      label: "TDS Payable",
      icon: Landmark,
      color: "blue",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      textColor: "text-blue-700",
      iconBg: "bg-blue-100",
      gradient: "from-blue-50 to-blue-100",
    },
  };

  const menuSections = [
    {
      title: "Main",
      items: [
        {
          id: "dashboard",
          label: "Dashboard",
          icon: BarChart3,
          path: "/dashboard",
          permission: PERMISSIONS.DASHBOARD.READ,
        },
        {
          id: "tenants",
          label: "Tenants",
          icon: Building2,
          path: "/dashboard/tenants",
          permission: PERMISSIONS.TENANT.READ,
        },
        {
          id: "user-management",
          label: "User Management",
          icon: Users,
          path: "/dashboard/user-management",
          permissionGroup: [PERMISSIONS.USER.READ, PERMISSIONS.ROLE.READ],
        },
        {
          id: "commission",
          label: "Commission",
          icon: Percent,
          path: "/dashboard/commission",
          permission: PERMISSIONS.COMMISSION.READ,
        },
        {
          id: "transactions",
          label: "Transactions",
          icon: History,
          path: "/dashboard/transactions",
          permission: PERMISSIONS.TRANSACTION.READ,
        },
      ],
    },
    {
      title: "Services",
      items: [
        {
          id: "fund",
          label: "Fund Request",
          icon: BadgeIndianRupee,
          path: "/dashboard/fund",
          hideForSuperAdmin: true,
          hideForEmployee: true,
          permission: PERMISSIONS.FUND_REQUEST.READ,
        },
        {
          id: "recharge",
          label: "Recharge",
          icon: CreditCard,
          path: getRechargePath(),
          permissionGroup: [
            PERMISSIONS.RECHARGE.READ,
            PERMISSIONS.RECHARGE_ADMIN_OPERATORS.READ,
            PERMISSIONS.RECHARGE_ADMIN_CIRCLES.READ,
          ],
        },
        {
          id: "payout",
          label: "Payout",
          icon: Landmark,
          path: "/dashboard/payout",
          permission: PERMISSIONS.PAYOUT.READ,
        },
      ],
    },
    {
      title: "Administration",
      items: [
        {
          id: "request-kyc",
          label: "KYC Requests",
          icon: Shield,
          path: "/dashboard/kyc",
          permission: PERMISSIONS.KYC.READ,
        },

        {
          id: "bank",
          label: "Bank Accounts",
          icon: Landmark,
          path: "/dashboard/bank",
          permission: PERMISSIONS.BANK.READ,
        },
        {
          id: "ledger",
          label: "Ledger",
          icon: Album,
          path: "/dashboard/ledger",
          permission: PERMISSIONS.LEDGER.READ,
        },
        {
          id: "employee-management",
          label: "Employees",
          icon: Users,
          path: "/dashboard/employee-management",
          permission: PERMISSIONS.EMPLOYEE.READ,
        },
        {
          id: "reports",
          label: "Reports",
          icon: BarChart3,
          path: "/dashboard/reports",
          permission: PERMISSIONS.REPORTS.READ,
        },
        {
          id: "logs",
          label: "Activity Logs",
          icon: FileCode,
          path: "/dashboard/logs",
          permission: PERMISSIONS.LOGS.READ,
        },
      ],
    },
    {
      title: "System",
      items: [
        {
          id: "API-integration",
          label: "API integration",
          icon: Cog,
          path: "/dashboard/api-integration",
          permissionGroup: [
            PERMISSIONS.API_INTEGRATION_SERVICES.READ,
            PERMISSIONS.API_INTEGRATION_SERVICE_TENANTS.READ,
          ],
        },
        {
          id: "settings",
          label: "Settings",
          icon: Settings,
          path: "/dashboard/settings",
          permissionGroup: [
            PERMISSIONS.WEBSITE.READ,
            PERMISSIONS.SERVER.READ,
            PERMISSIONS.DOMAIN.READ,
            PERMISSIONS.SMTP.READ,
          ],
        },
      ],
    },
  ];

  // ================= COMPONENTS =================

  const WalletCard = ({ type, wallet, isMain = false }) => {
    const config = walletConfig[type];
    const Icon = config.icon;

    if (!wallet) return null;

    // Get theme-aware classes based on wallet type
    const getThemeClasses = () => {
      switch (type) {
        case "MAIN":
          return {
            bg: "bg-primary/5 dark:bg-primary/10",
            border: "border-primary/20 dark:border-primary/30",
            text: "text-primary dark:text-primary",
            iconBg: "bg-primary/10 dark:bg-primary/20",
            gradient:
              "from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/5",
          };
        case "GST":
          return {
            bg: "bg-orange-50 dark:bg-orange-950/30",
            border: "border-orange-200 dark:border-orange-800/50",
            text: "text-orange-700 dark:text-orange-400",
            iconBg: "bg-orange-100 dark:bg-orange-900/50",
            gradient:
              "from-orange-50 to-orange-100 dark:from-orange-950/20 dark:to-orange-950/10",
          };
        case "TDS":
          return {
            bg: "bg-blue-50 dark:bg-blue-950/30",
            border: "border-blue-200 dark:border-blue-800/50",
            text: "text-blue-700 dark:text-blue-400",
            iconBg: "bg-blue-100 dark:bg-blue-900/50",
            gradient:
              "from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-950/10",
          };
        default:
          return {
            bg: "bg-muted dark:bg-muted",
            border: "border-border dark:border-border",
            text: "text-foreground dark:text-foreground",
            iconBg: "bg-muted dark:bg-muted",
            gradient: "from-muted to-muted",
          };
      }
    };

    const themeClasses = getThemeClasses();

    return (
      <div
        className={`
        relative overflow-hidden rounded-xl border transition-all duration-200
        ${isMain ? "p-4" : "p-3"}
        ${themeClasses.border}
        bg-linear-to-br ${themeClasses.gradient}
        hover:shadow-md cursor-pointer group
      `}
      >
        {/* Background decoration */}
        <div className="absolute -right-2 -top-2 opacity-5 group-hover:opacity-10 transition-opacity">
          <Icon className={`w-16 h-16 ${themeClasses.text}`} />
        </div>

        <div className="relative z-10">
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className={`${themeClasses.iconBg} p-1.5 rounded-lg`}>
                <Icon className={`w-3.5 h-3.5 ${themeClasses.text}`} />
              </div>
              <span
                className={`text-xs font-medium ${themeClasses.text} opacity-80`}
              >
                {config.label}
              </span>
            </div>
            {isMain && (
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                  Active
                </span>
              </div>
            )}
          </div>

          {/* Amount */}
          <div className="flex items-baseline gap-1">
            <span
              className={`text-xs ${themeClasses.text} opacity-60 font-medium`}
            >
              ₹
            </span>
            <span
              className={`${isMain ? "text-2xl" : "text-lg"} font-bold ${themeClasses.text} tracking-tight`}
            >
              {(wallet.balance ?? 0).toLocaleString("en-IN", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </div>

          {/* Sub info */}
          {isMain && wallet.availableBalance !== undefined && (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="text-[10px] text-muted-foreground bg-white/60 dark:bg-black/30 px-2 py-0.5 rounded-full">
                Available: ₹
                {(wallet.availableBalance ?? 0).toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                })}
              </span>
              {wallet.blockedAmount > 0 && (
                <span className="text-[10px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800/50">
                  Blocked: ₹
                  {wallet.blockedAmount.toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                  })}
                </span>
              )}
            </div>
          )}

          {/* Mini stats for liability wallets */}
          {!isMain && (
            <div className="mt-1.5 flex items-center gap-1">
              <ArrowUpRight className="w-3 h-3 text-red-400 dark:text-red-500" />
              <span className="text-[10px] text-red-500 dark:text-red-400 font-medium">
                Liability Account
              </span>
            </div>
          )}
        </div>
      </div>
    );
  };

  const WalletSection = () => {
    if (!mainWallet) return null;

    // Single wallet user (only MAIN)
    if (!hasMultipleWallets) {
      return (
        <div className="p-4">
          <WalletCard type="MAIN" wallet={mainWallet} isMain={true} />
        </div>
      );
    }

    // Multi-wallet user with toggle
    return (
      <div className="p-4 space-y-2">
        {/* Always show MAIN */}
        <WalletCard type="MAIN" wallet={mainWallet} isMain={true} />

        {/* Toggle button */}
        <button
          onClick={() => setShowAllWallets(!showAllWallets)}
          className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted/50"
        >
          <span>{showAllWallets ? "Hide" : "Show"} Liability Wallets</span>
          <ChevronRight
            className={`w-3.5 h-3.5 transition-transform duration-200 ${
              showAllWallets ? "rotate-90" : ""
            }`}
          />
        </button>

        {/* Expandable liability wallets */}
        <div
          className={`space-y-2 overflow-hidden transition-all duration-300 ${
            showAllWallets ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          {wallets.GST && <WalletCard type="GST" wallet={wallets.GST} />}
          {wallets.TDS && <WalletCard type="TDS" wallet={wallets.TDS} />}
        </div>
      </div>
    );
  };

  const MenuItem = ({ item }) => {
    const Icon = item.icon;
    const isActive = item.path && pathname.startsWith(item.path);

    if (item.children) {
      const isActiveChild = item.children.some((child) =>
        pathname.startsWith(child.path),
      );

      const isOpen =
        openMenus[item.id] !== undefined ? openMenus[item.id] : isActiveChild;

      return (
        <div>
          <button
            onClick={() => toggleMenu(item.id)}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-border text-sm font-medium hover:bg-(--sidebar-hover)"
          >
            <div className="flex items-center">
              <Icon className="h-5 w-5 mr-3" />
              {item.label}
            </div>
            <ChevronRight
              className={`h-4 w-4 transition-transform ${
                isOpen ? "rotate-90" : ""
              }`}
            />
          </button>

          {isOpen && (
            <div className="ml-6 mt-1 space-y-1">
              {item.children.map((child) => (
                <Link
                  key={child.id}
                  href={child.path}
                  className={`block px-3 py-2 rounded-border text-sm ${
                    pathname === child.path
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-(--sidebar-hover)"
                  }`}
                >
                  {child.label}
                </Link>
              ))}
            </div>
          )}
        </div>
      );
    }

    return (
      <Link
        href={item.path}
        className={`flex items-center px-3 py-2.5 rounded-border text-sm font-medium ${
          isActive ? "bg-primary/10 text-primary" : "hover:bg-(--sidebar-hover)"
        }`}
      >
        <Icon className="h-5 w-5 mr-3" />
        {item.label}
      </Link>
    );
  };

  const MenuSection = ({ title, items }) => {
    const visibleItems = items.filter((item) => {
      if (item.hideForSuperAdmin && currentUser?.role?.roleLevel === 0) {
        return false;
      }
      if (item.hideForEmployee && isEmployee) {
        return false;
      }
      if (item.permission)
        return can(item.permission.resource, item.permission.action);
      if (item.permissionGroup)
        return item.permissionGroup.some((perm) =>
          can(perm.resource, perm.action),
        );
      return true;
    });

    if (!visibleItems.length) return null;

    return (
      <div className="mb-6">
        <h3 className="text-xs font-semibold uppercase tracking-wider mb-3 px-3 text-muted-foreground">
          {title}
        </h3>
        <div className="space-y-1">
          {visibleItems.map((item) => (
            <MenuItem key={item.id} item={item} />
          ))}
        </div>
      </div>
    );
  };

  // ================= UI =================

  return (
    <div className="h-full flex flex-col border-r border-border bg-sidebar overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5 bg-gradient-secondry border-b border-border shrink-0">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Play className="h-7 w-7 text-primary" />
            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-sidebar" />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-bold truncate">{website?.brandName}</h2>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-md font-medium">
                {currentUser?.role?.roleCode}
              </span>
              {currentUser?.user?.isKycVerified && (
                <span className="text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md font-medium border border-emerald-200">
                  KYC ✓
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Wallets */}
        {!isEmployee && <WalletSection />}

        {/* Divider */}
        <div className="mx-4 h-px bg-border/50 mb-2 shrink-0" />

        {/* Menu */}
        <div className="px-4 pb-4">
          {menuSections.map((section) => (
            <MenuSection key={section.title} {...section} />
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="border border-border/30 bg-background/80 backdrop-blur-sm  shadow-sm">
        <Button
          variant="ghost"
          onClick={handleLogout}
          loading={isPending}
          className="
        group relative w-full justify-start gap-3
        rounded-lg px-3 py-4
        text-destructive transition-all duration-200
        hover:bg-destructive/10 hover:text-destructive
        hover:shadow-sm active:scale-[0.98]
      "
        >
          <div
            className="
          flex h-9 w-9 items-center justify-center
          rounded-md bg-destructive/10
          transition-colors duration-200
          group-hover:bg-destructive/20
        "
          >
            <LogOut className="h-4 w-4" />
          </div>

          <div className="flex flex-col items-start">
            <span className="text-sm font-semibold leading-none">Logout</span>
            <span className="text-xs text-muted-foreground">
              Sign out from account
            </span>
          </div>
        </Button>
      </div>
    </div>
  );
};

export default Sidebar;
