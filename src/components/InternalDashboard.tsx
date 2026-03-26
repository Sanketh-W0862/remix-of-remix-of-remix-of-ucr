import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap, Droplets, CheckCircle2, Clock, AlertCircle, BarChart3,
  LogOut, FileText, XCircle, MessageSquare, ChevronDown, ChevronUp, CalendarIcon,
  Upload, ShieldCheck, Hash, Search, Plus,
} from "lucide-react";
import { useCcRequestStore, type CcRequest } from "@/lib/ccRequestStore";
import { format } from "date-fns";
import type { UserRole } from "@/lib/roles";
import { STAGE_ROLE_MAP } from "@/lib/roles";
import { useRequestStore, type ConnectionRequest, type SdDecision } from "@/lib/requestStore";
import { getWorkflowStages, getCurrentStage, getTimelineLabels, getWorkflowLabel } from "@/lib/workflows";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import WorkflowActionModal, { type WorkflowAction } from "./WorkflowActionModal";

interface InternalDashboardProps {
  role: UserRole;
  roleLabel: string;
  onLogout: () => void;
}

type DashFilter = "pending" | "all" | "completed";

const InternalDashboard = ({ role, roleLabel, onLogout }: InternalDashboardProps) => {
  const { requests, advanceStage, rejectRequest, scheduleSiteVisit, setSdDecision } = useRequestStore();
  const [rejectModalId, setRejectModalId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [dashFilter, setDashFilter] = useState<DashFilter>("pending");
  const [siteVisitReqId, setSiteVisitReqId] = useState<string | null>(null);
  const [siteVisitDate, setSiteVisitDate] = useState<Date | undefined>(undefined);
  const [sdModalReqId, setSdModalReqId] = useState<string | null>(null);
  const [sdChoice, setSdChoice] = useState<SdDecision | null>(null);
  const [sdWaiverFile, setSdWaiverFile] = useState<string>("");
  const [sdAmountValue, setSdAmountValue] = useState<string>("");
  const [actionModalReqId, setActionModalReqId] = useState<string | null>(null);
  const [actionModalAction, setActionModalAction] = useState<WorkflowAction | null>(null);

  // All requests where current stage belongs to this role and not completed
  const myPendingRequests = requests.filter((r) => {
    const stage = getCurrentStage(r.workflowType, r.stageIndex);
    const stageRole = STAGE_ROLE_MAP[stage.id];
    const stages = getWorkflowStages(r.workflowType);
    const isCompleted = r.stageIndex >= stages.length - 1;
    return stageRole === role && !isCompleted;
  });

  const completedRequests = requests.filter((r) => {
    const stages = getWorkflowStages(r.workflowType);
    return r.stageIndex >= stages.length - 1;
  });

  const displayRequests =
    dashFilter === "pending" ? myPendingRequests :
    dashFilter === "completed" ? completedRequests :
    requests;

  const handleApprove = (reqId: string) => {
    const req = requests.find((r) => r.id === reqId);
    if (!req) return;

    const stage = getCurrentStage(req.workflowType, req.stageIndex);

    // SPOC SD decision gate for power workflows
    const isSdGateStage = ["spoc-approval", "sd-decision", "sd-calculation"].includes(stage.id);
    const isSdWorkflow = req.workflowType === "power-regular" || req.workflowType === "power-temporary";

    if (role === "spoc" && isSdWorkflow && isSdGateStage) {
      setSdModalReqId(reqId);
      setSdChoice(req.sdDecision ?? null);
      setSdWaiverFile(req.sdWaiverProof ?? "");
      return;
    }

    // Site visit scheduling for P&E
    if ((role === "pne" || role === "spoc") && (stage.id === "site-visit" || stage.id === "slotting")) {
      setSiteVisitReqId(reqId);
      return;
    }

    // Site visit form for P&E — pre-populate load value
    if (stage.id === "site-visit-form" && stage.actions && stage.actions.length > 0) {
      const action = JSON.parse(JSON.stringify(stage.actions[0]));
      if (req.loadData && action.fields) {
        const loadField = action.fields.find((f: any) => f.name === "details_of_load");
        if (loadField) {
          loadField.autoValue = `${req.loadData.totalKW.toFixed(2)} kW / ${req.loadData.totalKVA.toFixed(2)} kVA`;
        }
      }
      setActionModalReqId(reqId);
      setActionModalAction(action);
      return;
    }

    advanceStage(reqId);
  };

  const handleSdSubmit = () => {
    if (sdModalReqId && sdChoice) {
      setSdDecision(sdModalReqId, sdChoice, sdChoice === "waived" ? sdWaiverFile : undefined, sdChoice === "pending" ? sdAmountValue : undefined);
      setSdModalReqId(null);
      setSdChoice(null);
      setSdWaiverFile("");
      setSdAmountValue("");
    }
  };

  const handleScheduleSiteVisit = () => {
    if (siteVisitReqId && siteVisitDate) {
      scheduleSiteVisit(siteVisitReqId, format(siteVisitDate, "dd MMMM yyyy"));
      setSiteVisitReqId(null);
      setSiteVisitDate(undefined);
    }
  };

  const handleReject = () => {
    if (rejectModalId && rejectReason.trim()) {
      rejectRequest(rejectModalId, rejectReason.trim());
      setRejectModalId(null);
      setRejectReason("");
    }
  };

  const stats = [
    { label: "Pending Actions", value: String(myPendingRequests.length), icon: <Clock className="w-5 h-5" />, color: "text-warning", bg: "bg-warning/10", filter: "pending" as DashFilter },
    { label: "All Requests", value: String(requests.length), icon: <BarChart3 className="w-5 h-5" />, color: "text-primary", bg: "bg-primary/10", filter: "all" as DashFilter },
    { label: "Completed", value: String(completedRequests.length), icon: <CheckCircle2 className="w-5 h-5" />, color: "text-success", bg: "bg-success/10", filter: "completed" as DashFilter },
  ];

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold font-display text-foreground">{roleLabel} Dashboard</h1>
            <p className="text-muted-foreground mt-1">Requests waiting for your action</p>
          </div>
          <button onClick={onLogout} className="btn-secondary flex items-center gap-2 text-sm">
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>

        {/* Stats as filter buttons */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {stats.map((stat, i) => (
            <motion.button
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              onClick={() => setDashFilter(stat.filter)}
              className={`glass-card p-5 text-left transition-all ${dashFilter === stat.filter ? "ring-2 ring-primary" : "hover:ring-1 hover:ring-border"}`}
            >
              <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center ${stat.color} mb-3`}>
                {stat.icon}
              </div>
              <p className="text-2xl font-bold font-display text-foreground">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </motion.button>
          ))}
        </div>

        {/* Request List */}
        <div className="glass-card p-6">
          <h2 className="text-xl font-bold font-display text-foreground mb-6 capitalize">{dashFilter === "all" ? "All" : dashFilter} Requests</h2>

          {displayRequests.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle2 className="w-12 h-12 text-success mx-auto mb-3" />
              <p className="text-muted-foreground">No {dashFilter} requests. All caught up!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {displayRequests.map((req, i) => {
                const stages = getWorkflowStages(req.workflowType);
                const currentStage = getCurrentStage(req.workflowType, req.stageIndex);
                const timelineLabels = getTimelineLabels(req.workflowType);
                const isExpanded = expandedId === req.id;
                const isCompleted = req.stageIndex >= stages.length - 1;
                const isMine = STAGE_ROLE_MAP[currentStage.id] === role && !isCompleted;

                return (
                  <motion.div
                    key={req.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className={`p-5 rounded-xl border ${isMine ? "border-accent/30 bg-accent/[0.03]" : "border-border"}`}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          req.utility === "Power" ? "bg-primary/10" : "bg-info/10"
                        }`}>
                          {req.utility === "Power" ? (
                            <Zap className="w-5 h-5 text-primary" />
                          ) : (
                            <Droplets className="w-5 h-5 text-info" />
                          )}
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground">{req.id}</h3>
                          <p className="text-sm text-muted-foreground">
                            {req.utility} • {req.type} • {req.space}
                          </p>
                        </div>
                      </div>
                      <div className={`status-badge ${isCompleted ? "status-approved" : "bg-accent/10 text-accent"}`}>
                        {isCompleted ? "Completed" : currentStage.label}
                      </div>
                    </div>

                    {/* Timeline */}
                    <div className="flex items-center gap-1 mb-1">
                      {stages.map((stage, si) => (
                        <div key={stage.id} className="flex items-center flex-1 last:flex-none">
                          <div
                            className={`w-2.5 h-2.5 rounded-full flex-shrink-0 transition-colors ${
                              si <= req.stageIndex ? "bg-primary" : "bg-muted"
                            }`}
                            title={stage.label}
                          />
                          {si < stages.length - 1 && (
                            <div className={`flex-1 h-0.5 mx-0.5 rounded ${
                              si < req.stageIndex ? "bg-primary" : "bg-muted"
                            }`} />
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between mb-4">
                      <span className="text-[10px] text-muted-foreground">{timelineLabels[0]}</span>
                      <span className="text-[10px] text-muted-foreground">{timelineLabels[timelineLabels.length - 1]}</span>
                    </div>

                    {/* Expandable details */}
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : req.id)}
                      className="text-xs text-primary flex items-center gap-1 mb-3"
                    >
                      {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      {isExpanded ? "Hide Details" : "View Details"}
                    </button>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mb-4 p-3 rounded-lg bg-muted/30 border border-border/50"
                        >
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            {/* ── Request Information ── */}
                            <div className="col-span-2 mb-1">
                              <span className="text-xs font-semibold text-primary uppercase tracking-wider">Request Information</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Request ID:</span>
                              <span className="ml-2 text-foreground font-medium">{req.id}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Submitted:</span>
                              <span className="ml-2 text-foreground">{req.date}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Utility:</span>
                              <span className="ml-2 text-foreground">{req.utility}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Connection Type:</span>
                              <span className="ml-2 text-foreground">{req.type}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Workflow:</span>
                              <span className="ml-2 text-foreground">{getWorkflowLabel(req.workflowType)}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Space ID:</span>
                              <span className="ml-2 text-foreground">{req.space}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Current Stage:</span>
                              <span className="ml-2 text-foreground font-medium">{currentStage.label}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Progress:</span>
                              <span className="ml-2 text-foreground">{Math.min(req.stageIndex + 1, stages.length)} / {stages.length} steps</span>
                            </div>
                            {req.expiry && (
                              <div>
                                <span className="text-muted-foreground">Expiry:</span>
                                <span className="ml-2 text-warning font-medium">{req.expiry}</span>
                              </div>
                            )}

                            {/* ── Customer Details ── */}
                            {req.userDetails && (
                              <>
                                <div className="col-span-2 border-t border-border/50 my-1" />
                                <div className="col-span-2 mb-1">
                                  <span className="text-xs font-semibold text-primary uppercase tracking-wider">Customer Details</span>
                                </div>
                                {req.userDetails.customerName && (
                                  <div>
                                    <span className="text-muted-foreground">Customer Name:</span>
                                    <span className="ml-2 text-foreground">{req.userDetails.customerName}</span>
                                  </div>
                                )}
                                {req.userDetails.customerCode && (
                                  <div>
                                    <span className="text-muted-foreground">Customer Code:</span>
                                    <span className="ml-2 text-foreground">{req.userDetails.customerCode}</span>
                                  </div>
                                )}
                                {req.userDetails.contactPerson && (
                                  <div>
                                    <span className="text-muted-foreground">Contact Person:</span>
                                    <span className="ml-2 text-foreground">{req.userDetails.contactPerson}</span>
                                  </div>
                                )}
                                {req.userDetails.mobile && (
                                  <div>
                                    <span className="text-muted-foreground">Mobile:</span>
                                    <span className="ml-2 text-foreground">{req.userDetails.mobile}</span>
                                  </div>
                                )}
                                {req.userDetails.email && (
                                  <div>
                                    <span className="text-muted-foreground">Email:</span>
                                    <span className="ml-2 text-foreground">{req.userDetails.email}</span>
                                  </div>
                                )}
                              </>
                            )}

                            {/* ── Workflow Status Details ── */}
                            {(req.sdDecision || req.siteVisitDate || (req.completedActions && req.completedActions.length > 0)) && (
                              <>
                                <div className="col-span-2 border-t border-border/50 my-1" />
                                <div className="col-span-2 mb-1">
                                  <span className="text-xs font-semibold text-primary uppercase tracking-wider">Workflow Status</span>
                                </div>
                                {req.sdDecision && (
                                  <div className="col-span-2">
                                    <span className="text-muted-foreground">SD Status:</span>
                                    <span className={`ml-2 font-medium ${
                                      req.sdDecision === "waived" ? "text-warning" :
                                      req.sdDecision === "collected" ? "text-success" : "text-accent"
                                    }`}>
                                      {req.sdDecision === "waived" ? "Waived" :
                                       req.sdDecision === "collected" ? "Already Collected" : "Pending Collection"}
                                    </span>
                                    {req.sdDecision === "pending" && req.sdAmount && (
                                      <span className="ml-2 text-foreground font-semibold">₹{req.sdAmount}</span>
                                    )}
                                    {req.sdDecision === "waived" && req.sdWaiverProof && (
                                      <span className="ml-2 text-muted-foreground text-xs">(Waiver proof attached)</span>
                                    )}
                                  </div>
                                )}
                                {req.siteVisitDate && (
                                  <div className="col-span-2">
                                    <span className="text-muted-foreground">Site Visit:</span>
                                    <span className="ml-2 text-info font-medium">{req.siteVisitDate}</span>
                                  </div>
                                )}
                                {req.completedActions && req.completedActions.length > 0 && (
                                  <div className="col-span-2">
                                    <span className="text-muted-foreground">Actions Completed:</span>
                                    <div className="mt-1 flex flex-wrap gap-1">
                                      {req.completedActions.map((action) => (
                                        <span key={action} className="inline-flex items-center gap-1 px-2 py-0.5 bg-success/10 text-success text-xs rounded-md">
                                          <CheckCircle2 className="w-3 h-3" /> {action}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </>
                            )}

                            {/* ── Documents ── */}
                            {req.submittedDocs && req.submittedDocs.length > 0 && (
                              <>
                                <div className="col-span-2 border-t border-border/50 my-1" />
                                <div className="col-span-2 mb-1">
                                  <span className="text-xs font-semibold text-primary uppercase tracking-wider">Documents</span>
                                </div>
                                <div className="col-span-2">
                                  <div className="flex flex-wrap gap-1">
                                    {req.submittedDocs.map((doc) => (
                                      <span key={doc} className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-md">
                                        <FileText className="w-3 h-3" /> {doc}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              </>
                            )}

                            {/* ── Load & Appliances ── */}
                            {req.loadData && (
                              <>
                                <div className="col-span-2 border-t border-border/50 my-1" />
                                <div className="col-span-2 mb-1">
                                  <span className="text-xs font-semibold text-primary uppercase tracking-wider">Load Information</span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Method:</span>
                                  <span className="ml-2 text-foreground capitalize">{req.loadData.method === "calculator" ? "AI Calculator" : "Document Upload"}</span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Total Load:</span>
                                  <span className="ml-2 text-foreground font-semibold">{req.loadData.totalKW.toFixed(2)} kW</span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Max Demand:</span>
                                  <span className="ml-2 text-foreground font-semibold">{req.loadData.totalKVA.toFixed(2)} kVA</span>
                                </div>
                                {req.loadData.docUploaded && (
                                  <div>
                                    <span className="text-muted-foreground">Load Document:</span>
                                    <span className="ml-2 text-success font-medium">Uploaded</span>
                                  </div>
                                )}
                                {req.loadData.appliances && req.loadData.appliances.length > 0 && (
                                  <div className="col-span-2 mt-1">
                                    <span className="text-muted-foreground text-xs">Appliance Breakdown:</span>
                                    <div className="mt-1.5 rounded-lg border border-border/50 overflow-hidden">
                                      <table className="w-full text-xs">
                                        <thead>
                                          <tr className="bg-muted/50">
                                            <th className="text-left px-3 py-1.5 font-medium text-muted-foreground">Appliance</th>
                                            <th className="text-center px-3 py-1.5 font-medium text-muted-foreground">Qty</th>
                                            <th className="text-right px-3 py-1.5 font-medium text-muted-foreground">kW/unit</th>
                                            <th className="text-right px-3 py-1.5 font-medium text-muted-foreground">Total kW</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {req.loadData.appliances.map((a) => (
                                            <tr key={a.name} className="border-t border-border/30">
                                              <td className="px-3 py-1.5 text-foreground">{a.name}</td>
                                              <td className="px-3 py-1.5 text-center text-foreground">{a.qty}</td>
                                              <td className="px-3 py-1.5 text-right text-muted-foreground">{a.kw.toFixed(3)}</td>
                                              <td className="px-3 py-1.5 text-right text-foreground font-medium">{(a.kw * a.qty).toFixed(2)}</td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  </div>
                                )}
                              </>
                            )}

                            {/* ── Water Demand ── */}
                            {req.waterDemand && (
                              <>
                                <div className="col-span-2 border-t border-border/50 my-1" />
                                <div className="col-span-2 mb-1">
                                  <span className="text-xs font-semibold text-info uppercase tracking-wider">Water Demand (per day)</span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Domestic Use:</span>
                                  <span className="ml-2 text-foreground font-semibold">{req.waterDemand.domesticKL.toFixed(1)} KL</span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Flushing Use:</span>
                                  <span className="ml-2 text-foreground font-semibold">{req.waterDemand.flushingKL.toFixed(1)} KL</span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">RO Water:</span>
                                  <span className="ml-2 text-foreground font-semibold">{req.waterDemand.roKL.toFixed(1)} KL</span>
                                </div>
                                <div className="col-span-2 p-2 rounded-lg bg-info/5 border border-info/10">
                                  <span className="text-muted-foreground">Total Daily Demand:</span>
                                  <span className="ml-2 text-info font-bold text-base">{req.waterDemand.totalKL.toFixed(1)} KL/day</span>
                                </div>
                              </>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Action Buttons - only for pending requests assigned to this role */}
                    {isMine && (
                      <div className="flex gap-2 pt-3 border-t border-border/50">
                        <button
                          onClick={() => handleApprove(req.id)}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-semibold bg-success/10 text-success hover:bg-success/20 transition-all active:scale-[0.97]"
                        >
                          <CheckCircle2 className="w-4 h-4" /> {(role === "pne" || role === "spoc") && (currentStage.id === "site-visit" || currentStage.id === "slotting") ? "Schedule Slot" : currentStage.id === "site-visit-form" ? "Fill Site Visit Form" : "Approve"}
                        </button>
                        <button
                          onClick={() => setRejectModalId(req.id)}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-semibold bg-destructive/10 text-destructive hover:bg-destructive/20 transition-all active:scale-[0.97]"
                        >
                          <XCircle className="w-4 h-4" /> Reject
                        </button>
                        <button
                          onClick={() => setRejectModalId(req.id)}
                          className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-semibold bg-info/10 text-info hover:bg-info/20 transition-all active:scale-[0.97]"
                          title="Request Clarification"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </motion.div>

      {/* Site Visit Calendar Modal */}
      <AnimatePresence>
        {siteVisitReqId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" onClick={() => { setSiteVisitReqId(null); setSiteVisitDate(undefined); }} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative z-10 w-full max-w-sm glass-card-elevated p-6"
            >
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-info/10 flex items-center justify-center">
                  <CalendarIcon className="w-5 h-5 text-info" />
                </div>
                <div>
                  <h3 className="text-lg font-bold font-display text-foreground">Schedule Site Visit</h3>
                  <p className="text-sm text-muted-foreground">{siteVisitReqId}</p>
                </div>
              </div>

              <Calendar
                mode="single"
                selected={siteVisitDate}
                onSelect={setSiteVisitDate}
                disabled={(date) => date < new Date()}
                className={cn("p-3 pointer-events-auto rounded-xl border border-border")}
              />

              {siteVisitDate && (
                <p className="text-sm text-foreground mt-3 text-center font-medium">
                  Selected: {format(siteVisitDate, "dd MMMM yyyy")}
                </p>
              )}

              <div className="flex gap-3 mt-5">
                <button onClick={() => { setSiteVisitReqId(null); setSiteVisitDate(undefined); }} className="btn-secondary flex-1">
                  Cancel
                </button>
                <button
                  onClick={handleScheduleSiteVisit}
                  disabled={!siteVisitDate}
                  className="flex-1 gradient-bg text-primary-foreground px-6 py-3 rounded-xl font-semibold transition-all hover:opacity-90 disabled:opacity-50"
                >
                  Confirm
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SD Decision Modal */}
      <AnimatePresence>
        {sdModalReqId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" onClick={() => { setSdModalReqId(null); setSdChoice(null); setSdWaiverFile(""); }} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative z-10 w-full max-w-md glass-card-elevated p-6"
            >
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-bold font-display text-foreground">Security Deposit Decision</h3>
                  <p className="text-sm text-muted-foreground">{sdModalReqId}</p>
                </div>
              </div>

              <p className="text-sm text-muted-foreground mb-4">What is the status of the Security Deposit for this request?</p>

              <div className="space-y-3">
                {([
                  { value: "collected" as SdDecision, label: "Already Collected", desc: "SD has already been collected from the customer.", color: "border-success/40 bg-success/5" },
                  { value: "pending" as SdDecision, label: "Yet to be Collected", desc: "SD is pending — customer will need to pay and upload proof.", color: "border-accent/40 bg-accent/5" },
                  { value: "waived" as SdDecision, label: "Waived Off", desc: "SD has been waived — attach email proof of waiver.", color: "border-warning/40 bg-warning/5" },
                ]).map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setSdChoice(opt.value)}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                      sdChoice === opt.value ? opt.color + " ring-2 ring-primary" : "border-border hover:border-primary/20"
                    }`}
                  >
                    <p className="font-semibold text-sm text-foreground">{opt.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{opt.desc}</p>
                  </button>
                ))}
              </div>

              {sdChoice === "pending" && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-foreground mb-1.5">Security Deposit Amount (₹)</label>
                  <input
                    type="number"
                    className="input-glass w-full"
                    placeholder="Enter amount in rupees..."
                    value={sdAmountValue}
                    onChange={(e) => setSdAmountValue(e.target.value)}
                    min="0"
                  />
                </div>
              )}

              {sdChoice === "waived" && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-foreground mb-1.5">Email Proof of Waiver</label>
                  <label className="flex flex-col items-center justify-center gap-2 p-5 rounded-xl border-2 border-dashed border-border hover:border-primary/40 cursor-pointer transition-colors bg-muted/30">
                    {sdWaiverFile ? (
                      <div className="flex items-center gap-2 text-sm text-foreground">
                        <FileText className="w-4 h-4 text-primary" />
                        {sdWaiverFile}
                      </div>
                    ) : (
                      <>
                        <Upload className="w-5 h-5 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Click to upload waiver email proof</span>
                      </>
                    )}
                    <input
                      type="file"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files?.[0]) setSdWaiverFile(e.target.files[0].name);
                      }}
                    />
                  </label>
                </div>
              )}

              <div className="flex gap-3 mt-6">
                <button onClick={() => { setSdModalReqId(null); setSdChoice(null); setSdWaiverFile(""); setSdAmountValue(""); }} className="btn-secondary flex-1">
                  Cancel
                </button>
                <button
                  onClick={handleSdSubmit}
                  disabled={!sdChoice || (sdChoice === "waived" && !sdWaiverFile) || (sdChoice === "pending" && !sdAmountValue)}
                  className="flex-1 gradient-bg text-primary-foreground px-6 py-3 rounded-xl font-semibold transition-all hover:opacity-90 disabled:opacity-50"
                >
                  Confirm
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reject Modal */}
      <AnimatePresence>
        {rejectModalId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" onClick={() => setRejectModalId(null)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative z-10 w-full max-w-md glass-card-elevated p-6"
            >
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
                  <XCircle className="w-5 h-5 text-destructive" />
                </div>
                <div>
                  <h3 className="text-lg font-bold font-display text-foreground">Reject / Request Clarification</h3>
                  <p className="text-sm text-muted-foreground">{rejectModalId}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Reason</label>
                <textarea
                  className="input-glass w-full min-h-[100px] resize-none"
                  placeholder="Enter reason for rejection or clarification needed..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                />
              </div>

              <div className="flex gap-3 mt-6">
                <button onClick={() => { setRejectModalId(null); setRejectReason(""); }} className="btn-secondary flex-1">
                  Cancel
                </button>
                <button
                  onClick={handleReject}
                  disabled={!rejectReason.trim()}
                  className="flex-1 gradient-bg text-primary-foreground px-6 py-3 rounded-xl font-semibold transition-all hover:opacity-90 disabled:opacity-50"
                >
                  Submit
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Site Visit Form Modal */}
      {actionModalAction && (
        <WorkflowActionModal
          open={!!actionModalReqId}
          onClose={() => { setActionModalReqId(null); setActionModalAction(null); }}
          onSubmit={() => {
            if (actionModalReqId) advanceStage(actionModalReqId);
            setActionModalReqId(null);
            setActionModalAction(null);
          }}
          requestId={actionModalReqId || ""}
          action={actionModalAction}
        />
      )}
    </div>
  );
};

export default InternalDashboard;
