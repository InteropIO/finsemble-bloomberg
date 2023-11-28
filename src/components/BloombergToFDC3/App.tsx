/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any  */

import React, { useState, useEffect } from "react";
import BloombergBridgeApp from "./BloombergBridgeApp";

// This line imports type declarations for Finsemble's globals such as FSBL and fdc3. You can ignore any warnings that it is defined but never used.
// Please use global FSBL and fdc3 objects instead of importing from finsemble-core.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { types } from "@finsemble/finsemble-core";

function App() {
    const [preloadRunning, setPreloadRunning] = useState(false);
    const [bloombergConnected, setBloombergConnected] = useState(false);
    const [forceShow, setForceShow] = useState(true);

    const shouldShowApp = forceShow || (preloadRunning && bloombergConnected);

    useEffect(() => {
        // Check the preload has been added to the config
        setPreloadRunning("BloombergBridgeClient" in FSBL.Clients);
        const BloombergBridgeClient = (FSBL.Clients as any).BloombergBridgeClient;


        // Listen for when the Bloomberg terminal connection has been made and update the status
        BloombergBridgeClient?.checkConnection((err, result) => {
            setBloombergConnected(!err && result);
        });

        // Listen for when the Bloomberg terminal connection has been made and update the status
        BloombergBridgeClient.setConnectionEventListener((err, resp) => {
            setBloombergConnected(!err && resp.registered);
        });

        return () => {
            BloombergBridgeClient.removeConnectionEventListener();
        }

    }, []);

    useEffect(() => {
        // Re-render when one of these values change
    }, [preloadRunning, bloombergConnected])

    return shouldShowApp ? <BloombergBridgeApp /> : <div id="container">
        <div>
            Preload in place: <b>{preloadRunning ? "yes" : "no"}</b>
        </div>
        <div>
            Bloomberg connected: <b>{bloombergConnected ? "yes" : "no"}</b>
        </div>
        <button onClick={() => setForceShow(true)}>Show app anyway</button>
    </div>;
}

export default App;
