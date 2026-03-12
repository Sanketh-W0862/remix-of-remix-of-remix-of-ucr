import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Calculator, Upload, Plus, Minus, Zap } from "lucide-react";

interface LoadCalculatorStepProps {
  onNext: (data: any) => void;
  onBack: () => void;
}

const DEFAULT_APPLIANCES = [
  { name: "Fan", kw: 0.075, icon: "🌀" },
  { name: "LED Light", kw: 0.015, icon: "💡" },
  { name: "AC (1.5 Ton)", kw: 1.5, icon: "❄️" },
  { name: "Computer", kw: 0.2, icon: "💻" },
  { name: "Printer", kw: 0.1, icon: "🖨️" },
  { name: "Water Pump", kw: 1.0, icon: "💧" },
  { name: "Heater", kw: 2.0, icon: "🔥" },
  { name: "Refrigerator", kw: 0.15, icon: "🧊" },
];

const LoadCalculatorStep = ({ onNext, onBack }: LoadCalculatorStepProps) => {
  const [method, setMethod] = useState<"calculator" | "upload">("calculator");
  const [quantities, setQuantities] = useState<Record<string, number>>(
    Object.fromEntries(DEFAULT_APPLIANCES.map((a) => [a.name, 0]))
  );
  const [kwValues, setKwValues] = useState<Record<string, number>>(
    Object.fromEntries(DEFAULT_APPLIANCES.map((a) => [a.name, a.kw]))
  );
  const [docUploaded, setDocUploaded] = useState(false);
  const [manualKW, setManualKW] = useState("");
  const [manualKVA, setManualKVA] = useState("");

  // Others section
  const [otherName, setOtherName] = useState("");
  const [otherKW, setOtherKW] = useState("");

  const updateQty = (name: string, delta: number) => {
    setQuantities((prev) => ({
      ...prev,
      [name]: Math.max(0, (prev[name] || 0) + delta),
    }));
  };

  const updateKw = (name: string, value: string) => {
    const num = parseFloat(value);
    setKwValues((prev) => ({ ...prev, [name]: isNaN(num) ? 0 : num }));
  };

  const calcKW = DEFAULT_APPLIANCES.reduce(
    (sum, a) => sum + (kwValues[a.name] || 0) * (quantities[a.name] || 0),
    0
  ) + (parseFloat(otherKW) || 0);
  const calcKVA = calcKW / 0.8;

  const displayKW = method === "upload" && manualKW ? parseFloat(manualKW) || 0 : calcKW;
  const displayKVA = method === "upload" && manualKVA ? parseFloat(manualKVA) || 0 : calcKVA;

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold font-display text-foreground">Load Requirements</h2>
        <p className="text-muted-foreground mt-1">Calculate or specify your power load requirements</p>
      </div>

      <div className="flex gap-2 mb-6 p-1 bg-muted rounded-xl max-w-md">
        <button onClick={() => setMethod("calculator")} className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${method === "calculator" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}>
          <Calculator className="w-4 h-4" /> AI Calculator
        </button>
        <button onClick={() => setMethod("upload")} className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${method === "upload" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}>
          <Upload className="w-4 h-4" /> Upload Document
        </button>
      </div>

      {method === "calculator" ? (
        <div className="space-y-6">
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Appliance Library</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {DEFAULT_APPLIANCES.map((appliance) => (
                <div
                  key={appliance.name}
                  className={`p-4 rounded-xl border transition-all ${
                    quantities[appliance.name] > 0 ? "border-primary/30 bg-primary/5" : "border-border"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{appliance.icon}</span>
                      <h4 className="font-medium text-foreground text-sm">{appliance.name}</h4>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => updateQty(appliance.name, -1)} className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors">
                        <Minus className="w-3 h-3 text-foreground" />
                      </button>
                      <span className="w-8 text-center font-semibold text-foreground">{quantities[appliance.name]}</span>
                      <button onClick={() => updateQty(appliance.name, 1)} className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center hover:opacity-90 transition-opacity">
                        <Plus className="w-3 h-3 text-primary-foreground" />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-muted-foreground whitespace-nowrap">kW per unit:</label>
                    <input
                      type="number"
                      min="0"
                      step="0.001"
                      value={kwValues[appliance.name]}
                      onChange={(e) => updateKw(appliance.name, e.target.value)}
                      className="flex h-8 w-full rounded-lg border border-input bg-background px-2 py-1 text-xs ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Others section */}
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Others</h3>
            <p className="text-sm text-muted-foreground mb-4">Add custom appliances not listed above</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Appliance Name</label>
                <input
                  type="text"
                  value={otherName}
                  onChange={(e) => setOtherName(e.target.value)}
                  placeholder="e.g. Industrial Motor"
                  className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Power (kW)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={otherKW}
                  onChange={(e) => setOtherKW(e.target.value)}
                  placeholder="e.g. 5.0"
                  className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
              </div>
            </div>
            {otherKW && parseFloat(otherKW) > 0 && (
              <div className="mt-3 p-2 rounded-lg bg-primary/5 border border-primary/10">
                <p className="text-xs text-muted-foreground">
                  {otherName || "Custom appliance"}: {parseFloat(otherKW).toFixed(2)} kW added to total
                </p>
              </div>
            )}
          </div>

          {/* Summary */}
          <motion.div
            initial={false}
            animate={{ scale: displayKW > 0 ? 1 : 0.98, opacity: displayKW > 0 ? 1 : 0.6 }}
            className="glass-card-elevated p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center">
                <Zap className="w-5 h-5 text-primary-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">Load Summary</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-muted">
                <p className="text-sm text-muted-foreground">Total Load</p>
                <p className="text-3xl font-bold font-display text-foreground">{displayKW.toFixed(2)}<span className="text-sm font-normal text-muted-foreground ml-1">kW</span></p>
              </div>
              <div className="p-4 rounded-xl bg-muted">
                <p className="text-sm text-muted-foreground">Max Demand</p>
                <p className="text-3xl font-bold font-display text-foreground">{displayKVA.toFixed(2)}<span className="text-sm font-normal text-muted-foreground ml-1">kVA</span></p>
              </div>
            </div>
            {displayKW > 0 && method === "calculator" && (
              <div className="mt-4 p-3 rounded-lg bg-primary/5 border border-primary/10">
                <p className="text-xs text-muted-foreground">
                  Breakdown: {DEFAULT_APPLIANCES.filter((a) => quantities[a.name] > 0).map((a) => `${quantities[a.name]}× ${a.name} (${((kwValues[a.name] || 0) * quantities[a.name]).toFixed(2)} kW)`).join(" • ")}
                  {otherKW && parseFloat(otherKW) > 0 ? ` • ${otherName || "Other"} (${parseFloat(otherKW).toFixed(2)} kW)` : ""}
                </p>
              </div>
            )}
          </motion.div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="glass-card p-8">
            <button
              onClick={() => setDocUploaded(!docUploaded)}
              className={`w-full p-12 rounded-xl border-2 border-dashed transition-all text-center ${
                docUploaded ? "border-success bg-success/5" : "border-border hover:border-primary/50"
              }`}
            >
              <Upload className={`w-12 h-12 mx-auto mb-4 ${docUploaded ? "text-success" : "text-muted-foreground"}`} />
              <h4 className="font-semibold text-foreground text-lg">{docUploaded ? "Document Uploaded" : "Upload Load Document"}</h4>
              <p className="text-sm text-muted-foreground mt-2">PDF, DOC, or XLS with maximum demand details</p>
            </button>
          </div>

          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Manual Load Entry</h3>
            <p className="text-sm text-muted-foreground mb-4">Enter load values manually if not included in your document</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Total Load (kW)</label>
                <input type="number" min="0" step="0.01" placeholder="e.g. 15" value={manualKW} onChange={(e) => setManualKW(e.target.value)} className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Maximum Demand (kVA)</label>
                <input type="number" min="0" step="0.01" placeholder="e.g. 18" value={manualKVA} onChange={(e) => setManualKVA(e.target.value)} className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" />
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between mt-8">
        <button onClick={onBack} className="btn-secondary flex items-center gap-2"><ArrowLeft className="w-4 h-4" /> Back</button>
        <button onClick={() => onNext({ method, quantities, kwValues, totalKW: displayKW, totalKVA: displayKVA, docUploaded, otherName, otherKW })} className="btn-primary flex items-center gap-2">Continue <ArrowRight className="w-4 h-4" /></button>
      </div>
    </motion.div>
  );
};

export default LoadCalculatorStep;
