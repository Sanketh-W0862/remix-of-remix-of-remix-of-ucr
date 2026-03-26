// Customer Code request store – tracks verification & creation requests
// that require Finance approval before the user can proceed.

import { useState, useEffect, useCallback } from "react";

export type CcRequestType = "verify" | "create";
export type CcRequestStatus = "pending" | "approved" | "rejected";

export interface CcRequest {
  id: string;
  type: CcRequestType;
  mobile: string; // links request to user
  status: CcRequestStatus;
  createdAt: string;
  rejectionReason?: string;

  // For "verify" requests
  existingCode?: string;

  // For "create" requests – full form data
  customerForm?: Record<string, string>;
  uploadedDocs?: Record<string, boolean>;

  // Assigned by finance on approval
  approvedCode?: string;
}

let globalCcRequests: CcRequest[] = [];
let listeners: Array<() => void> = [];
let nextId = 1;

function notify() {
  listeners.forEach((l) => l());
}

function normMobile(raw: string): string {
  return raw.replace(/\D/g, "").slice(-10);
}

/** Submit a new CC request (user side) */
export function submitCcRequest(
  req: Pick<CcRequest, "type" | "mobile" | "existingCode" | "customerForm" | "uploadedDocs">
): string {
  const id = `CC-${String(nextId++).padStart(4, "0")}`;
  globalCcRequests = [
    {
      id,
      type: req.type,
      mobile: normMobile(req.mobile),
      status: "pending",
      createdAt: new Date().toISOString().split("T")[0],
      existingCode: req.existingCode,
      customerForm: req.customerForm,
      uploadedDocs: req.uploadedDocs,
    },
    ...globalCcRequests,
  ];
  notify();
  return id;
}

/** Finance approves a CC request, optionally assigning a code */
export function approveCcRequest(id: string, approvedCode?: string) {
  globalCcRequests = globalCcRequests.map((r) =>
    r.id === id ? { ...r, status: "approved" as CcRequestStatus, approvedCode: approvedCode || r.existingCode } : r
  );
  notify();
}

/** Finance rejects a CC request */
export function rejectCcRequest(id: string, reason: string) {
  globalCcRequests = globalCcRequests.map((r) =>
    r.id === id ? { ...r, status: "rejected" as CcRequestStatus, rejectionReason: reason } : r
  );
  notify();
}

/** Get the latest CC request for a mobile number */
export function getCcRequestByMobile(mobile: string): CcRequest | undefined {
  const norm = normMobile(mobile);
  return globalCcRequests.find((r) => r.mobile === norm);
}

/** Get all pending CC requests (for finance dashboard) */
export function getPendingCcRequests(): CcRequest[] {
  return globalCcRequests.filter((r) => r.status === "pending");
}

/** Get all CC requests */
export function getAllCcRequests(): CcRequest[] {
  return globalCcRequests;
}

/** React hook to subscribe to CC request changes */
export function useCcRequestStore() {
  const [, setTick] = useState(0);

  useEffect(() => {
    const rerender = () => setTick((t) => t + 1);
    listeners.push(rerender);
    return () => {
      listeners = listeners.filter((l) => l !== rerender);
    };
  }, []);

  return {
    allRequests: globalCcRequests,
    pendingRequests: globalCcRequests.filter((r) => r.status === "pending"),
    approve: useCallback((id: string, code?: string) => approveCcRequest(id, code), []),
    reject: useCallback((id: string, reason: string) => rejectCcRequest(id, reason), []),
    getByMobile: useCallback((mobile: string) => getCcRequestByMobile(mobile), []),
  };
}
