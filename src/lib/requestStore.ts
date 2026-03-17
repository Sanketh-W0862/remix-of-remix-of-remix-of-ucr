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

export interface ConnectionRequest {
  id: string;
  utility: string;
  type: string;
  workflowType: WorkflowType;
  space: string;
  stageIndex: number;
  date: string;
  expiry?: string;
  rejectionReason?: string;
  submittedDocs?: string[];
  siteVisitDate?: string;
  userDetails?: RequestUserDetails;
  sdDecision?: SdDecision;
  sdWaiverProof?: string;
}

export const INITIAL_REQUESTS: ConnectionRequest[] = [
  { id: "REQ-2024-001", utility: "Power", type: "Postpaid", workflowType: "power-regular", space: "SP0004", stageIndex: 8, date: "2024-01-15" },
  { id: "REQ-2024-002", utility: "Water", type: "Existing Meter", workflowType: "water-existing-meter", space: "SP0001", stageIndex: 3, date: "2024-02-20" },
  { id: "REQ-2024-003", utility: "Power", type: "Temporary", workflowType: "power-temporary", space: "SP0003", stageIndex: 2, date: "2024-03-01", expiry: "2024-06-01" },
  { id: "REQ-2024-004", utility: "Power", type: "Postpaid", workflowType: "power-regular", space: "SP0004", stageIndex: 5, date: "2024-03-10" },
  { id: "REQ-2024-005", utility: "Power", type: "Temporary", workflowType: "power-temporary", space: "SP0005", stageIndex: 7, date: "2024-01-05", expiry: "2024-04-05" },
  { id: "REQ-2024-006", utility: "Water", type: "New Meter", workflowType: "water-no-meter", space: "SP0005", stageIndex: 2, date: "2024-03-15" },
  { id: "REQ-2024-007", utility: "Power", type: "Prepaid", workflowType: "power-prepaid", space: "SP0002", stageIndex: 1, date: "2024-03-18" },
];

// Simple shared-state store
let globalRequests: ConnectionRequest[] = [...INITIAL_REQUESTS];
let listeners: Array<() => void> = [];
let nextId = 8;

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
      return { ...r, stageIndex: Math.min(r.stageIndex + 1, stages.length - 1), rejectionReason: undefined };
    });
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

  const setSdDecision = useCallback((requestId: string, decision: SdDecision, waiverProof?: string) => {
    globalRequests = globalRequests.map((r) => {
      if (r.id !== requestId) return r;

      const stages = getWorkflowStages(r.workflowType);
      const findStageIndex = (stageId: string) => stages.findIndex((stage) => stage.id === stageId);

      const updated: ConnectionRequest = {
        ...r,
        sdDecision: decision,
        sdWaiverProof: decision === "waived" ? waiverProof : undefined,
        rejectionReason: undefined,
      };

      if (decision === "pending") {
        const sdPaymentIndex = findStageIndex("sd-payment");
        updated.stageIndex = sdPaymentIndex >= 0 ? sdPaymentIndex : Math.min(r.stageIndex + 1, stages.length - 1);
        return updated;
      }

      // collected / waived: skip SD payment + finance and route directly to P&E
      const meterRecommendationIndex = findStageIndex("meter-recommendation");
      updated.stageIndex = meterRecommendationIndex >= 0
        ? meterRecommendationIndex
        : Math.min(r.stageIndex + 1, stages.length - 1);

      return updated;
    });
    notify();
  }, []);

  return {
    requests: globalRequests,
    advanceStage,
    rejectRequest,
    clearRejection,
    scheduleSiteVisit,
    setSdDecision,
  };
}
