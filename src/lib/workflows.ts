import type { WorkflowAction } from "@/components/WorkflowActionModal";

export type WorkflowType =
  | "power-regular"
  | "power-temporary"
  | "power-prepaid"
  | "water"
  | "water-existing-meter"
  | "water-no-meter";

export type PowerMeterType = "postpaid" | "prepaid" | "temporary";
export type WaterMeterType = "existing" | "new";

export interface SpaceMasterEntry {
  spaceId: string;
  powerMeter: PowerMeterType;
  waterMeter: WaterMeterType;
  label: string;
}

// Space Master Configuration
export const SPACE_MASTER: SpaceMasterEntry[] = [
  { spaceId: "SP0001", powerMeter: "postpaid", waterMeter: "existing", label: "Postpaid Power / Existing Water Meter" },
  { spaceId: "SP0002", powerMeter: "prepaid", waterMeter: "new", label: "Prepaid Power / New Water Meter" },
  { spaceId: "SP0003", powerMeter: "temporary", waterMeter: "new", label: "Temporary Power / New Water Meter" },
];

export function getSpaceMeter(spaceId: string): SpaceMasterEntry | undefined {
  return SPACE_MASTER.find((s) => s.spaceId === spaceId);
}

/**
 * Determine the correct workflow type based on space config and utility.
 */
export function resolveWorkflowType(
  spaceId: string,
  utility: "power" | "water",
  powerType?: "regular" | "temporary"
): WorkflowType {
  const spaceCfg = getSpaceMeter(spaceId);

  if (utility === "water") {
    if (spaceCfg && spaceCfg.waterMeter === "new") return "water-no-meter";
    return "water-existing-meter";
  }

  // Power
  if (spaceCfg) {
    if (spaceCfg.powerMeter === "temporary" || powerType === "temporary") return "power-temporary";
    if (spaceCfg.powerMeter === "prepaid") return "power-prepaid";
  }
  return "power-regular";
}

export interface WorkflowStage {
  id: string;
  label: string;
  userActionRequired: boolean;
  actions?: WorkflowAction[];
}

const SD_UPLOAD_ACTION: WorkflowAction = {
  label: "Upload SD Payment Proof",
  type: "upload",
  fields: [
    { name: "payment_proof", label: "Security Deposit Payment Proof", type: "file" },
    { name: "transaction_id", label: "Transaction Reference ID", type: "text" },
  ],
};

const METER_ACTIONS: WorkflowAction[] = [
  {
    label: "Upload Meter Purchase Proof",
    type: "upload",
    fields: [{ name: "meter_proof", label: "Meter Purchase Receipt", type: "file" }],
  },
  {
    label: "Upload Calibration Certificate",
    type: "upload",
    fields: [{ name: "calibration_cert", label: "Calibration Certificate", type: "file" }],
  },
];

const EXPIRY_ACTIONS: WorkflowAction[] = [
  {
    label: "Request Extension",
    type: "confirm",
    fields: [
      { name: "new_end_date", label: "Requested New End Date", type: "date" },
      { name: "reason", label: "Reason for Extension", type: "textarea" },
      { name: "amended_po", label: "Amended PO (if applicable)", type: "file" },
    ],
  },
  {
    label: "Request Deactivation",
    type: "confirm",
    fields: [{ name: "reason", label: "Reason for Deactivation", type: "textarea" }],
  },
];

