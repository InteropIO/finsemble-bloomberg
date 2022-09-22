import { FEAGlobals } from "@finsemble/finsemble-core";
import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
import SecurityFinder from "./SecurityFinder";

function BBGReady() {
  ReactDOM.render(<SecurityFinder />, document.getElementById("root"));
}

FEAGlobals.FSBL.addEventListener("onReady", BBGReady);
