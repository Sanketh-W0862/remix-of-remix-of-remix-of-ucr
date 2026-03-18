import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, CheckCircle2, Send, Zap, FileText, MapPin, Calculator } from "lucide-react";
import { addRequest, type RequestUserDetails, type LoadData, type LoadAppliance, type WaterDemandData } from "@/lib/requestStore";
import { resolveWorkflowType } from "@/lib/workflows";
import type { WorkflowType } from "@/lib/workflows";

interface SubmitStepProps {
  wizardData: any;
  onBack: () => void;
  onSubmit: () => void;
}

const SubmitStep = ({ wizardData, onBack, onSubmit }: SubmitStepProps) => {
  const [submitted, setSubmitted] = useState(false);

  const spaceId = wizardData.space?.spaceId || "SP0001";
  const utilities: string[] = wizardData.utility?.selectedUtilities || [];
  const powerType = wizardData.utility?.powerType || "regular";

  const resolvedWorkflows: { utility: string; wfType: WorkflowType }[] = [];
  for (const util of utilities) {
    if (util === "power") {
      const wfType = resolveWorkflowType(spaceId, "power", powerType);
      resolvedWorkflows.push({
        utility: "Power",
        wfType,
      });
    } else if (util === "water") {
      const wfType = resolveWorkflowType(spaceId, "water");
      resolvedWorkflows.push({
        utility: "Water",
        wfType,
      });
    }
  }

  const handleSubmit = () => {
    const loginData = wizardData.login || {};
    const userDetails: RequestUserDetails = {
      customerName: loginData.companyName || loginData.customerForm?.customerName || undefined,
      customerCode: loginData.customerCode || undefined,
      contactPerson: loginData.contactPerson || loginData.customerForm?.contactPersonName || undefined,
      mobile: loginData.mobile || undefined,
      email: loginData.email || loginData.customerForm?.emailId || undefined,
    };

    // Build load data from wizard
    let loadData: LoadData | undefined;
    if (wizardData.load) {
      const ld = wizardData.load;
      const appliances: LoadAppliance[] = [];

      // Default appliances with qty > 0
      if (ld.quantities && ld.kwValues) {
        for (const [name, qty] of Object.entries(ld.quantities)) {
          if ((qty as number) > 0) {
            appliances.push({ name, kw: (ld.kwValues as Record<string, number>)[name] || 0, qty: qty as number });
          }
        }
      }

      // Custom appliances
      if (ld.customAppliances) {
        for (const ca of ld.customAppliances) {
          if (ca.qty > 0) {
            appliances.push({ name: ca.name, kw: ca.kw, qty: ca.qty });
          }
        }
      }

      loadData = {
        method: ld.method || "calculator",
        totalKW: ld.totalKW || 0,
        totalKVA: ld.totalKVA || 0,
        appliances: appliances.length > 0 ? appliances : undefined,
        docUploaded: ld.docUploaded || false,
      };
    }

    // Build water demand data
    let waterDemand: WaterDemandData | undefined;
    if (wizardData.waterDemand) {
      const wd = wizardData.waterDemand;
      waterDemand = {
        domesticKL: wd.domesticKL || 0,
        flushingKL: wd.flushingKL || 0,
        roKL: wd.roKL || 0,
        totalKL: wd.totalKL || 0,
      };
    }

    for (const rw of resolvedWorkflows) {
      const typeLabel =
        rw.wfType === "power-prepaid" ? "Prepaid" :
        rw.wfType === "power-regular" ? "Postpaid" :
        rw.wfType === "power-temporary" ? "Temporary" :
        rw.wfType === "water-existing-meter" ? "Existing Meter" :
        rw.wfType === "water-no-meter" ? "New Meter" : "Standard";

      addRequest({
        utility: rw.utility,
        type: typeLabel,
        workflowType: rw.wfType,
        space: spaceId,
        expiry: rw.wfType === "power-temporary" ? wizardData.utility?.tempDates?.to : undefined,
        userDetails,
        loadData: rw.utility === "Power" ? loadData : undefined,
        waterDemand: rw.utility === "Water" ? waterDemand : undefined,
      });
    }

    setSubmitted(true);
    setTimeout(() => onSubmit(), 2000);
  };

  if (submitted) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center min-h-[50vh] text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
          className="w-24 h-24 rounded-full bg-success/10 flex items-center justify-center mb-6"
        >
          <CheckCircle2 className="w-12 h-12 text-success" />
        </motion.div>
        <h2 className="text-3xl font-bold font-display text-foreground mb-2">Request Submitted!</h2>
        <p className="text-muted-foreground max-w-md">Your utility connection request has been submitted. You'll be redirected to your dashboard shortly.</p>
      </motion.div>
    );
  }

  const summaryItems = [
    { icon: <Zap className="w-5 h-5" />, label: "Utilities", value: utilities.join(", ") || "—", color: "text-primary" },
    { icon: <MapPin className="w-5 h-5" />, label: "Space", value: spaceId, color: "text-info" },
    { icon: <FileText className="w-5 h-5" />, label: "Documents", value: `${Object.values(wizardData.space?.documents || {}).filter(Boolean).length}/4 uploaded`, color: "text-success" },
    { icon: <Calculator className="w-5 h-5" />, label: "Load", value: wizardData.load?.totalKW ? `${wizardData.load.totalKW.toFixed(2)} kW` : "Document uploaded", color: "text-accent" },
  ];

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold font-display text-foreground">Review & Submit</h2>
        <p className="text-muted-foreground mt-1">Review your request details before submission</p>
      </div>

      <div className="glass-card-elevated p-6 mb-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Request Summary</h3>
        <div className="space-y-4">
          {summaryItems.map((item, i) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="flex items-center gap-4 p-4 rounded-xl bg-muted/50"
            >
              <div className={`w-10 h-10 rounded-xl bg-card flex items-center justify-center ${item.color}`}>
                {item.icon}
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">{item.label}</p>
                <p className="font-semibold text-foreground capitalize">{item.value}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>


      {wizardData.utility?.powerType === "temporary" && (
        <div className="glass-card p-6 mb-6 border-accent/20">
          <div className="flex items-center gap-3 mb-3">
            <Zap className="w-5 h-5 text-accent" />
            <h3 className="font-semibold text-foreground">Temporary Power</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Duration: {wizardData.utility.tempDates?.from} to {wizardData.utility.tempDates?.to}.
            Security deposit will be calculated. Notification sent 10 days before expiry.
          </p>
        </div>
      )}

      <div className="flex justify-between mt-8">
        <button onClick={onBack} className="btn-secondary flex items-center gap-2"><ArrowLeft className="w-4 h-4" /> Back</button>
        <button onClick={handleSubmit} className="btn-accent flex items-center gap-2 text-lg px-8">
          <Send className="w-5 h-5" /> Submit Request
        </button>
      </div>
    </motion.div>
  );
};

export default SubmitStep;
