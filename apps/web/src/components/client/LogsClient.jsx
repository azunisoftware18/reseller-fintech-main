"use client";

import React, { useState } from "react";
import {
  Clock,
  Globe,
  Monitor,
  Smartphone,
  Tablet,
  ChevronUp,
  Share2,
  Laptop,
  Send,
  Database,
  User,
  Mail,
  Phone,
  Hash,
  HardDrive,
  Activity,
  AlertCircle,
  LogOut,
  LogIn,
  Receipt,
  ShieldCheck,
  Users,
  MapPin,
  XCircle,
  LogOut as LogOutIcon,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Search,
  Filter,
  CalendarDays,
  SlidersHorizontal,
  Loader2,
  MapPinned,
  Navigation,
  ExternalLink,
} from "lucide-react";
import { useAuditLogs } from "@/hooks/useAuditLogs";
import QuickStats from "../QuickStats";

// ==========================================
// DEVICE ICON COMPONENT
// ==========================================
const DeviceIcon = ({ type }) => {
  if (type === "Desktop") return <Monitor className="w-3 h-3" />;
  if (type === "Mobile") return <Smartphone className="w-3 h-3" />;
  return <Tablet className="w-3 h-3" />;
};

// ==========================================
// STATUS BADGE COMPONENT
// ==========================================
const StatusBadge = ({ type, variant }) => {
  const getStyles = () => {
    switch (variant) {
      case "success":
        return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
      case "primary":
        return "bg-blue-500/10 text-blue-600 border-blue-500/20";
      case "destructive":
        return "bg-red-500/10 text-red-600 border-red-500/20";
      case "warning":
        return "bg-amber-500/10 text-amber-600 border-amber-500/20";
      case "info":
        return "bg-sky-500/10 text-sky-600 border-sky-500/20";
      default:
        return "bg-slate-500/10 text-slate-600 border-slate-500/20";
    }
  };

  const getActionIcon = () => {
    if (type?.includes("LOGIN")) return <LogIn className="w-3 h-3 mr-1" />;
    if (type?.includes("FAILED") || type?.includes("REJECT"))
      return <AlertCircle className="w-3 h-3 mr-1" />;
    if (type?.includes("LOGOUT")) return <LogOut className="w-3 h-3 mr-1" />;
    if (type?.includes("CREATE"))
      return <ShieldCheck className="w-3 h-3 mr-1" />;
    if (type?.includes("UPDATE")) return <RefreshCw className="w-3 h-3 mr-1" />;
    return null;
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${getStyles()}`}
    >
      {getActionIcon()}
      {type}
    </span>
  );
};

// ==========================================
// LOCATION BADGE COMPONENT
// ==========================================
const LocationBadge = ({ latitude, longitude }) => {
  const hasLocation =
    latitude &&
    longitude &&
    latitude !== null &&
    longitude !== null &&
    !isNaN(parseFloat(latitude)) &&
    !isNaN(parseFloat(longitude));

  if (!hasLocation) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs text-muted-foreground bg-muted border border-border">
        <MapPin className="w-3 h-3" />
        No location
      </span>
    );
  }

  const lat = parseFloat(latitude);
  const lng = parseFloat(longitude);
  const mapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;

  return (
    <a
      href={mapsUrl}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium 
        bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 
        hover:bg-emerald-500/20 hover:text-emerald-700 transition-all duration-200 
        group cursor-pointer"
      title={`Lat: ${lat}, Lng: ${lng} - Click to view on Google Maps`}
    >
      <Navigation className="w-3 h-3 group-hover:rotate-45 transition-transform duration-200" />
      <span className="font-mono">
        {lat.toFixed(4)}, {lng.toFixed(4)}
      </span>
      <ExternalLink className="w-3 h-3 opacity-60 group-hover:opacity-100" />
    </a>
  );
};

// ==========================================
// VIEW MAP BUTTON COMPONENT
// ==========================================
const ViewMapButton = ({ latitude, longitude, label = "View Map" }) => {
  const hasLocation =
    latitude &&
    longitude &&
    latitude !== null &&
    longitude !== null &&
    !isNaN(parseFloat(latitude)) &&
    !isNaN(parseFloat(longitude));

  if (!hasLocation) return null;

  const lat = parseFloat(latitude);
  const lng = parseFloat(longitude);
  const mapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;

  return (
    <a
      href={mapsUrl}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold 
        bg-blue-500 text-white hover:bg-blue-600 active:bg-blue-700 
        transition-all duration-200 shadow-sm hover:shadow-md 
        hover:-translate-y-0.5 active:translate-y-0"
    >
      <MapPinned className="w-3.5 h-3.5" />
      {label}
    </a>
  );
};

// ==========================================
// METADATA CODE BLOCK
// ==========================================
const MetadataCodeBlock = ({ metadata }) => {
  if (!metadata) return null;

  return (
    <div className="bg-slate-950 rounded-lg p-4 overflow-x-auto border border-slate-800">
      <pre className="text-xs font-mono leading-relaxed text-slate-300">
        <code>{JSON.stringify(metadata, null, 2)}</code>
      </pre>
    </div>
  );
};

// ==========================================
// DETAILS ROW COMPONENT
// ==========================================
const DetailsRow = ({ log, isExpanded }) => {
  if (!isExpanded) return null;

  const meta = log.metaData || {};
  const oldData = log.oldData || {};
  const newData = log.newData || {};

  // Extract location from newData or metaData
  const latitude = newData?.latitude || meta?.latitude || null;
  const longitude = newData?.longitude || meta?.longitude || null;
  const hasLocation = latitude && longitude;

  return (
    <div className="px-5 pb-5 pt-2">
      {/* Location Banner - Show prominently if location exists */}
      {hasLocation && (
        <div className="mb-4 p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <MapPinned className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-foreground">
                  Location Detected
                </h4>
                <p className="text-xs text-muted-foreground">
                  Latitude:{" "}
                  <span className="font-mono text-emerald-600">
                    {parseFloat(latitude).toFixed(6)}
                  </span>
                  {" · "}
                  Longitude:{" "}
                  <span className="font-mono text-emerald-600">
                    {parseFloat(longitude).toFixed(6)}
                  </span>
                </p>
              </div>
            </div>
            <ViewMapButton
              latitude={latitude}
              longitude={longitude}
              label="Open in Google Maps"
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        {/* Old Data Card */}
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <Share2 className="text-amber-500 w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">Old Data</h3>
          </div>
          <div className="space-y-3">
            {Object.keys(oldData).length > 0 ? (
              <pre className="text-xs font-mono text-muted-foreground overflow-x-auto bg-muted rounded-lg p-3">
                {JSON.stringify(oldData, null, 2)}
              </pre>
            ) : (
              <span className="text-sm text-muted-foreground italic">
                No old data
              </span>
            )}
          </div>
        </div>

        {/* New Data Card */}
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <Laptop className="text-emerald-500 w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">New Data</h3>
          </div>
          <div className="space-y-3">
            {Object.keys(newData).length > 0 ? (
              <pre className="text-xs font-mono text-muted-foreground overflow-x-auto bg-muted rounded-lg p-3">
                {JSON.stringify(newData, null, 2)}
              </pre>
            ) : (
              <span className="text-sm text-muted-foreground italic">
                No new data
              </span>
            )}
          </div>
        </div>

        {/* Log Details Card */}
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Send className="text-blue-500 w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">
              Log Details
            </h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-border/50">
              <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Hash className="w-3 h-3" /> Entity Type
              </span>
              <span className="text-xs font-medium text-foreground">
                {log.entityType}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border/50">
              <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Hash className="w-3 h-3" /> Entity ID
              </span>
              <span className="text-xs font-mono text-foreground truncate max-w-35">
                {log.entityId}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border/50">
              <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Activity className="w-3 h-3" /> Action
              </span>
              <span className="text-xs font-medium text-foreground">
                {log.action}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border/50">
              <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Globe className="w-3 h-3" /> IP Address
              </span>
              <span className="text-xs font-mono text-foreground">
                {log.ipAddress || "N/A"}
              </span>
            </div>
            {/* Location in details */}
            <div className="flex justify-between items-center py-2">
              <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                <MapPin className="w-3 h-3" /> Location
              </span>
              <LocationBadge latitude={latitude} longitude={longitude} />
            </div>
          </div>
        </div>
      </div>

      {/* Metadata Section */}
      {meta && Object.keys(meta).length > 0 && (
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <Database className="text-purple-500 w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">Metadata</h3>
          </div>
          <MetadataCodeBlock metadata={meta} />
        </div>
      )}
    </div>
  );
};

// ==========================================
// TABLE ROW COMPONENT
// ==========================================
const AuditRow = ({ log, isExpanded, onToggle }) => {
  const user = log.user || {};
  const role = log.role || {};

  // Extract location data
  const newData = log.newData || {};
  const meta = log.metaData || {};
  const latitude = newData?.latitude || meta?.latitude || null;
  const longitude = newData?.longitude || meta?.longitude || null;

  const getInitials = (name) => {
    if (!name) return "??";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getActionVariant = (action) => {
    if (action?.includes("LOGIN")) return "success";
    if (action?.includes("FAILED") || action?.includes("REJECT"))
      return "destructive";
    if (action?.includes("LOGOUT")) return "info";
    if (action?.includes("CREATE")) return "primary";
    if (action?.includes("UPDATE") || action?.includes("VERIFY"))
      return "warning";
    return "primary";
  };

  const getRoleVariant = (roleCode) => {
    if (roleCode === "AZZUNIQUE") return "primary";
    if (roleCode === "RESELLER") return "warning";
    if (roleCode === "WHITE_LABEL") return "info";
    if (roleCode === "STATE_HEAD") return "success";
    return "primary";
  };

  return (
    <div className="border-b border-border last:border-b-0">
      {/* Main Row */}
      <div
        className="grid grid-cols-[50px_1fr_1fr_110px_170px_140px_90px_50px] gap-4 px-5 py-4 items-center hover:bg-accent/40 transition-colors cursor-pointer group"
        onClick={onToggle}
      >
        <div className="text-sm font-medium text-muted-foreground font-mono">
          {log.id?.slice(0, 8)}
        </div>

        {/* User Cell */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 bg-primary text-primary-foreground">
            {getInitials(user.firstName + " " + user.lastName)}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground truncate">
              <User className="w-3 h-3 text-muted-foreground shrink-0" />
              {user.firstName} {user.lastName}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground truncate">
              <Mail className="w-3 h-3 shrink-0" />
              {user.email || "N/A"}
            </div>
          </div>
        </div>

        {/* Action Cell */}
        <div className="flex flex-col gap-1.5">
          <StatusBadge
            type={log.action}
            variant={getActionVariant(log.action)}
          />
          {/* Show location badge inline if available */}
          <LocationBadge latitude={latitude} longitude={longitude} />
        </div>

        {/* Role Type */}
        <div>
          <StatusBadge
            type={role.roleCode || "N/A"}
            variant={getRoleVariant(role.roleCode)}
          />
        </div>

        {/* Timestamp */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="w-3 h-3 shrink-0" />
          <span className="whitespace-nowrap">
            {new Date(log.createdAt).toLocaleString("en-IN", {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
              hour12: true,
            })}
          </span>
        </div>

        {/* IP Address */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Globe className="w-3 h-3 shrink-0" />
          <span className="font-mono">{log.ipAddress || "N/A"}</span>
        </div>

        {/* Device */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <DeviceIcon type={log.userAgent?.device?.type || "Desktop"} />
          <span>{log.userAgent?.device?.type || "Desktop"}</span>
        </div>

        {/* Expand Button */}
        <div className="flex justify-center">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
            className="w-7 h-7 rounded-md hover:bg-accent flex items-center justify-center transition-colors"
          >
            <ChevronUp
              className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
              strokeWidth={2}
            />
          </button>
        </div>
      </div>

      {/* Expanded Details Row */}
      <div
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{
          maxHeight: isExpanded ? "2000px" : "0",
          opacity: isExpanded ? 1 : 0,
        }}
      >
        <DetailsRow log={log} isExpanded={isExpanded} />
      </div>
    </div>
  );
};

// ==========================================
// PAGINATION COMPONENT
// ==========================================
const Pagination = ({ meta, onPageChange }) => {
  if (!meta || meta.totalPages <= 1) return null;

  const { page, totalPages, total } = meta;

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, page - 2);
    let end = Math.min(totalPages, start + maxVisible - 1);

    if (end - start < maxVisible - 1) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  return (
    <div className="flex items-center justify-between px-5 py-4 border-t border-border bg-card/50">
      <div className="text-xs text-muted-foreground">
        Showing <span className="font-medium text-foreground">{total}</span>{" "}
        results &middot; Page{" "}
        <span className="font-medium text-foreground">{page}</span> of{" "}
        <span className="font-medium text-foreground">{totalPages}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onPageChange(1)}
          disabled={page <= 1}
          className="w-8 h-8 rounded-md border border-border flex items-center justify-center hover:bg-accent disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-xs"
        >
          {"<<"}
        </button>
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="w-8 h-8 rounded-md border border-border flex items-center justify-center hover:bg-accent disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {getPageNumbers().map((p) => (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`w-8 h-8 rounded-md flex items-center justify-center text-xs font-medium transition-colors ${
              p === page
                ? "bg-primary text-primary-foreground"
                : "border border-border hover:bg-accent text-foreground"
            }`}
          >
            {p}
          </button>
        ))}

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="w-8 h-8 rounded-md border border-border flex items-center justify-center hover:bg-accent disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={page >= totalPages}
          className="w-8 h-8 rounded-md border border-border flex items-center justify-center hover:bg-accent disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-xs"
        >
          {">>"}
        </button>
      </div>
    </div>
  );
};

// ==========================================
// STATS BUILDER
// ==========================================
const buildStats = (logs) => {
  const totalEvents = logs?.length || 0;
  const successCount =
    logs?.filter((log) => log.action?.includes("LOGIN")).length || 0;
  const successRate =
    totalEvents > 0 ? Math.round((successCount / totalEvents) * 100) : 0;
  const activeUsers = new Set(logs?.map((log) => log.user?.email)).size;
  const uniqueIPs = new Set(logs?.map((log) => log.ipAddress)).size;
  const failedCount =
    logs?.filter((log) => log.action?.includes("FAILED")).length || 0;
  const logoutCount =
    logs?.filter((log) => log.action?.includes("LOGOUT")).length || 0;

  // Count logs with location
  const locationCount =
    logs?.filter((log) => {
      const lat = log.newData?.latitude || log.metaData?.latitude;
      const lng = log.newData?.longitude || log.metaData?.longitude;
      return lat && lng && !isNaN(parseFloat(lat)) && !isNaN(parseFloat(lng));
    }).length || 0;

  return [
    {
      title: "Total Events",
      value: totalEvents,
      icon: Receipt,
      iconColor: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      title: "Success Rate",
      value: `${successRate}%`,
      icon: ShieldCheck,
      iconColor: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
    },
    {
      title: "Active Users",
      value: activeUsers,
      icon: Users,
      iconColor: "text-sky-500",
      bgColor: "bg-sky-500/10",
    },
    {
      title: "IP Addresses",
      value: uniqueIPs,
      icon: MapPin,
      iconColor: "text-amber-500",
      bgColor: "bg-amber-500/10",
    },
    {
      title: "Failed Logins",
      value: failedCount,
      icon: XCircle,
      iconColor: "text-red-500",
      bgColor: "bg-red-500/10",
    },
    {
      title: "Locations",
      value: locationCount,
      icon: MapPinned,
      iconColor: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
    },
  ];
};

// ==========================================
// SKELETON LOADER
// ==========================================
const SkeletonRow = () => (
  <div className="grid grid-cols-[50px_1fr_1fr_110px_170px_140px_90px_50px] gap-4 px-5 py-4 items-center border-b border-border">
    <div className="h-4 w-8 bg-muted rounded animate-pulse" />
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-lg bg-muted animate-pulse shrink-0" />
      <div className="space-y-2 min-w-0">
        <div className="h-3.5 w-32 bg-muted rounded animate-pulse" />
        <div className="h-3 w-24 bg-muted rounded animate-pulse" />
      </div>
    </div>
    <div className="h-6 w-24 bg-muted rounded-full animate-pulse" />
    <div className="h-6 w-20 bg-muted rounded-full animate-pulse" />
    <div className="h-3.5 w-28 bg-muted rounded animate-pulse" />
    <div className="h-3.5 w-24 bg-muted rounded animate-pulse" />
    <div className="h-3.5 w-16 bg-muted rounded animate-pulse" />
    <div className="h-7 w-7 bg-muted rounded animate-pulse mx-auto" />
  </div>
);

// ==========================================
// MAIN AUDIT LOGS PAGE
// ==========================================
export default function LogsClient() {
  const [expandedRow, setExpandedRow] = useState(null);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [searchQuery, setSearchQuery] = useState("");
  const [entityTypeFilter, setEntityTypeFilter] = useState("ALL");
  const [actionFilter, setActionFilter] = useState("ALL");

  const { data, isLoading, isError, refetch, isRefetching } = useAuditLogs({
    page,
    limit,
    search: searchQuery,
    entityType: entityTypeFilter,
    action: actionFilter,
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  const logs = data?.data?.logs || [];
  const meta = data?.meta;
  const stats = buildStats(logs);

  const toggleDetails = (id) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
    setExpandedRow(null);
  };

  const handleRefresh = () => {
    refetch();
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    setExpandedRow(null);
    refetch();
  };

  const handleFilterChange = () => {
    setPage(1);
    setExpandedRow(null);
    refetch();
  };

  if (isError) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">
            Failed to load audit logs
          </h3>
          <p className="text-sm text-muted-foreground">
            Something went wrong while fetching the data.
          </p>
          <button
            onClick={handleRefresh}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Audit Logs
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track all user activities and system events across your platform
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isRefetching}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-card border border-border rounded-lg text-sm font-medium text-foreground hover:bg-accent transition-colors disabled:opacity-50 shrink-0"
        >
          <RefreshCw
            className={`w-4 h-4 ${isRefetching ? "animate-spin" : ""}`}
          />
          {isRefetching ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* Quick Stats */}
      <QuickStats stats={stats} />

      {/* Filters Bar */}
      <div className="bg-card rounded-xl border border-border p-4">
        <div className="flex flex-col lg:flex-row gap-3">
          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1 min-w-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by entity type, action, or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              />
            </div>
          </form>

          {/* Entity Type Filter */}
          <div className="relative min-w-40">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <select
              value={entityTypeFilter}
              onChange={(e) => {
                setEntityTypeFilter(e.target.value);
                handleFilterChange();
              }}
              className="w-full pl-9 pr-8 py-2.5 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary appearance-none cursor-pointer transition-colors"
            >
              <option value="ALL">All Entities</option>
              <option value="USER">User</option>
              <option value="TRANSACTION">Transaction</option>
              <option value="WALLET">Wallet</option>
              <option value="KYC">KYC</option>
              <option value="COMMISSION">Commission</option>
              <option value="SERVICE">Service</option>
            </select>
            <ChevronUp className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground rotate-180 pointer-events-none" />
          </div>

          {/* Action Filter */}
          <div className="relative min-w-40">
            <SlidersHorizontal className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <select
              value={actionFilter}
              onChange={(e) => {
                setActionFilter(e.target.value);
                handleFilterChange();
              }}
              className="w-full pl-9 pr-8 py-2.5 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary appearance-none cursor-pointer transition-colors"
            >
              <option value="ALL">All Actions</option>
              <option value="CREATE">Create</option>
              <option value="UPDATE">Update</option>
              <option value="DELETE">Delete</option>
              <option value="LOGIN">Login</option>
              <option value="LOGOUT">Logout</option>
              <option value="VERIFY">Verify</option>
              <option value="REJECT">Reject</option>
              <option value="APPROVE">Approve</option>
            </select>
            <ChevronUp className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground rotate-180 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
        {/* Table Header */}
        <div className="grid grid-cols-[50px_1fr_1fr_110px_170px_140px_90px_50px] gap-4 px-5 py-3 border-b border-border bg-muted/30">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            #
          </div>
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            User
          </div>
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Action
          </div>
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Role
          </div>
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Timestamp
          </div>
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            IP Address
          </div>
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Device
          </div>
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider text-center">
            Details
          </div>
        </div>

        {/* Table Body */}
        {isLoading ? (
          <>
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
          </>
        ) : logs.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
              <Search className="w-6 h-6 text-muted-foreground" />
            </div>
            <h3 className="text-sm font-medium text-foreground">
              No audit logs found
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              Try adjusting your filters or search query
            </p>
          </div>
        ) : (
          logs.map((log) => (
            <AuditRow
              key={log.id}
              log={log}
              isExpanded={expandedRow === log.id}
              onToggle={() => toggleDetails(log.id)}
            />
          ))
        )}

        {/* Pagination */}
        {!isLoading && (
          <Pagination meta={meta} onPageChange={handlePageChange} />
        )}
      </div>
    </div>
  );
}
