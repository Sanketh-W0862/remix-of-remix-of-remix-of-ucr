import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Upload, CheckCircle2, MapPin, Hash, ChevronDown } from "lucide-react";
import { getSpaceMeter } from "@/lib/workflows";

interface SpaceDocumentStepProps {
  onNext: (data: any) => void;
  onBack: () => void;
}

const SPACE_OPTIONS = ["SP0001", "SP0002", "SP0003", "SP0004", "SP0005", "SP0006"];

const SpaceDocumentStep = ({ onNext, onBack }: SpaceDocumentStepProps) => {
  const [spaceMethod, setSpaceMethod] = useState<"id" | "manual">("id");
  const [spaceId, setSpaceId] = useState("");
  const [address, setAddress] = useState({ line1: "", line2: "", city: "", state: "", pin: "" });
  const [documents, setDocuments] = useState({
    noc: false, loi: false, agreement: false, poa: false,
  });

  const requiredDocs = [
    { key: "noc", label: "NOC", desc: "No Objection Certificate" },
    { key: "loi", label: "LOI", desc: "Letter of Intent" },
    { key: "agreement", label: "Agreement", desc: "Signed Agreement" },
    { key: "poa", label: "PO", desc: "Purchase Order" },
  ];

  const completedCount = Object.values(documents).filter(Boolean).length;
  const selectedSpaceConfig = spaceId ? getSpaceMeter(spaceId) : undefined;

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold font-display text-foreground">Space & Documents</h2>
        <p className="text-muted-foreground mt-1">Identify your space and upload mandatory documents</p>
      </div>

      {/* Document Checklist */}
      <div className="glass-card p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">Upload Any Document</h3>
          <div className="flex items-center gap-2">
            <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-full gradient-bg rounded-full transition-all" style={{ width: `${(completedCount / 4) * 100}%` }} />
            </div>
            <span className="text-xs text-muted-foreground">{completedCount}/4</span>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {requiredDocs.map((doc) => (
            <button
              key={doc.key}
              onClick={() => setDocuments((prev) => ({ ...prev, [doc.key]: !prev[doc.key as keyof typeof prev] }))}
              className={`p-5 rounded-xl border-2 border-dashed transition-all text-left ${
                documents[doc.key as keyof typeof documents] ? "border-success bg-success/5" : "border-border hover:border-primary/50"
              }`}
            >
              <div className="flex items-start gap-3">
                {documents[doc.key as keyof typeof documents] ? (
                  <CheckCircle2 className="w-6 h-6 text-success mt-0.5" />
                ) : (
                  <Upload className="w-6 h-6 text-muted-foreground mt-0.5" />
                )}
                <div>
                  <h4 className="font-semibold text-foreground">{doc.label}</h4>
                  <p className="text-sm text-muted-foreground">{doc.desc}</p>
                  <p className="text-xs mt-1 font-medium">{documents[doc.key as keyof typeof documents] ? "✓ Uploaded" : "Click to upload"}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Space Selection */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Space Identification</h3>
        <div className="flex gap-2 mb-4 p-1 bg-muted rounded-xl">
          <button onClick={() => setSpaceMethod("id")} className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${spaceMethod === "id" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}>
            <Hash className="w-4 h-4" /> Space ID
          </button>
          <button onClick={() => setSpaceMethod("manual")} className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${spaceMethod === "manual" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}>
            <MapPin className="w-4 h-4" /> Manual Address
          </button>
        </div>

        {spaceMethod === "id" ? (
          <div className="space-y-3">
            <div className="relative">
              <select
                value={spaceId}
                onChange={(e) => setSpaceId(e.target.value)}
                className="input-glass w-full appearance-none pr-10"
              >
                <option value="">Select Space ID</option>
                {SPACE_OPTIONS.map((id) => (
                  <option key={id} value={id}>{id}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            </div>

            {spaceId && (
              <div className="rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
                {selectedSpaceConfig ? (
                  <>
                    Space <span className="font-semibold text-foreground">{spaceId}</span> is configured as{" "}
                    <span className="font-semibold text-foreground">{selectedSpaceConfig.label}</span>.
                  </>
                ) : (
                  <>
                    Space <span className="font-semibold text-foreground">{spaceId}</span> is selected.
                  </>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2"><input type="text" value={address.line1} onChange={(e) => setAddress({ ...address, line1: e.target.value })} placeholder="Address Line 1" className="input-glass w-full" /></div>
            <div className="md:col-span-2"><input type="text" value={address.line2} onChange={(e) => setAddress({ ...address, line2: e.target.value })} placeholder="Address Line 2" className="input-glass w-full" /></div>
            <input type="text" value={address.city} onChange={(e) => setAddress({ ...address, city: e.target.value })} placeholder="City" className="input-glass w-full" />
            <input type="text" value={address.state} onChange={(e) => setAddress({ ...address, state: e.target.value })} placeholder="State" className="input-glass w-full" />
            <input type="text" value={address.pin} onChange={(e) => setAddress({ ...address, pin: e.target.value })} placeholder="PIN Code" className="input-glass w-full" maxLength={6} />
          </div>
        )}
      </div>

      <div className="flex justify-between mt-8">
        <button onClick={onBack} className="btn-secondary flex items-center gap-2"><ArrowLeft className="w-4 h-4" /> Back</button>
        <button onClick={() => onNext({ spaceMethod, spaceId, address, documents })} className="btn-primary flex items-center gap-2">Continue <ArrowRight className="w-4 h-4" /></button>
      </div>
    </motion.div>
  );
};

export default SpaceDocumentStep;
