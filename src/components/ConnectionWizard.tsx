import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { LogIn, FolderOpen, Zap, Calculator, Send } from "lucide-react";
import StepperHeader from "./StepperHeader";
import LoginStep from "./LoginStep";
import SpaceDocumentStep from "./SpaceDocumentStep";
import UtilitySelectionStep from "./UtilitySelectionStep";
import LoadCalculatorStep from "./LoadCalculatorStep";
import SubmitStep from "./SubmitStep";
import ConnectionDashboard from "./ConnectionDashboard";
import InternalDashboard from "./InternalDashboard";
import type { UserRole } from "@/lib/roles";
import { ROLES } from "@/lib/roles";

// Steps without CustomerCodeStep (removed from request flow)
const STEPS = [
  { id: 1, title: "Login", icon: <LogIn className="w-4 h-4" /> },
  { id: 2, title: "Space & Docs", icon: <FolderOpen className="w-4 h-4" /> },
  { id: 3, title: "Utilities", icon: <Zap className="w-4 h-4" /> },
  { id: 4, title: "Load", icon: <Calculator className="w-4 h-4" /> },
  { id: 5, title: "Submit", icon: <Send className="w-4 h-4" /> },
];

const ConnectionWizard = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [showDashboard, setShowDashboard] = useState(false);
  const [wizardData, setWizardData] = useState<Record<string, any>>({});
  const [userRole, setUserRole] = useState<UserRole | null>(null);

  const handleNext = (stepKey: string, data: any) => {
    if (stepKey === "login") {
      const role = data.role as UserRole;
      setUserRole(role);

      // Internal roles go straight to their dashboard
      if (role !== "user") {
        setShowDashboard(true);
        setWizardData((prev) => ({ ...prev, [stepKey]: data }));
        return;
      }

      // For returning users (login, not signup), go directly to dashboard
      if (!data.isSignup) {
        setShowDashboard(true);
        setWizardData((prev) => ({ ...prev, [stepKey]: data }));
        return;
      }
    }

    setWizardData((prev) => ({ ...prev, [stepKey]: data }));
    setCurrentStep((prev) => prev + 1);
  };

  const handleBack = () => setCurrentStep((prev) => prev - 1);

  const handleSubmit = () => setShowDashboard(true);

  const handleNewRequest = () => {
    // Start at step 2 (Space & Docs), skip login
    setCurrentStep(2);
    setShowDashboard(false);
  };

  const handleLogout = () => {
    setCurrentStep(1);
    setShowDashboard(false);
    setWizardData({});
    setUserRole(null);
  };

  // Internal team dashboards
  if (showDashboard && userRole && userRole !== "user") {
    const roleInfo = ROLES.find((r) => r.id === userRole)!;
    return <InternalDashboard role={userRole} roleLabel={roleInfo.label} onLogout={handleLogout} />;
  }

  // User dashboard
  if (showDashboard) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8">
        <ConnectionDashboard onNewRequest={handleNewRequest} onLogout={handleLogout} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {currentStep > 1 && (
        <div className="glass-card mx-4 md:mx-8 mt-4 md:mt-6">
          <StepperHeader steps={STEPS} currentStep={currentStep} />
        </div>
      )}

      <div className="p-4 md:p-8">
        <AnimatePresence mode="wait">
          {currentStep === 1 && (
            <LoginStep key="login" onNext={(data) => handleNext("login", data)} />
          )}
          {currentStep === 2 && (
            <SpaceDocumentStep key="space" onNext={(data) => handleNext("space", data)} onBack={handleBack} />
          )}
          {currentStep === 3 && (
            <UtilitySelectionStep key="utility" onNext={(data) => handleNext("utility", data)} onBack={handleBack} />
          )}
          {currentStep === 4 && (
            <LoadCalculatorStep key="load" onNext={(data) => handleNext("load", data)} onBack={handleBack} />
          )}
          {currentStep === 5 && (
            <SubmitStep key="submit" wizardData={wizardData} onBack={handleBack} onSubmit={handleSubmit} />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ConnectionWizard;
