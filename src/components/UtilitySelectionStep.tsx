import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Zap, Droplets, Clock, Plug, CreditCard, Gauge, PlusCircle } from "lucide-react";

interface UtilitySelectionStepProps {
  onNext: (data: any) => void;
  onBack: () => void;
}

const UtilitySelectionStep = ({ onNext, onBack }: UtilitySelectionStepProps) => {
  const [selectedUtilities, setSelectedUtilities] = useState<string[]>([]);
  const [powerType, setPowerType] = useState<"postpaid" | "prepaid" | "temporary" | null>(null);
  const [waterType, setWaterType] = useState<"existing" | "new" | null>(null);
  const [tempDates, setTempDates] = useState({ from: "", to: "" });

  const toggleUtility = (u: string) => {
    setSelectedUtilities((prev) =>
      prev.includes(u) ? prev.filter((x) => x !== u) : [...prev, u]
    );
    if (u === "power") setPowerType(null);
    if (u === "water") setWaterType(null);
  };

  const showPower = selectedUtilities.includes("power");
  const showWater = selectedUtilities.includes("water");

  const canContinue =
    selectedUtilities.length > 0 &&
    (!showPower || powerType !== null) &&
    (!showWater || waterType !== null);

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold font-display text-foreground">Utility & Connection Type</h2>
        <p className="text-muted-foreground mt-1">Choose what you need and the type of connection</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <button
          onClick={() => toggleUtility("power")}
          className={`glass-card p-8 text-center transition-all cursor-pointer group ${
            selectedUtilities.includes("power") ? "border-primary ring-2 ring-primary/20" : "hover:border-primary/30"
          }`}
        >
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 transition-all ${
            selectedUtilities.includes("power") ? "gradient-bg" : "bg-primary/10 group-hover:bg-primary/20"
          }`}>
            <Zap className={`w-8 h-8 ${selectedUtilities.includes("power") ? "text-primary-foreground" : "text-primary"}`} />
          </div>
          <h3 className="text-xl font-bold font-display text-foreground">Power</h3>
          <p className="text-sm text-muted-foreground mt-2">Electrical connection for your space</p>
        </button>

        <button
          onClick={() => toggleUtility("water")}
          className={`glass-card p-8 text-center transition-all cursor-pointer group ${
            selectedUtilities.includes("water") ? "border-info ring-2 ring-info/20" : "hover:border-info/30"
          }`}
        >
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 transition-all ${
            selectedUtilities.includes("water") ? "bg-info" : "bg-info/10 group-hover:bg-info/20"
          }`}>
            <Droplets className={`w-8 h-8 ${selectedUtilities.includes("water") ? "text-info-foreground" : "text-info"}`} />
          </div>
          <h3 className="text-xl font-bold font-display text-foreground">Water</h3>
          <p className="text-sm text-muted-foreground mt-2">Domestic & flushing water supply</p>
        </button>
      </div>

      {/* Power Connection Type */}
      {showPower && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 mb-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Power Connection Type</h3>
          <div className="grid grid-cols-3 gap-4">
            <button
              onClick={() => setPowerType("postpaid")}
              className={`p-5 rounded-xl border-2 transition-all text-left ${
                powerType === "postpaid" ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"
              }`}
            >
              <Gauge className="w-6 h-6 text-primary mb-2" />
              <h4 className="font-semibold text-foreground">Postpaid</h4>
              <p className="text-xs text-muted-foreground">Metered, billed monthly</p>
            </button>
            <button
              onClick={() => setPowerType("prepaid")}
              className={`p-5 rounded-xl border-2 transition-all text-left ${
                powerType === "prepaid" ? "border-accent bg-accent/5" : "border-border hover:border-accent/30"
              }`}
            >
              <CreditCard className="w-6 h-6 text-accent mb-2" />
              <h4 className="font-semibold text-foreground">Prepaid</h4>
              <p className="text-xs text-muted-foreground">Non-metered / prepaid</p>
            </button>
            <button
              onClick={() => setPowerType("temporary")}
              className={`p-5 rounded-xl border-2 transition-all text-left ${
                powerType === "temporary" ? "border-warning bg-warning/5" : "border-border hover:border-warning/30"
              }`}
            >
              <Clock className="w-6 h-6 text-warning mb-2" />
              <h4 className="font-semibold text-foreground">Temporary</h4>
              <p className="text-xs text-muted-foreground">Time-limited connection</p>
            </button>
          </div>

          {powerType === "temporary" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">From Date</label>
                <input type="date" value={tempDates.from} onChange={(e) => setTempDates({ ...tempDates, from: e.target.value })} className="input-glass w-full" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">To Date</label>
                <input type="date" value={tempDates.to} onChange={(e) => setTempDates({ ...tempDates, to: e.target.value })} className="input-glass w-full" />
              </div>
            </motion.div>
          )}
        </motion.div>
      )}

      {/* Water Connection Type */}
      {showWater && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 mb-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Water Connection Type</h3>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setWaterType("existing")}
              className={`p-5 rounded-xl border-2 transition-all text-left ${
                waterType === "existing" ? "border-info bg-info/5" : "border-border hover:border-info/30"
              }`}
            >
              <Plug className="w-6 h-6 text-info mb-2" />
              <h4 className="font-semibold text-foreground">Existing Meter</h4>
              <p className="text-xs text-muted-foreground">Already have a water meter installed</p>
            </button>
            <button
              onClick={() => setWaterType("new")}
              className={`p-5 rounded-xl border-2 transition-all text-left ${
                waterType === "new" ? "border-info bg-info/5" : "border-border hover:border-info/30"
              }`}
            >
              <PlusCircle className="w-6 h-6 text-info mb-2" />
              <h4 className="font-semibold text-foreground">New Meter</h4>
              <p className="text-xs text-muted-foreground">Need a new water meter installed</p>
            </button>
          </div>
        </motion.div>
      )}

      <div className="flex justify-between mt-8">
        <button onClick={onBack} className="btn-secondary flex items-center gap-2"><ArrowLeft className="w-4 h-4" /> Back</button>
        <button onClick={() => onNext({ selectedUtilities, powerType, waterType, tempDates })} disabled={!canContinue} className="btn-primary flex items-center gap-2 disabled:opacity-50">Continue <ArrowRight className="w-4 h-4" /></button>
      </div>
    </motion.div>
  );
};

export default UtilitySelectionStep;
