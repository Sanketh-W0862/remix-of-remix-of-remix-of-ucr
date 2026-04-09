import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Upload, CheckCircle2, MapPin, Plus, Home } from "lucide-react";
import { getSavedAddresses, addSavedAddress, type SavedAddress } from "@/lib/addressStore";

interface SpaceDocumentStepProps {
  onNext: (data: any) => void;
  onBack: () => void;
}

const SpaceDocumentStep = ({ onNext, onBack }: SpaceDocumentStepProps) => {
  const [address, setAddress] = useState("");
  const [addressLabel, setAddressLabel] = useState("");
  const [selectedSavedId, setSelectedSavedId] = useState<string | null>(null);
  const [documents, setDocuments] = useState({
    noc: false, loi: false, agreement: false, poa: false,
  });

  const savedAddresses = getSavedAddresses();

  const requiredDocs = [
    { key: "noc", label: "NOC", desc: "No Objection Certificate" },
    { key: "loi", label: "LOI", desc: "Letter of Intent" },
    { key: "agreement", label: "Agreement", desc: "Signed Agreement" },
    { key: "poa", label: "PO", desc: "Purchase Order" },
  ];

  const completedCount = Object.values(documents).filter(Boolean).length;

  const handleSelectSaved = (saved: SavedAddress) => {
    setSelectedSavedId(saved.id);
    setAddress(saved.address);
    setAddressLabel(saved.label);
  };

  const handleContinue = () => {
    let addrEntry: SavedAddress;
    if (selectedSavedId) {
      addrEntry = savedAddresses.find((a) => a.id === selectedSavedId)!;
    } else {
      // Save new address
      addrEntry = addSavedAddress(address, addressLabel || undefined);
    }
    onNext({ addressId: addrEntry.id, address: addrEntry.address, addressLabel: addrEntry.label, documents });
  };

  const isValid = address.trim().length > 0;

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold font-display text-foreground">Address & Documents</h2>
        <p className="text-muted-foreground mt-1">Enter your connection address and upload mandatory documents</p>
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

      {/* Address Section */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-primary" /> Connection Address
        </h3>

        {/* Saved Addresses */}
        {savedAddresses.length > 0 && (
          <div className="mb-5">
            <p className="text-sm text-muted-foreground mb-3">Select a saved address or add a new one</p>
            <div className="space-y-2 mb-4">
              {savedAddresses.map((saved) => (
                <button
                  key={saved.id}
                  onClick={() => handleSelectSaved(saved)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                    selectedSavedId === saved.id
                      ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                      : "border-border hover:border-primary/30"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                      selectedSavedId === saved.id ? "bg-primary/10" : "bg-muted"
                    }`}>
                      <Home className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-foreground">{saved.label}</span>
                        <span className="text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{saved.id}</span>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{saved.address}</p>
                    </div>
                    {selectedSavedId === saved.id && <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />}
                  </div>
                </button>
              ))}
            </div>
            <button
              onClick={() => { setSelectedSavedId(null); setAddress(""); setAddressLabel(""); }}
              className={`inline-flex items-center gap-1.5 text-sm font-medium transition-colors ${
                !selectedSavedId ? "text-primary" : "text-muted-foreground hover:text-primary"
              }`}
            >
              <Plus className="w-4 h-4" /> Add new address
            </button>
          </div>
        )}

        {/* New Address Input */}
        {(!selectedSavedId || savedAddresses.length === 0) && (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Address Label (optional)</label>
              <input
                type="text"
                value={addressLabel}
                onChange={(e) => setAddressLabel(e.target.value)}
                placeholder="e.g. Head Office, Warehouse B, Shop 42"
                className="input-glass w-full"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Full Address *</label>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Enter the complete address for the connection..."
                className="input-glass w-full min-h-[100px] resize-none"
                rows={3}
              />
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-between mt-8">
        <button onClick={onBack} className="btn-secondary flex items-center gap-2"><ArrowLeft className="w-4 h-4" /> Back</button>
        <button onClick={handleContinue} disabled={!isValid} className="btn-primary flex items-center gap-2 disabled:opacity-50">Continue <ArrowRight className="w-4 h-4" /></button>
      </div>
    </motion.div>
  );
};

export default SpaceDocumentStep;
