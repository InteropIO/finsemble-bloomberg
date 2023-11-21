import React, {ChangeEventHandler, useEffect} from "react";
import {SecuritySearchBox} from "./components/SecuritySearchBox";
import {LaunchPadContent} from "./components/LaunchPadConent";
import {TerminalContent} from "./components/TerminalContent";

export const BBGToFDC3 = () => {

  useEffect(() => {
    // Initial setup
  })

  return <div className="container">
    <div className="header">
      <SecuritySearchBox value={""} changeFunction={() => {}} />
    </div>
    <div className="body">
      <div className="tabs">
        <div className="tab launchpad-tab active-tab">Launchpad</div>
        <div className="tab terminal-tab">Terminal</div>
      </div>
      <div className="tab-content">
        <div className="tab-content launchpad-tab-content">
          <LaunchPadContent security={""} />
        </div>
        <div className="tab-content terminal-tab-content">
          <TerminalContent security={""} />
        </div>
      </div>
    </div>
  </div>;
}


export default BBGToFDC3;