export const WORKFLOWS: Record<WorkflowType, WorkflowStage[]> = {
  // ── Power: Postpaid (full SD + meter flow) ──
  "power-regular": [
    { id: "submitted", label: "Submitted", userActionRequired: false },
    { id: "spoc-approval", label: "SPOC Approval", userActionRequired: false },
    { id: "sd-decision", label: "SD Decision", userActionRequired: false },
    {
      id: "sd-payment",
      label: "SD Payment",
      userActionRequired: true,
      actions: [SD_UPLOAD_ACTION],
    },
    { id: "finance-confirms", label: "Finance Confirms", userActionRequired: false },
    {
      id: "meter-recommendation",
      label: "Meter Recommendation",
      userActionRequired: true,
      actions: METER_ACTIONS,
    },
    { id: "slotting", label: "Slotting", userActionRequired: false },
    { id: "site-visit", label: "Site Visit", userActionRequired: false },
    { id: "activated", label: "Connection Activated", userActionRequired: false },
  ],

  // ── Power: Prepaid / Non-Metered (short flow) ──
  "power-prepaid": [
    { id: "submitted", label: "Submitted", userActionRequired: false },
    { id: "spoc-approval", label: "SPOC Approval", userActionRequired: false },
    { id: "slotting", label: "Slotting", userActionRequired: false },
    { id: "site-visit", label: "Site Visit", userActionRequired: false },
    { id: "activated", label: "Connection Activated", userActionRequired: false },
  ],

  // ── Power: Temporary ──
  "power-temporary": [
    { id: "submitted", label: "Submitted", userActionRequired: false },
    { id: "sd-calculation", label: "SD Calculation", userActionRequired: false },
    {
      id: "sd-payment",
      label: "SD Payment",
      userActionRequired: true,
      actions: [SD_UPLOAD_ACTION],
    },
    {
      id: "meter-recommendation",
      label: "Meter Recommendation",
      userActionRequired: true,
      actions: METER_ACTIONS,
    },
    { id: "slotting", label: "Slotting", userActionRequired: false },
    { id: "site-visit", label: "Site Visit", userActionRequired: false },
    { id: "activated", label: "Temp Activated", userActionRequired: false },
    {
      id: "expiry-notification",
      label: "Expiry Notification",
      userActionRequired: true,
      actions: EXPIRY_ACTIONS,
    },
  ],

  // ── Water: Existing Meter Path ──
  "water-existing-meter": [
    { id: "submitted", label: "Submitted", userActionRequired: false },
    { id: "spoc-approval", label: "SPOC Approval", userActionRequired: false },
    { id: "slotting", label: "Slotting", userActionRequired: false },
    { id: "site-visit", label: "Site Visit & Issue Resolution", userActionRequired: false },
    { id: "activated", label: "Water Activated", userActionRequired: false },
  ],

  // ── Water: No Meter Path ──
  "water-no-meter": [
    { id: "submitted", label: "Submitted", userActionRequired: false },
    { id: "spoc-approval", label: "SPOC Approval", userActionRequired: false },
    { id: "meter-recommendation", label: "Meter Recommendation", userActionRequired: false },
    {
      id: "meter-purchase",
      label: "Meter Purchase Proof",
      userActionRequired: true,
      actions: [
        {
          label: "Upload Meter Purchase Proof",
          type: "upload",
          fields: [{ name: "meter_proof", label: "Meter Purchase Receipt", type: "file" }],
        },
      ],
    },
    { id: "slotting", label: "Slotting", userActionRequired: false },
    { id: "site-visit", label: "Site Visit & Issue Resolution", userActionRequired: false },
    { id: "activated", label: "Water Activated", userActionRequired: false },
  ],

  // Legacy "water" kept as alias to existing-meter for old seed data
  water: [
    { id: "submitted", label: "Submitted", userActionRequired: false },
    { id: "spoc-approval", label: "SPOC Approval", userActionRequired: false },
    { id: "slotting", label: "Slotting", userActionRequired: false },
    { id: "site-visit", label: "Site Visit & Issue Resolution", userActionRequired: false },
    { id: "activated", label: "Water Activated", userActionRequired: false },
  ],
};

export function getWorkflowStages(type: WorkflowType): WorkflowStage[] {
  return WORKFLOWS[type];
}

export function getCurrentStage(type: WorkflowType, stageIndex: number): WorkflowStage {
  const stages = WORKFLOWS[type];
  return stages[Math.min(stageIndex, stages.length - 1)];
}

export function getTimelineLabels(type: WorkflowType): string[] {
  return WORKFLOWS[type].map((s) => s.label);
}

/** Human-readable workflow path label */
export function getWorkflowLabel(type: WorkflowType): string {
  const labels: Record<WorkflowType, string> = {
    "power-regular": "Power – Postpaid Meter",
    "power-prepaid": "Power – Prepaid / Non-Metered",
    "power-temporary": "Power – Temporary",
    water: "Water – Existing Meter",
    "water-existing-meter": "Water – Existing Meter",
    "water-no-meter": "Water – No Meter Path",
  };
  return labels[type];
}
