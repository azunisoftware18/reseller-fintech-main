"use client";

import { useState, useEffect } from "react";
import { RefreshCw, Plus } from "lucide-react";

import BankStatusView from "@/components/BankStatusView";
import BankModal from "@/components/modals/BankModal";
import Button from "@/components/ui/Button";

import { toast } from "@/lib/toast";
import { useSelector } from "react-redux";
import { permissionChecker } from "@/lib/permissionCheker";
import { PERMISSIONS } from "@/lib/permissionKeys";

import {
  useUserBanks,
  useSetPrimaryBank,
  useDeleteBank,
} from "@/hooks/useBank";

export default function BankAddClient({ onRefresh }) {
  const [addBankModalOpen, setAddBankModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedBank, setSelectedBank] = useState(null);
  const [bankToDelete, setBankToDelete] = useState(null);
  const [bankToSetPrimary, setBankToSetPrimary] = useState(null);

  const perms = useSelector((s) => s.auth.user?.permissions);
  const currentUser = useSelector((s) => s.auth.user);

  const can = (perm) => permissionChecker(perms, perm?.resource, perm?.action);

  const canViewBank = can(PERMISSIONS.BANK.READ);
  const canAddBank = can(PERMISSIONS.BANK.SUBMIT);
  const canDeleteBank = can(PERMISSIONS.BANK.DELETE);
  const canUpdateBank = can(PERMISSIONS.BANK.UPDATE);
  const canResubmitBank = can(PERMISSIONS.BANK.RESUBMIT);

  const {
    data: myBanksData,
    isLoading: myBanksLoading,
    refetch: refetchMyBanks,
    error: myBanksError,
  } = useUserBanks(currentUser?.user?.id);

  const { mutate: setPrimaryBank, isPending: settingPrimary } =
    useSetPrimaryBank();

  const { mutate: deleteBank, isPending: deleting } = useDeleteBank();

  useEffect(() => {
    if (myBanksError) {
      toast.error(myBanksError?.message || "Failed to load bank details");
    }
  }, [myBanksError]);

  const myBanks = myBanksData?.data?.bankDetails || [];

  const handleRefresh = () => {
    refetchMyBanks();

    if (onRefresh) {
      onRefresh();
    }
  };

  const handleView = (bank) => {
    if (!canViewBank) {
      toast.error("No permission to view bank details");
      return;
    }

    setSelectedBank(bank);
    setViewModalOpen(true);
  };

  const handleAddBank = () => {
    if (!canAddBank) {
      toast.error("No permission to add bank details");
      return;
    }

    setSelectedBank(null);
    setAddBankModalOpen(true);
  };

  // RESUBMIT CLICK
  const handleResubmitClick = (bank) => {
    if (!canResubmitBank) {
      toast.error("No permission to resubmit bank details");
      return;
    }

    setSelectedBank(bank);
    setAddBankModalOpen(true);
  };

  const handleSetPrimary = (bank) => {
    if (!canUpdateBank) {
      toast.error("No permission to update bank details");
      return;
    }

    if (bank.verificationStatus !== "VERIFIED") {
      toast.error("Only verified bank accounts can be set as primary");
      return;
    }

    setBankToSetPrimary(bank);
  };

  const handleSetPrimaryConfirm = () => {
    if (!bankToSetPrimary) return;

    setPrimaryBank(
      { bankId: bankToSetPrimary.id },
      {
        onSuccess: () => {
          toast.success("Primary bank updated successfully");

          refetchMyBanks();

          if (onRefresh) {
            onRefresh();
          }

          setBankToSetPrimary(null);
        },

        onError: (err) => {
          toast.error(err?.message || "Failed to set primary bank");
        },
      },
    );
  };

  const handleDeleteClick = (bank) => {
    if (!canDeleteBank) {
      toast.error("No permission to delete bank details");
      return;
    }

    if (bank.verificationStatus === "VERIFIED") {
      toast.error("Cannot delete verified bank details. Contact admin.");
      return;
    }

    setBankToDelete(bank);
  };

  const handleDeleteConfirm = () => {
    if (!bankToDelete) return;

    deleteBank(
      { bankId: bankToDelete.id },
      {
        onSuccess: () => {
          toast.success("Bank detail deleted successfully");

          setBankToDelete(null);

          refetchMyBanks();

          if (onRefresh) {
            onRefresh();
          }
        },

        onError: (err) => {
          toast.error(err?.message || "Failed to delete bank detail");
        },
      },
    );
  };

  return (
    <>
      <div className="mb-6 flex justify-end">
        <div className="flex gap-2">
          {canAddBank && (
            <Button onClick={handleAddBank} variant="default" icon={Plus}>
              Add Bank Account
            </Button>
          )}

          <Button
            onClick={handleRefresh}
            variant="outline"
            icon={RefreshCw}
            loading={myBanksLoading}
          >
            Refresh
          </Button>
        </div>
      </div>
      <BankStatusView
        bankDetails={myBanks}
        isLoading={myBanksLoading}
        onRefresh={refetchMyBanks}
        onAddBank={handleAddBank}
        onSetPrimary={canUpdateBank ? handleSetPrimary : undefined}
        onDelete={canDeleteBank ? handleDeleteClick : undefined}
        onResubmit={canResubmitBank ? handleResubmitClick : undefined}
        onView={canViewBank ? handleView : undefined}
        canAddBank={canAddBank}
      />

      {/* ADD / EDIT / RESUBMIT MODAL */}
      {addBankModalOpen && (
        <BankModal
          open={addBankModalOpen}
          // FIX HERE
          bankDetail={selectedBank}
          onClose={() => {
            setAddBankModalOpen(false);
            setSelectedBank(null);

            refetchMyBanks();

            if (onRefresh) {
              onRefresh();
            }
          }}
          userId={currentUser?.user?.id}
        />
      )}
      {/* VIEW MODAL */}
      {viewModalOpen && (
        <BankModal
          open={viewModalOpen}
          onClose={() => {
            setViewModalOpen(false);
            setSelectedBank(null);
          }}
          // FIX HERE
          bankDetail={selectedBank}
          readOnly={true}
        />
      )}

      {/* DELETE CONFIRMATION */}
      {bankToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-card border border-border rounded-lg shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold mb-4">Delete Bank Account</h3>

            <p className="text-sm text-muted-foreground mb-4">
              Are you sure you want to delete the bank account ending with{" "}
              <span className="font-medium text-foreground">
                {bankToDelete.accountNumber?.slice(-4)}
              </span>
              ?
            </p>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setBankToDelete(null)}>
                Cancel
              </Button>

              <Button
                variant="destructive"
                onClick={handleDeleteConfirm}
                loading={deleting}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
      {/* SET PRIMARY CONFIRMATION */}
      {bankToSetPrimary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-card border border-border rounded-lg shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold mb-4">Set as Primary Bank</h3>

            <p className="text-sm text-muted-foreground mb-4">
              Are you sure you want to set{" "}
              <span className="font-medium text-foreground">
                {bankToSetPrimary.bankName} -{" "}
                {bankToSetPrimary.accountNumber?.slice(-4)}
              </span>{" "}
              as your primary bank account?
            </p>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setBankToSetPrimary(null)}
              >
                Cancel
              </Button>

              <Button
                onClick={handleSetPrimaryConfirm}
                loading={settingPrimary}
              >
                Confirm
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
