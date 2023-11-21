import React, {ChangeEventHandler, useEffect, useState} from "react";
import {SecuritySearchBox} from "./components/SecuritySearchBox";
import {LaunchPadContent} from "./components/LaunchPadConent";
import {TerminalContent} from "./components/TerminalContent";

export const BBGToFDC3 = () => {
  const [activeTab, setActiveTab]  = useState("launchpad")

  useEffect(() => {
    // Initial setup
    FSBL.Clients.WindowClient.getComponentState(
        {
          fields: ["activeTab"],
        },
        (err, state) => {
          if (!err) {
            const fetchedTab = state["activeTab"];
            if(fetchedTab) {
              changeTab(fetchedTab)
            }
          }
        },
    );
  }, [])

  const changeTab = (tabName:string) => {
    // Persist to storage
    FSBL.Clients.WindowClient.setComponentState({field: "activeTab", value: tabName,})
    setActiveTab(tabName);
  }


  return <div className="container">
    <div className="header">
      <SecuritySearchBox value={""} changeFunction={() => {}} />
    </div>
    <div className="body">
      <div className="tabs">
        <div
            className={`tab launchpad-tab ${activeTab == "launchpad" ? "active-tab" : ""}`}
            onClick={() => {
              changeTab("launchpad")
            }}
        >Launchpad</div>
        <div className={`tab terminal-tab ${activeTab == "terminal" ? "active-tab" : ""}`}
             onClick={() => {
               changeTab("terminal")
             }}
        >Terminal</div>
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
