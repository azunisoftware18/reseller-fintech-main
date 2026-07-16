export function cn(...inputs) {
  return inputs.filter(Boolean).join(" ");
}

export const statusColor = {
  ACTIVE: {
    label: "Active",
    className: "status-active",
  },
  INACTIVE: {
    label: "Inactive",
    className: "status-inactive",
  },
  SUSPENDED: {
    label: "Suspended",
    className: "status-suspended",
  },
  DELETED: {
    label: "Deleted",
    className: "status-deleted",
  },
};

export const formatDateTime = (isoString) => {
  if (!isoString) return "-";

  return new Date(isoString).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

export const onlyDigits = (maxLength) => (e) => {
  let value = e.target.value.replace(/\D/g, "");

  if (maxLength) {
    value = value.slice(0, maxLength);
  }

  e.target.value = value;
};
