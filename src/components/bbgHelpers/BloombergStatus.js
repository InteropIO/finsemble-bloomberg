import React, { useEffect, useState } from "react";
import {BloombergBridgeClient} from "../../clients/BloombergBridgeClient/BloombergBridgeClient";
// Set up the BloombergBridgeClient that will be used for all messaging to/from Bloomberg
let bbg = new BloombergBridgeClient(FSBL.Clients.RouterClient, FSBL.Clients.Logger);

const title = "Bloomberg Preferences";
const wrapperClasses = "finsemble-toolbar-button";

export const BloombergStatus = () => {
    const errText = "Error Determining Bloomberg Status";
    const [isConnected, setIsConnected] = useState(false);
    const [indicatorColor, setIndicatorColor] = useState("red");

    useEffect(() => {
        function checkConnection() {
            bbg.checkConnection((err, resp) => {
                if (!err && resp === true) {
                    setIsConnected(true);
                    setIndicatorColor("green");
                } else if (err) {
                    FSBL.Clients.Logger.error("Error received when checking connection", err);
                    setIndicatorColor("red");
                    setIsConnected(false);
                } else {
                    FSBL.Clients.Logger.debug("Negative response when checking connection: ", resp);
                    setIsConnected(false);
                    setIndicatorColor("orange");
                }
            });
        };

        try {
            //do the initial check
            checkConnection();
            //listen for connection events (listen/transmit)
            bbg.setConnectionEventListener(checkConnection);
            //its also possible to poll for connection status,
            //  worth doing in case the bridge process is killed off and doesn't get a chance to send an update
            setInterval(checkConnection, 30000);
        } catch (e) {
            FSBL.Clients.Logger.error(`error in bbg prefs: ${e}`);
        }

    }, []);

    const bbgStatusMarker = React.createElement("span", {
        style: {
            background: indicatorColor,
            position: "relative",
            left: "7px",
            width: "15px",
            height: "15px",
            borderRadius: "50%"
        }
    }, " ");

    const bbgStatusButton = React.createElement("div", {
        className: wrapperClasses,
        title: title,
        onClick: () => {
            FSBL.Clients.RouterClient.transmit("FinsembleUserPreferencesChannel", {
                preferencesTab: "Bloomberg Terminal Connect",
            });
            FSBL.Clients.LauncherClient.showWindow(
                {
                    componentType: "UserPreferences",
                },
                {
                    monitor: "mine",
                    left: "center",
                    top: "center",
                }
            );
        }
    }, ["Bloomberg", bbgStatusMarker]);

    return <>{bbgStatusButton}</>;
};
