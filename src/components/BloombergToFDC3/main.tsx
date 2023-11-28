import {FEAGlobals, FinsembleCSS, FinsembleProvider} from "@finsemble/finsemble-core";
import React from 'react';
import ReactDOM from 'react-dom/client'
import App from './App'
import "./css/App.css";

const BridgeReady = () => {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <><FinsembleCSS /><App /></>,
  )
};

if (window.FSBL && window.FSBL.Clients && Object.prototype.hasOwnProperty.call(FSBL.Clients,"BloombergBridgeClient")) {
  BridgeReady();
} else {
  window.addEventListener("BloombergBridgeClientReady", BridgeReady);
}