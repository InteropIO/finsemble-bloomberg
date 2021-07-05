import {BloombergBridgeClient} from "./BloombergBridgeClient";

/**
 * Automated setup function enabling use as preload on a Finsemble component.
 */
 const setupBloombergBridgeClient = () => {
    console.log("Setting up BloombergBridgeClient");
	(FSBL as any).Clients.BloombergBridgeClient = new BloombergBridgeClient((FSBL as any).Clients.Router, (FSBL as any).Clients.Logger);
	window.dispatchEvent(new Event('BloombergBridgeClientReady'));
};

// Startup pattern for preload. Preloads can come in any order, so we need to wait on either the window event or the
// FSBL event
if ((window as any).FSBL && (FSBL as any).addEventListener) {
    (FSBL as any).addEventListener("onReady", setupBloombergBridgeClient);
} else {
    window.addEventListener("FSBLReady", setupBloombergBridgeClient);
}