"use client";

import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";

import {
  ArrowLeft,
  Users,
  Mail,
  Phone,
  Key,
  Settings,
  Ban,
  Edit,
  Building2,
  User,
} from "lucide-react";

import Image from "next/image";

import Button from "@/components/ui/Button";
import { formatDateTime } from "@/lib/utils";
import { toast } from "@/lib/toast";

/* reusable view components */
import InfoCard from "@/components/details/InfoCard";
import InfoItem from "@/components/details/InfoItem";
import CopyableInfoItem from "@/components/details/CopyableInfoItem";
import QuickActionsCard from "@/components/details/QuickActionsCard";

import { clearEmployee, setEmployee } from "@/store/employeeSlice";
import { useEmployeeById } from "@/hooks/useEmployee";
import PageSkeleton from "@/components/details/PageSkeleton";
import { KeySquare } from "lucide-react";
import ImagePreviewModal from "@/components/ImagePreviewModal";

export default function Page() {
  const router = useRouter();
  const { id } = useParams();
  const dispatch = useDispatch();

  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState();

  const employee = useSelector((state) => state.employee.current);

  const { data, isLoading } = useEmployeeById(id);

  useEffect(() => {
    if (!employee && data?.data) {
      dispatch(setEmployee(data.data));
    }
  }, [employee, data, dispatch]);

  useEffect(() => {
    if (!employee && !isLoading && !data?.data) {
      router.replace("/dashboard/employee-management/employees");
    }
  }, [employee, isLoading, data, router]);

  useEffect(() => {
    return () => {
      dispatch(clearEmployee());
    };
  }, [dispatch]);

  if (isLoading || !employee) return <PageSkeleton />;

  const copy = (value, label) => {
    navigator.clipboard.writeText(value);
    toast.success(`${label} copied`);
  };

  return (
    <>
      {/* HEADER */}

      <div className="flex justify-between items-center">
        {/* PROFILE HEADER */}
        <div className="flex items-center gap-4 mb-6">
          {employee.profilePictureUrl ? (
            <button
              onClick={() => setPreviewOpen(true)}
              className="relative group"
            >
              <Image
                src={employee.profilePictureUrl}
                alt="Profile"
                width={64}
                height={64}
                className="h-16 w-16 rounded-full border object-cover cursor-pointer"
              />
              <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                <span className="text-xs text-white">View</span>
              </div>
            </button>
          ) : (
            <div className="h-16 w-16 rounded-full border flex items-center justify-center bg-muted">
              <User className="h-8 w-8 text-muted-foreground" />
            </div>
          )}

          <div>
            <h1 className="text-2xl font-semibold">
              {employee.firstName} {employee.lastName}
            </h1>
            <p className="text-sm text-muted-foreground">
              {employee.employeeNumber}
            </p>
          </div>
        </div>
        <div className="mb-6 flex items-center justify-between">
          <Button
            variant="outline"
            icon={ArrowLeft}
            onClick={() =>
              router.push("/dashboard/employee-management/employees")
            }
          >
            Back to Employees
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT */}
        <div className="lg:col-span-2 space-y-6">
          {/* BASIC INFORMATION */}
          <InfoCard icon={Users} title="Basic Information">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoItem
                label="Employee Name"
                value={`${employee.firstName} ${employee.lastName}`}
                icon={Users}
              />
              <InfoItem
                label="Employee Number"
                value={employee.employeeNumber}
                icon={Key}
              />
              <InfoItem
                label="Status"
                value={employee.employeeStatus}
                icon={Ban}
              />
              <InfoItem
                label="Department"
                value={employee.departmentCode || "-"}
                icon={Building2}
              />
            </div>
          </InfoCard>

          {/* CONTACT INFORMATION */}
          <InfoCard icon={Mail} title="Contact Information">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoItem
                label="Email"
                value={employee.email}
                icon={Mail}
                onClick={() => window.open(`mailto:${employee.email}`)}
              />
              <InfoItem
                label="Mobile"
                value={employee.mobileNumber}
                icon={Phone}
                onClick={() => window.open(`tel:${employee.mobileNumber}`)}
              />
            </div>
          </InfoCard>

          {/* SYSTEM INFORMATION */}
          <InfoCard icon={Settings} title="System Information">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <CopyableInfoItem
                label="Employee ID"
                value={employee.id}
                icon={Key}
                onCopy={() => copy(employee.id, "Employee ID")}
              />
              <InfoItem
                label="Created At"
                value={formatDateTime(employee.createdAt)}
                icon={Settings}
              />
              <InfoItem
                label="Updated At"
                value={formatDateTime(employee.updatedAt)}
                icon={Settings}
              />
              {employee.actionReason && (
                <InfoItem
                  label="Action Reason"
                  value={employee.actionReason}
                  icon={Settings}
                />
              )}
            </div>
          </InfoCard>
        </div>

        {/* RIGHT */}
        <div className="space-y-6">
          <QuickActionsCard
            title="Quick Actions"
            actions={[
              {
                label: "Send via Gmail",
                icon: Mail,
                onClick: () => {
                  window.open(
                    `https://mail.google.com/mail/?view=cm&to=${employee.email}`,
                    "_blank"
                  );
                },
              },
              {
                label: "Send via Outlook",
                icon: Mail,
                onClick: () => {
                  window.open(
                    `https://outlook.live.com/mail/0/deeplink/compose?to=${employee.email}`,
                    "_blank"
                  );
                },
              },
              {
                label: "Copy Email",
                icon: Key,
                onClick: () => {
                  navigator.clipboard.writeText(employee.email);
                  toast.success("Email copied");
                },
              },
              {
                label: "Edit Employee",
                icon: Edit,
                onClick: () => {
                  dispatch(setEmployee(employee));
                  router.push("/dashboard/employee-management/employees");
                },
              },
            ]}
          />
          <QuickActionsCard
            title="Login Credentials"
            actions={[
              {
                label: "Copy Employee Number",
                icon: Key,
                onClick: () => {
                  navigator.clipboard.writeText(employee.employeeNumber);
                  toast.success("Employee number copied");
                },
              },
              {
                label: "Copy Password",
                icon: KeySquare,
                onClick: () => {
                  navigator.clipboard.writeText(employee.password);
                  toast.success("Employee Password copied");
                },
              },
              {
                label: "Reset Password",
                icon: Edit,
                onClick: () => {
                  router.push(
                    `/dashboard/employee-management/employees/${employee.id}/reset-password`
                  );
                },
              },
            ]}
          />
        </div>
      </div>

      {/* IMAGE PREVIEW MODAL (INSTAGRAM STYLE) */}

      <ImagePreviewModal
        open={previewOpen}
        image={employee.profilePictureUrl}
        onClose={() => setPreviewOpen(false)}
      />
    </>
  );
}
