import {FEAGlobals, FinsembleProvider} from "@finsemble/finsemble-core";
import React from "react";
import ReactDOM from "react-dom";
import "./css/index.css";
import BBGToFDC3 from "./BBGToFDC3";

ReactDOM.render(<FinsembleProvider><BBGToFDC3 /></FinsembleProvider>, document.getElementById("root"));

