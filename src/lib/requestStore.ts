import { useState, useCallback, useEffect } from "react";
import { getWorkflowStages } from "./workflows";
import type { WorkflowType } from "./workflows";

export interface RequestUserDetails {
  customerName?: string;
  customerCode?: string;
  contactPerson?: string;
  mobile?: string;
  email?: string;
}

export type SdDecision = "collected" | "pending" | "waived";

export interface LoadAppliance {
  name: string;
  kw: number;
  qty: number;
}

export interface LoadData {
  method: "calculator" | "upload";
  totalKW: number;
  totalKVA: number;
  appliances?: LoadAppliance[];
  docUploaded?: boolean;
}

export interface WaterDemandData {
  domesticKL: number;
  flushingKL: number;
  roKL: number;
  totalKL: number;
}

export interface ConnectionRequest {
  id: string;
  utility: string;
  type: string;
  workflowType: WorkflowType;
  address: string;
  addressId: string;
  stageIndex: number;
  date: string;
  expiry?: string;
  rejectionReason?: string;
  submittedDocs?: string[];
  siteVisitDate?: string;
  userDetails?: RequestUserDetails;
  sdDecision?: SdDecision;
  sdWaiverProof?: string;
  sdAmount?: string;
  completedActions?: string[];
  loadData?: LoadData;
  waterDemand?: WaterDemandData;
}

export const INITIAL_REQUESTS: ConnectionRequest[] = [
  { id: "REQ-2024-001", utility: "Power", type: "Postpaid", workflowType: "power-regular", address: "Tower A, Block 4, Cyber City", addressId: "ADDR-S001", stageIndex: 8, date: "2024-01-15" },
  { id: "REQ-2024-002", utility: "Water", type: "Existing Meter", workflowType: "water-existing-meter", address: "Unit 12, Trade Centre", addressId: "ADDR-S002", stageIndex: 3, date: "2024-02-20" },
  { id: "REQ-2024-003", utility: "Power", type: "Temporary", workflowType: "power-temporary", address: "Plot 7, Industrial Area", addressId: "ADDR-S003", stageIndex: 2, date: "2024-03-01", expiry: "2024-06-01" },
  { id: "REQ-2024-004", utility: "Power", type: "Postpaid", workflowType: "power-regular", address: "Tower A, Block 4, Cyber City", addressId: "ADDR-S001", stageIndex: 5, date: "2024-03-10" },
  { id: "REQ-2024-005", utility: "Power", type: "Temporary", workflowType: "power-temporary", address: "Warehouse 5, Sector 18", addressId: "ADDR-S004", stageIndex: 7, date: "2024-01-05", expiry: "2024-04-05" },
  { id: "REQ-2024-006", utility: "Water", type: "New Meter", workflowType: "water-no-meter", address: "Warehouse 5, Sector 18", addressId: "ADDR-S004", stageIndex: 2, date: "2024-03-15" },
  { id: "REQ-2024-007", utility: "Power", type: "Prepaid", workflowType: "power-prepaid", address: "Shop 3, Market Complex", addressId: "ADDR-S005", stageIndex: 1, date: "2024-03-18" },
  { id: "REQ-2024-008", utility: "Power", type: "Prepaid", workflowType: "power-prepaid", address: "Shop 3, Market Complex", addressId: "ADDR-S005", stageIndex: 3, date: "2024-03-12" },
];

let globalRequests: ConnectionRequest[] = [...INITIAL_REQUESTS];
let listeners: Array<() => void> = [];
let nextId = 9;

function notify() {
  listeners.forEach((l) => l());
}

function getInitialStageIndex(workflowType: WorkflowType) {
  const stages = getWorkflowStages(workflowType);
  if (workflowType === "power-regular") {
    const spocApprovalIndex = stages.findIndex((s) => s.id === "spoc-approval");
    return spocApprovalIndex >= 0 ? spocApprovalIndex : Math.min(1, stages.length - 1);
  }
  return Math.min(1, stages.length - 1);
}

