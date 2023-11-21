import { FEAGlobals } from "@finsemble/finsemble-core";
import React from "react";
import ReactDOM from "react-dom";
import "./css/index.css";
import BBGToFDC3 from "./BBGToFDC3";

window.addEventListener("BloombergBridgeClientReady", BBGReady);

function BBGReady() {
 // Place render here
}

ReactDOM.render(<BBGToFDC3 />, document.getElementById("root"));
