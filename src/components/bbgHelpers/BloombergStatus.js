import React, { useEffect, useState } from "react";
import { ToolbarSection } from "@finsemble/finsemble-ui/react/components/toolbar";
import {BloombergBridgeClient} from "../../clients/BloombergBridgeClient/BloombergBridgeClient";
// Set up the BloombergBridgeClient that will be used for all messaging to/from Bloomberg
let bbg = new BloombergBridgeClient(FSBL.Clients.RouterClient, FSBL.Clients.Logger);

const title = "Bloomberg Preferences";
const wrapperClasses = "finsemble-toolbar-button";

export const BloombergStatus = () => {
    const [isConnected, setIsConnected] = useState(false);
    const [indicatorColor, setIndicatorColor] = useState("red");
    const [showBloomberg, setShowBloomberg] = useState(false);

    const bbgStatusMarker = React.createElement("span", {
        style: {
            background: indicatorColor,
            position: "relative",
            left: "7px",
            width: "15px",
            height: "15px",
            margin: "5px",
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

    const bbgStatus = <ToolbarSection className="right">
        <div className="divider"></div>
        <div>{bbgStatusButton}</div>
    </ToolbarSection>;

    useEffect(() => {
        function checkConnection() {
            bbg.checkConnection((err, resp) => {
                if (!err && resp === true) {
                    // connected
                    setIndicatorColor("green");
                } else if (err) {
                    FSBL.Clients.Logger.debug("Error received when checking connection", err);
                    // not connected
                    setIndicatorColor("red");
                } else {
                    FSBL.Clients.Logger.debug("Negative response when checking connection: ", resp);
                    // not connected
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
            FSBL.Clients.Logger.debug(`Error in bbg prefs: ${e}`);
        }
    }, []);

    useEffect(() => {
        async function fetchBloomberg() {
            FSBL.Clients.ConfigClient.getValue('finsemble.custom.bloomberg.showStatus', (err, value) => {
                if (err) {
                    FSBL.Clients.Logger.debug(`Could not determine Bloomberg show status: ${err}`);
                    setShowBloomberg(false);
                } else if (value) {
                    setShowBloomberg(true);
                }
                else {
                    setShowBloomberg(false);
                }
            });
        }
        fetchBloomberg();
        let statusHandler = (err, status) => {
            if (err) {
                FSBL.Clients.Logger.debug("Error received when checking bloomberg bridge config", err);
            } else {
                let bbgStatus = typeof status.value == "undefined" ? status : status.value;
                setShowBloomberg(bbgStatus);
            }
        };
        FSBL.Clients.ConfigClient.getValue({ field: "finsemble.custom.bloomberg.showStatus" }, statusHandler);
        FSBL.Clients.ConfigClient.addListener({ field: "finsemble.custom.bloomberg.showStatus" }, statusHandler);
    }, []);



    return (showBloomberg ? bbgStatus : <></>);
};
