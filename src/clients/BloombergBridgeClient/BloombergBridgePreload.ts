import { types } from "@finsemble/finsemble-core";

import { BloombergBridgeClient } from "./BloombergBridgeClient";

/**
 * Automated setup function enabling use as preload on a Finsemble component.
 */
const setupBloombergBridgeClient = () => {
  console.log("Setting up BloombergBridgeClient");
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  FSBL.Clients.BloombergBridgeClient = new BloombergBridgeClient(
    FSBL.Clients.RouterClient,
    FSBL.Clients.Logger
  );
  window.dispatchEvent(new Event("BloombergBridgeClientReady"));
};

// Startup pattern for preload. Preloads can come in any order, so we need to wait on either the window event or the
// FSBL event
if (window.FSBL && FSBL.addEventListener) {
  FSBL.addEventListener("onReady", setupBloombergBridgeClient);
} else {
  window.addEventListener("FSBLReady", setupBloombergBridgeClient);
}