export function addRequest(req: Omit<ConnectionRequest, "id" | "stageIndex" | "date"> & { userDetails?: RequestUserDetails }) {
  const id = `REQ-2024-${String(nextId++).padStart(3, "0")}`;
  globalRequests = [
    {
      ...req,
      id,
      stageIndex: getInitialStageIndex(req.workflowType),
      date: new Date().toISOString().split("T")[0],
    },
    ...globalRequests,
  ];
  notify();
  return id;
}

export function useRequestStore() {
  const [, setTick] = useState(0);

  useEffect(() => {
    const rerender = () => setTick((t) => t + 1);
    listeners.push(rerender);
    return () => {
      listeners = listeners.filter((l) => l !== rerender);
    };
  }, []);

  const advanceStage = useCallback((requestId: string) => {
    globalRequests = globalRequests.map((r) => {
      if (r.id !== requestId) return r;
      const stages = getWorkflowStages(r.workflowType);
      return { ...r, stageIndex: Math.min(r.stageIndex + 1, stages.length - 1), rejectionReason: undefined, completedActions: [] };
    });
    notify();
  }, []);

  const markActionCompleted = useCallback((requestId: string, completedActions: string[]) => {
    globalRequests = globalRequests.map((r) =>
      r.id === requestId ? { ...r, completedActions } : r
    );
    notify();
  }, []);

  const rejectRequest = useCallback((requestId: string, reason: string) => {
    globalRequests = globalRequests.map((r) => {
      if (r.id !== requestId) return r;
      return { ...r, stageIndex: Math.max(r.stageIndex - 1, 0), rejectionReason: reason };
    });
    notify();
  }, []);

  const clearRejection = useCallback((requestId: string) => {
    globalRequests = globalRequests.map((r) =>
      r.id === requestId ? { ...r, rejectionReason: undefined } : r
    );
    notify();
  }, []);

  const scheduleSiteVisit = useCallback((requestId: string, date: string) => {
    globalRequests = globalRequests.map((r) => {
      if (r.id !== requestId) return r;
      const stages = getWorkflowStages(r.workflowType);
      return { ...r, siteVisitDate: date, stageIndex: Math.min(r.stageIndex + 1, stages.length - 1) };
    });
    notify();
  }, []);

  const setSdDecision = useCallback((requestId: string, decision: SdDecision, waiverProof?: string, sdAmount?: string) => {
    globalRequests = globalRequests.map((r) => {
      if (r.id !== requestId) return r;

      const stages = getWorkflowStages(r.workflowType);
      const findStageIndex = (stageId: string) => stages.findIndex((stage) => stage.id === stageId);

      const updated: ConnectionRequest = {
        ...r,
        sdDecision: decision,
        sdWaiverProof: decision === "waived" ? waiverProof : undefined,
        sdAmount: decision === "pending" ? sdAmount : undefined,
        rejectionReason: undefined,
      };

      if (decision === "pending") {
        const sdPaymentIndex = findStageIndex("sd-payment");
        updated.stageIndex = sdPaymentIndex >= 0 ? sdPaymentIndex : Math.min(r.stageIndex + 1, stages.length - 1);
        return updated;
      }

      const customerMeterIndex = findStageIndex("customer-meter-upload");
      updated.stageIndex = customerMeterIndex >= 0
        ? customerMeterIndex
        : Math.min(r.stageIndex + 1, stages.length - 1);

      return updated;
    });
    notify();
  }, []);

  /** SPOC can change the connection type / workflow of a request */
  const updateConnectionType = useCallback((requestId: string, newWorkflowType: WorkflowType, newType: string) => {
    globalRequests = globalRequests.map((r) => {
      if (r.id !== requestId) return r;
      return {
        ...r,
        workflowType: newWorkflowType,
        type: newType,
        // Reset to SPOC approval stage of new workflow
        stageIndex: Math.min(1, getWorkflowStages(newWorkflowType).length - 1),
        completedActions: [],
        rejectionReason: undefined,
      };
    });
    notify();
  }, []);

  return {
    requests: globalRequests,
    advanceStage,
    markActionCompleted,
    rejectRequest,
    clearRejection,
    scheduleSiteVisit,
    setSdDecision,
    updateConnectionType,
  };
}
