"use client";

import { useEffect, useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Users,
  RefreshCw,
  Calendar,
  PieChart,
  Shield,
  Clock,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { QuickActions } from "@/components/QuickActions";
import { RevenueChart } from "@/components/RevenueChart";
import TransactionTable from "@/components/tables/TransactionTable";
import QuickStats from "@/components/QuickStats";
import { CreditCard } from "lucide-react";
import Button from "@/components/ui/Button";
import { toast } from "@/lib/toast";
import { useSelector } from "react-redux";
import { permissionChecker } from "@/lib/permissionCheker";
import { PERMISSIONS } from "@/lib/permissionKeys";
import { useTransactions } from "@/hooks/useTransaction";

export default function DashboardClient() {
  const [timeRange, setTimeRange] = useState("monthly");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Transaction table states
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [serviceTypeFilter, setServiceTypeFilter] = useState("ALL");
  const [modeFilter, setModeFilter] = useState("ALL");

  const perPage = 10; // Show fewer transactions on dashboard

  // Get permissions
  const perms = useSelector((s) => s.auth.user?.permissions);
  const can = (perm) => permissionChecker(perms, perm?.resource, perm?.action);
  const canViewTransaction = can(PERMISSIONS.TRANSACTION.READ);

  // Fetch transactions data
  const {
    data: responseData,
    isLoading,
    refetch,
    error,
  } = useTransactions({
    page,
    limit: perPage,
    status: statusFilter,
    serviceType: serviceTypeFilter,
    mode: modeFilter,
    search,
  });

  // Mock data for the dashboard
  const dashboardStats = {
    totalBalance: 125845.67,
    totalRevenue: 85420.5,
    totalExpenses: 42310.25,
    netProfit: 43110.25,
    activeUsers: 2548,
    transactions: 18456,
    pendingTransfers: 12,
    failedTransactions: 5,
  };

  const expenseCategories = [
    { name: "Payroll", amount: 18500, color: "bg-chart-1" },
    { name: "Marketing", amount: 8500, color: "bg-chart-2" },
    { name: "Operations", amount: 6200, color: "bg-chart-3" },
    { name: "Technology", amount: 5100, color: "bg-chart-4" },
    { name: "Miscellaneous", amount: 4010.25, color: "bg-chart-5" },
  ];

  const refreshData = async () => {
    setIsRefreshing(true);
    await refetch();
    setTimeout(() => {
      setIsRefreshing(false);
      toast.success("Dashboard refreshed successfully");
    }, 500);
  };

  // Handle errors
  useEffect(() => {
    if (error) {
      toast.error(error?.message || "Failed to load transactions");
    }
  }, [error]);

  // Get transactions data
  const items = responseData?.data?.transactionsAndEarnings || [];
  const meta = responseData?.meta || {};

  // Calculate stats from real transaction data
  const transactions = items.filter((i) => i.type === "transaction");
  const earnings = items.filter((i) => i.type === "earning");

  const totalTransactionAmount = transactions.reduce(
    (sum, t) => sum + Number(t.amount || 0),
    0,
  );
  const totalCommission = earnings
    .filter((e) => e.mode === "COMMISSION")
    .reduce((sum, e) => sum + Number(e.finalAmount || 0), 0);
  const totalSurcharge = earnings
    .filter((e) => e.mode === "SURCHARGE")
    .reduce((sum, e) => sum + Number(e.finalAmount || 0), 0);

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // Format amount from paise to rupees
  const formatAmount = (amount) => {
    return `₹${(amount / 100).toFixed(2)}`;
  };

  const stats = [
    {
      title: "Total Balance",
      value: formatCurrency(dashboardStats.totalBalance),
      change: "+12.5%",
      isPositive: true,
      icon: Wallet,
      color: "text-primary",
      bgColor: "bg-primary/10",
      footer: "From last month",
    },
    {
      title: "Monthly Revenue",
      value: formatCurrency(dashboardStats.totalRevenue),
      change: "+8.2%",
      isPositive: true,
      icon: TrendingUp,
      color: "text-success",
      bgColor: "bg-success/10",
      footer: "From last month",
    },
    {
      title: "Total Expenses",
      value: formatCurrency(dashboardStats.totalExpenses),
      change: "-3.5%",
      isPositive: false,
      icon: TrendingDown,
      color: "text-warning",
      bgColor: "bg-warning/10",
      footer: "From last month",
    },
    {
      title: "Transaction Volume",
      value: formatAmount(totalTransactionAmount),
      change: `+${transactions.length} txn`,
      isPositive: true,
      icon: CreditCard,
      color: "text-info",
      bgColor: "bg-info/10",
      footer: "Recent transactions",
    },
  ];

  const handleView = (item) => {
    if (!canViewTransaction) {
      toast.error("No permission to view transaction details");
      return;
    }
    // Handle view transaction
    console.log("View transaction:", item);
    toast.info(`Viewing transaction: ${item.txnId}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Financial Dashboard
          </h1>
          <p className="text-muted-foreground">
            Welcome back! Here&apos;s your financial overview for{" "}
            {new Date().toLocaleDateString("en-US", {
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
        <div className="flex items-center space-x-3 mt-4 md:mt-0">
          <Button
            onClick={refreshData}
            disabled={isRefreshing || isLoading}
            variant="outline"
            icon={RefreshCw}
            loading={isRefreshing || isLoading}
          >
            {isRefreshing || isLoading ? "Refreshing..." : "Refresh"}
          </Button>
          <div className="relative">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="appearance-none bg-background border border-input rounded-border px-4 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="yearly">Yearly</option>
            </select>
            <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <QuickStats stats={stats} />

      {/* Quick Actions */}
      <QuickActions />

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <div className="lg:col-span-2">
          <RevenueChart timeRange={timeRange} />
        </div>

        {/* Expense Breakdown */}
        <div className="bg-card border border-border rounded-lg-border p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                Expense Breakdown
              </h2>
              <p className="text-sm text-muted-foreground">
                Monthly expenses by category
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="hover:bg-accent"
              icon={PieChart}
            />
          </div>

          <div className="space-y-4">
            {expenseCategories.map((category, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div
                    className={`h-3 w-3 ${category.color} rounded-full mr-3`}
                  />
                  <span className="text-sm font-medium text-foreground">
                    {category.name}
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-foreground">
                    {formatCurrency(category.amount)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {(
                      (category.amount / dashboardStats.totalExpenses) *
                      100
                    ).toFixed(1)}
                    %
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-6 border-t border-border">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">
                Total Expenses
              </span>
              <span className="text-lg font-bold text-foreground">
                {formatCurrency(dashboardStats.totalExpenses)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transactions Section */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-foreground">
              Recent Transactions
            </h2>
            <p className="text-sm text-muted-foreground">
              Latest {items.length} transactions from your account
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              Commission: {formatAmount(totalCommission)} | Surcharge:{" "}
              {formatAmount(totalSurcharge)}
            </span>
          </div>
        </div>

        <TransactionTable
          data={items}
          total={meta.totalTransactionsAndtotalEarnings ?? 0}
          page={page}
          perPage={perPage}
          onPageChange={setPage}
          onView={canViewTransaction ? handleView : undefined}
          loading={isLoading}
          search={search}
          onSearch={setSearch}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          serviceTypeFilter={serviceTypeFilter}
          onServiceTypeFilterChange={setServiceTypeFilter}
          modeFilter={modeFilter}
          onModeFilterChange={setModeFilter}
        />
      </div>

      {/* Bottom Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Active Users */}
        <div className="bg-card border border-border rounded-lg-border p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <span className="text-xs font-medium px-2 py-1 bg-success/10 text-success rounded-full">
              +8.2%
            </span>
          </div>
          <h3 className="text-sm text-muted-foreground mb-1">Active Users</h3>
          <p className="text-2xl font-bold text-foreground">
            {dashboardStats.activeUsers.toLocaleString()}
          </p>
          <div className="flex items-center text-sm text-success mt-2">
            <TrendingUp className="h-4 w-4 mr-1" />
            <span>+192 new users this month</span>
          </div>
        </div>

        {/* Pending Transfers */}
        <div className="bg-card border border-border rounded-lg-border p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="h-10 w-10 bg-warning/10 rounded-lg flex items-center justify-center">
              <Clock className="h-5 w-5 text-warning" />
            </div>
            <span className="text-xs font-medium px-2 py-1 bg-warning/10 text-warning rounded-full">
              Needs attention
            </span>
          </div>
          <h3 className="text-sm text-muted-foreground mb-1">
            Pending Transfers
          </h3>
          <p className="text-2xl font-bold text-foreground">
            {dashboardStats.pendingTransfers}
          </p>
          <div className="flex items-center text-sm text-warning mt-2">
            <AlertCircle className="h-4 w-4 mr-1" />
            <span>Require your approval</span>
          </div>
        </div>

        {/* Security Status */}
        <div className="bg-card border border-border rounded-lg-border p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="h-10 w-10 bg-success/10 rounded-lg flex items-center justify-center">
              <Shield className="h-5 w-5 text-success" />
            </div>
            <span className="text-xs font-medium px-2 py-1 bg-success/10 text-success rounded-full">
              Secure
            </span>
          </div>
          <h3 className="text-sm text-muted-foreground mb-1">
            Security Status
          </h3>
          <p className="text-2xl font-bold text-foreground">Excellent</p>
          <div className="flex items-center text-sm text-success mt-2">
            <CheckCircle className="h-4 w-4 mr-1" />
            <span>All systems operational</span>
          </div>
        </div>
      </div>
    </div>
  );
}
