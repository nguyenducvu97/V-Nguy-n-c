/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Shell } from "./components/layout/Shell";
import { Dashboard } from "./components/dashboard/Dashboard";
import { AIAnalysis } from "./components/analysis/AIAnalysis";
import { Scanner } from "./components/scanner/Scanner";
import { Portfolio } from "./components/portfolio/Portfolio";

export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard");

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <Dashboard />;
      case "analysis":
        return <AIAnalysis />;
      case "scanner":
        return <Scanner />;
      case "portfolio":
        return <Portfolio />;
      case "watchlist":
        return <div className="flex items-center justify-center h-[60vh] text-slate-500 italic">Tính năng theo dõi đang phát triển...</div>;
      default:
        return <Dashboard />;
    }
  };

  return (
    <Shell activeTab={activeTab} setActiveTab={setActiveTab}>
      {renderContent()}
    </Shell>
  );
}

