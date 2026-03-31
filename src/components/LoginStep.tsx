import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Phone, Building2, User, Mail, ArrowRight, Zap, Droplets,
  Search, Plus, Upload, CheckCircle2, AlertCircle, Hash, Clock,
} from "lucide-react";
import type { UserRole } from "@/lib/roles";
import { registerUser } from "@/lib/userRegistry";
import { submitCcRequest, getCcRequestByMobile, type CcRequest } from "@/lib/ccRequestStore";

// Hardcoded mobile-to-role mapping
const MOBILE_ROLE_MAP: Record<string, UserRole> = {
  "9000000001": "user",
  "9000000002": "spoc",
  "9000000003": "finance",
  "9000000004": "pne",
};

interface LoginStepProps {
  onNext: (data: any) => void;
}

const LoginStep = ({ onNext }: LoginStepProps) => {
  const [isSignup, setIsSignup] = useState(false);
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  // Signup fields
  const [companyName, setCompanyName] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [email, setEmail] = useState("");

  // Customer code (signup only)
  const [hasCode, setHasCode] = useState<boolean | null>(null);
  const [existingCode, setExistingCode] = useState("");
  const [customerForm, setCustomerForm] = useState({
    customerName: "", contactPersonName: "", mobile: "", emailId: "",
    gstin: "", pan: "", tan: "",
    houseNumber: "", streetName: "", city: "", state: "", pinCode: "",
  });
  const [uploadedDocs, setUploadedDocs] = useState<Record<string, boolean>>({
    gstCertificate: false, panCard: false, tanNumber: false,
  });
  const [docError, setDocError] = useState(false);

  // CC request tracking
  const [ccSubmitted, setCcSubmitted] = useState(false);
  const [ccRequest, setCcRequest] = useState<CcRequest | null>(null);

  const handleSendOtp = () => {
    if (mobile.length >= 10) {
      setOtpSent(true);
      // Check for existing CC request on this mobile (for returning users)
      const existing = getCcRequestByMobile(mobile);
      if (existing) {
        setCcRequest(existing);
        setCcSubmitted(true);
        if (existing.type === "verify") {
          setHasCode(true);
          setExistingCode(existing.existingCode || "");
        } else {
          setHasCode(false);
          if (existing.customerForm) {
            setCustomerForm(existing.customerForm as any);
          }
        }
      }
    }
  };

  const handleFieldChange = (field: string, value: string) => {
    setCustomerForm((prev) => ({ ...prev, [field]: value }));
  };

  const toggleDoc = (doc: string) => {
    setUploadedDocs((prev) => ({ ...prev, [doc]: !prev[doc] }));
  };

  // Auto-populate customer code form from signup details
  useEffect(() => {
    if (hasCode === false && !ccSubmitted) {
      setCustomerForm((prev) => ({
        ...prev,
        customerName: prev.customerName || companyName,
        contactPersonName: prev.contactPersonName || contactPerson,
        mobile: prev.mobile || mobile,
        emailId: prev.emailId || email,
      }));
    }
  }, [hasCode, companyName, contactPerson, mobile, email, ccSubmitted]);

  // Refresh CC request status on re-render
  useEffect(() => {
    if (ccSubmitted && mobile) {
      const interval = setInterval(() => {
        const latest = getCcRequestByMobile(mobile);
        if (latest) setCcRequest(latest);
      }, 500);
      return () => clearInterval(interval);
    }
  }, [ccSubmitted, mobile]);

  const cleanMobile = mobile.replace(/\D/g, "").slice(-10);
  const detectedRole = MOBILE_ROLE_MAP[cleanMobile] || "user";

  const allDocsUploaded = uploadedDocs.gstCertificate && uploadedDocs.panCard && uploadedDocs.tanNumber;

  const handleSubmitCcRequest = () => {
    if (hasCode === true && existingCode) {
      // Submit verification request to finance
      submitCcRequest({
        type: "verify",
        mobile,
        existingCode,
      });
      setCcSubmitted(true);
      const req = getCcRequestByMobile(mobile);
      if (req) setCcRequest(req);
    } else if (hasCode === false) {
      if (!allDocsUploaded) {
        setDocError(true);
        return;
      }
      setDocError(false);
      // Submit creation request to finance
      submitCcRequest({
        type: "create",
        mobile,
        customerForm,
        uploadedDocs,
      });
      setCcSubmitted(true);
      const req = getCcRequestByMobile(mobile);
      if (req) setCcRequest(req);
    }
  };

  const handleSubmit = () => {
    // For signup: must have approved CC request
    if (isSignup) {
      if (!ccRequest || ccRequest.status !== "approved") return;

      const code = ccRequest.approvedCode;

      const loginPayload = {
        mobile,
        role: detectedRole,
        isSignup,
        companyName: isSignup ? companyName : undefined,
        contactPerson: isSignup ? contactPerson : undefined,
        email: isSignup ? email : undefined,
        customerCode: code,
        customerForm: hasCode === false ? customerForm : undefined,
      };

      registerUser({
        mobile,
        companyName,
        contactPerson,
        email,
        customerCode: code,
        customerForm: hasCode === false ? customerForm : undefined,
      });

      onNext(loginPayload);
      return;
    }

    // Login flow (no signup)
    const loginPayload = {
      mobile,
      role: detectedRole,
      isSignup: false,
    };
    onNext(loginPayload);
  };

  const ccApproved = ccRequest?.status === "approved";
  const ccPending = ccRequest?.status === "pending";
  const ccRejected = ccRequest?.status === "rejected";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex items-center justify-center min-h-[60vh]"
    >
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl gradient-bg flex items-center justify-center">
              <Zap className="w-6 h-6 text-primary-foreground" />
            </div>
            <div className="w-12 h-12 rounded-2xl gradient-accent-bg flex items-center justify-center">
              <Droplets className="w-6 h-6 text-accent-foreground" />
            </div>
          </div>
          <h1 className="text-3xl font-bold font-display text-foreground mb-2">
            Utility Connect
          </h1>
          <p className="text-muted-foreground">
            {isSignup ? "Create your account to get started" : "Welcome back! Sign in to continue"}
          </p>
        </div>

        <div className="glass-card-elevated p-8">
          <div className="flex gap-2 mb-6 p-1 bg-muted rounded-xl">
            <button
              onClick={() => setIsSignup(false)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                !isSignup ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
              }`}
            >
              Login
            </button>
            <button
              onClick={() => setIsSignup(true)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isSignup ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
              }`}
            >
              Sign Up
            </button>
          </div>

          <div className="space-y-4">
            {isSignup && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="space-y-4"
              >
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Company Name</label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Enter company name" className="input-glass w-full pl-10" />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Contact Person</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input type="text" value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} placeholder="Full name" className="input-glass w-full pl-10" />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Email ID</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@company.com" className="input-glass w-full pl-10" />
                  </div>
                </div>
              </motion.div>
            )}

            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Mobile Number</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="tel"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  placeholder="+91 XXXXX XXXXX"
                  className="input-glass w-full pl-10"
                  maxLength={15}
                />
              </div>
            </div>

            {!otpSent ? (
              <button
                onClick={handleSendOtp}
                disabled={mobile.length < 10}
                className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
              >
                Send OTP
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Enter OTP</label>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="6-digit OTP"
                    className="input-glass w-full text-center text-lg tracking-[0.5em]"
                    maxLength={6}
                  />
                  <p className="text-xs text-muted-foreground mt-1.5">OTP sent to {mobile}</p>
                </div>

                {/* Customer Code section - signup only, after OTP */}
                {isSignup && otp.length >= 4 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="space-y-4 pt-2 border-t border-border"
                  >
                    <h3 className="text-sm font-semibold text-foreground">Customer Identification</h3>

                    {/* CC request already approved – show success */}
                    {ccApproved && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 rounded-xl border-2 border-success bg-success/5">
                        <div className="flex items-center gap-2 text-success mb-1">
                          <CheckCircle2 className="w-5 h-5" />
                          <span className="font-semibold text-sm">Customer Code Approved</span>
                        </div>
                        <p className="text-foreground font-mono font-bold text-lg">{ccRequest?.approvedCode}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {ccRequest?.type === "verify" ? "Your code has been verified by the finance team." : "Your customer code has been created by the finance team."}
                        </p>
                      </motion.div>
                    )}

                    {/* CC request pending – show waiting state */}
                    {ccPending && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 rounded-xl border-2 border-warning bg-warning/5">
                        <div className="flex items-center gap-2 text-warning mb-1">
                          <Clock className="w-5 h-5" />
                          <span className="font-semibold text-sm">Pending Finance Approval</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Your {ccRequest?.type === "verify" ? "verification" : "creation"} request ({ccRequest?.id}) has been submitted to the finance team. Please wait for approval or log back in later.
                        </p>
                        <p className="text-xs text-muted-foreground mt-2 italic">
                          💡 To test: Log out, log in as Finance (9000000003), approve the request, then log back in as this user.
                        </p>
                      </motion.div>
                    )}

                    {/* CC request rejected */}
                    {ccRejected && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 rounded-xl border-2 border-destructive bg-destructive/5">
                        <div className="flex items-center gap-2 text-destructive mb-1">
                          <AlertCircle className="w-5 h-5" />
                          <span className="font-semibold text-sm">Request Rejected</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Reason: {ccRequest?.rejectionReason || "No reason provided"}
                        </p>
                        <button
                          onClick={() => { setCcSubmitted(false); setCcRequest(null); setHasCode(null); }}
                          className="mt-2 text-xs text-primary font-medium hover:underline"
                        >
                          Try again
                        </button>
                      </motion.div>
                    )}

                    {/* Initial choice – not yet submitted */}
                    {!ccSubmitted && hasCode === null && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-3">Do you have a Customer Code?</p>
                        <div className="grid grid-cols-2 gap-3">
                          <button onClick={() => setHasCode(true)} className="p-3 rounded-xl border border-border hover:border-primary/50 transition-all text-center">
                            <Search className="w-5 h-5 text-primary mx-auto mb-1" />
                            <span className="text-xs font-medium text-foreground block">Yes, I have one</span>
                          </button>
                          <button onClick={() => setHasCode(false)} className="p-3 rounded-xl border border-border hover:border-primary/50 transition-all text-center">
                            <Plus className="w-5 h-5 text-accent mx-auto mb-1" />
                            <span className="text-xs font-medium text-foreground block">No, create new</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Verify existing code – not yet submitted */}
                    {!ccSubmitted && hasCode === true && (
                      <div>
                        <div className="flex gap-2">
                          <input type="text" value={existingCode} onChange={(e) => setExistingCode(e.target.value)} placeholder="Enter Customer Code" className="input-glass flex-1" />
                          <button onClick={handleSubmitCcRequest} className="btn-primary text-sm px-4" disabled={!existingCode}>
                            Submit for Verification
                          </button>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">Your code will be sent to the finance team for verification.</p>
                        <button onClick={() => { setHasCode(null); setExistingCode(""); }} className="mt-2 text-xs text-primary font-medium hover:underline">
                          ← Back to choose again
                        </button>
                      </div>
                    )}

                    {/* Create new code – not yet submitted */}
                    {!ccSubmitted && hasCode === false && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                        <p className="text-xs text-muted-foreground">Fill in details — Finance will review and assign your Customer Code</p>
                        <div className="grid grid-cols-2 gap-3">
                          <div><label className="text-xs font-medium text-foreground mb-1 block">Customer Name *</label><input type="text" value={customerForm.customerName} onChange={(e) => handleFieldChange("customerName", e.target.value)} className="input-glass w-full text-sm" placeholder="Company name" /></div>
                          <div><label className="text-xs font-medium text-foreground mb-1 block">Contact Person *</label><input type="text" value={customerForm.contactPersonName} onChange={(e) => handleFieldChange("contactPersonName", e.target.value)} className="input-glass w-full text-sm" placeholder="Full name" /></div>
                          <div><label className="text-xs font-medium text-foreground mb-1 block">Mobile *</label><input type="tel" value={customerForm.mobile} onChange={(e) => handleFieldChange("mobile", e.target.value)} className="input-glass w-full text-sm" /></div>
                          <div><label className="text-xs font-medium text-foreground mb-1 block">Email *</label><input type="email" value={customerForm.emailId} onChange={(e) => handleFieldChange("emailId", e.target.value)} className="input-glass w-full text-sm" /></div>
                          <div><label className="text-xs font-medium text-foreground mb-1 block">GSTIN</label><input type="text" value={customerForm.gstin} onChange={(e) => handleFieldChange("gstin", e.target.value)} className="input-glass w-full text-sm" /></div>
                          <div><label className="text-xs font-medium text-foreground mb-1 block">PAN</label><input type="text" value={customerForm.pan} onChange={(e) => handleFieldChange("pan", e.target.value)} className="input-glass w-full text-sm" /></div>
                          <div><label className="text-xs font-medium text-foreground mb-1 block">TAN</label><input type="text" value={customerForm.tan} onChange={(e) => handleFieldChange("tan", e.target.value)} className="input-glass w-full text-sm" /></div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="col-span-2"><label className="text-xs font-medium text-foreground mb-1 block">Address</label></div>
                          <div><input type="text" value={customerForm.houseNumber} onChange={(e) => handleFieldChange("houseNumber", e.target.value)} className="input-glass w-full text-sm" placeholder="House No." /></div>
                          <div><input type="text" value={customerForm.streetName} onChange={(e) => handleFieldChange("streetName", e.target.value)} className="input-glass w-full text-sm" placeholder="Street" /></div>
                          <div><input type="text" value={customerForm.city} onChange={(e) => handleFieldChange("city", e.target.value)} className="input-glass w-full text-sm" placeholder="City" /></div>
                          <div><input type="text" value={customerForm.state} onChange={(e) => handleFieldChange("state", e.target.value)} className="input-glass w-full text-sm" placeholder="State" /></div>
                          <div><input type="text" value={customerForm.pinCode} onChange={(e) => handleFieldChange("pinCode", e.target.value)} className="input-glass w-full text-sm" placeholder="PIN Code" maxLength={6} /></div>
                        </div>

                        {/* Mandatory Document Uploads */}
                        <div className="pt-3 border-t border-border">
                          <h4 className="text-xs font-semibold text-foreground mb-2">Upload Documents <span className="text-destructive">*</span></h4>
                          <div className="grid grid-cols-3 gap-2">
                            {[
                              { key: "gstCertificate", label: "GST Certificate" },
                              { key: "panCard", label: "PAN Card" },
                              { key: "tanNumber", label: "TAN Document" },
                            ].map((doc) => (
                              <button
                                key={doc.key}
                                onClick={() => { toggleDoc(doc.key); setDocError(false); }}
                                className={`p-3 rounded-xl border-2 border-dashed transition-all text-center ${
                                  uploadedDocs[doc.key]
                                    ? "border-success bg-success/5"
                                    : docError && !uploadedDocs[doc.key]
                                    ? "border-destructive bg-destructive/5"
                                    : "border-border hover:border-primary/50"
                                }`}
                              >
                                {uploadedDocs[doc.key] ? (
                                  <CheckCircle2 className="w-5 h-5 text-success mx-auto mb-1" />
                                ) : (
                                  <Upload className="w-5 h-5 text-muted-foreground mx-auto mb-1" />
                                )}
                                <span className="text-[10px] font-medium text-foreground block">{doc.label}</span>
                                <span className="text-[10px] text-destructive font-medium">Required *</span>
                              </button>
                            ))}
                          </div>
                          {docError && (
                            <div className="mt-2 flex items-center gap-1 text-xs text-destructive font-medium">
                              <AlertCircle className="w-3 h-3" />
                              All three documents are mandatory.
                            </div>
                          )}
                        </div>

                        {/* Submit to Finance button */}
                        <button
                          onClick={handleSubmitCcRequest}
                          className="btn-primary w-full text-sm mt-2"
                        >
                          Submit to Finance for Review
                        </button>
                      </motion.div>
                    )}
                  </motion.div>
                )}

                <button
                  onClick={handleSubmit}
                  disabled={
                    otp.length < 4 ||
                    (isSignup && !ccApproved)
                  }
                  className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSignup
                    ? ccApproved
                      ? "Create Account"
                      : "Awaiting Finance Approval..."
                    : "Verify & Login"}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default LoginStep;
