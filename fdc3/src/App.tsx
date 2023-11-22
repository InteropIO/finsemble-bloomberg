/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect } from "react";
import BloombergBridgeApp from "./BloombergBridgeApp";

function App() {
    const [preloadRunning, setPreloadRunning] = useState(false);
    const [bloombergConnected, setBloombergConnected] = useState(false);
    const [forceShow, setForceShow] = useState(false);

    const shouldShowApp = forceShow || (preloadRunning && bloombergConnected);

    useEffect(() => {
        setPreloadRunning("BloombergBridgeClient" in FSBL?.Clients);
        
        FSBL?.Clients?.BloombergBridgeClient?.checkConnection((err, result) => {
            setBloombergConnected(!err && result);
        });

        FSBL.Clients.BloombergBridgeClient.setConnectionEventListener((err, resp) => {
            setBloombergConnected(!err && resp.registered);
        });

    }, []);

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
