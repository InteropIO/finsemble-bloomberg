import React, {ChangeEventHandler, useEffect, useState} from "react";
import {SecuritySearchBox} from "./components/SecuritySearchBox";
import {LaunchPadContent} from "./components/LaunchPadConent";
import {TerminalContent} from "./components/TerminalContent";

export const BBGToFDC3 = () => {
  const [activeTab, setActiveTab]  = useState("launchpad")

  useEffect(() => {
    setActiveTab("launchpad")
    // Initial setup
  })

  console.log(activeTab);

  return <div className="container">
    <div className="header">
      <SecuritySearchBox value={""} changeFunction={() => {}} />
    </div>
    <div className="body">
      <div className="tabs">
        <div className={`tab launchpad-tab ${activeTab == "launchpad" ? "active-tab" : ""}`}>Launchpad</div>
        <div className={`tab terminal-tab ${activeTab == "terminal" ? "active-tab" : ""}`}>Terminal</div>
      </div>
      <div className="tab-content-container">
        <div className={`tab-content launchpad-tab-content ${activeTab == "launchpad" ? "active" : ""}`}>
          <LaunchPadContent security={""} />
        </div>
        <div className={`tab-content terminal-tab-content ${activeTab == "terminal" ? "active": ""}`}>
          <TerminalContent security={""} />
        </div>
      </div>
    </div>
  </div>;
}


export default BBGToFDC3;
