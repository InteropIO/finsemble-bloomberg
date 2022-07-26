"use strict";
const BloombergBridgeClient = FSBL.Clients.BloombergBridgeClient;
const Logger = FSBL.Clients.LoggerClient;
Logger.start();
Logger.log("BloombergSearch Service starting up");
const bbg = new BloombergBridgeClient();
let connectedToBbg = false;
class BloombergSearchService {
    constructor() {
        this.setupConnectionLifecycleChecks = () => {
            this.checkConnection();
            bbg.setConnectionEventListener(this.checkConnection);
            setInterval(this.checkConnection, 30000);
        };
        this.checkConnection = () => {
            bbg.checkConnection((err, resp) => {
                if (!err && resp === true) {
                    connectedToBbg = true;
                }
                else if (err) {
                    Logger.warn("Error received when checking connection", err);
                    connectedToBbg = false;
                }
                else {
                    Logger.debug("Negative response when checking connection: ", resp);
                    connectedToBbg = false;
                }
            });
        };
        this.customSearchFunction = this.customSearchFunction.bind(this);
        this.setupConnectionLifecycleChecks =
            this.setupConnectionLifecycleChecks.bind(this);
        this.checkConnection = this.checkConnection.bind(this);
    }
    start(callback) {
        Logger.log("readyHandler called");
        this.setupConnectionLifecycleChecks();
        this.customSearchFunction();
        callback();
    }
    async customSearchFunction() {
        Logger.log("Registering search handler");
        SearchClient.register({
            name: "Bloomberg",
            searchCallback: bloombergSearch,
            itemActionCallback: searchResultActionCallback,
        }, (err) => {
            if (err) {
                Logger.error(err);
            }
            else {
                Logger.log("Registration succeeded");
            }
        });
        function bloombergSearch(params, callback) {
            Logger.log("SEARCH PARAMS: ", params);
            if (connectedToBbg) {
                const searchText = params.text;
                bbg.runSecurityLookup(searchText, (err, response) => {
                    if (err) {
                        Logger.error(`Bloomberg security lookup returned an error: `, err);
                        callback(err, null);
                    }
                    else {
                        let results = [];
                        response.results.forEach((result) => {
                            results.push({
                                name: `${result.name} ${result.type}`,
                                score: 100,
                                type: result.type,
                                bbgSecurity: `${result.name} ${result.type}`,
                                ticker: result.name.substring(0, result.name.indexOf(" ")),
                                actions: [{ name: "LP" }, { name: "DES" }],
                                icon: {
                                    type: "fonticon",
                                    path: "ff-company",
                                },
                            });
                        });
                        callback(null, results);
                    }
                });
            }
            else {
                Logger.warn("Search not passed to Bloomberg as we are not connected to the terminal");
            }
        }
        function searchResultActionCallback(params) {
            Logger.log(`searchResultActionCallback called with params: `, params);
            const { item, action } = params;
            if (connectedToBbg) {
                if (action.name == "LP") {
                    bbg.runGetAllGroups((err, response) => {
                        if (response && response.groups && Array.isArray(response.groups)) {
                            Logger.log(`Setting context '${item.bbgSecurity}' on launchpad groups: `, response.groups);
                            response.groups.forEach((group) => {
                                bbg.runSetGroupContext(group.name, item.bbgSecurity, null, (err, data) => {
                                    if (err) {
                                        Logger.error(`Error received from runSetGroupContext, group: ${group.name}, value: ${item.bbgSecurity}, error: `, err);
                                    }
                                });
                            });
                        }
                        else if (err) {
                            Logger.error("Error received from runGetAllGroups:", err);
                        }
                        else {
                            Logger.error("invalid response from runGetAllGroups", response);
                        }
                    });
                }
                else if (action.name == "DES") {
                    bbg.runBBGCommand("DES", [item.bbgSecurity], 1, "", (err, response) => {
                        if (err) {
                            Logger.error("DES returned an error", err);
                        }
                        else if (!response.status) {
                            Logger.error("DES returned a negative status", response);
                        }
                    });
                }
                else {
                    Logger.error(`Unrecognised action selected!, action: ${JSON.stringify(action)}, item: ${JSON.stringify(item)}`);
                }
            }
            else {
                Logger.warn("Context not shared to Bloomberg as we are not connected to the terminal");
            }
        }
    }
}
const FSBLReady = () => {
    const serviceInstance = new BloombergSearchService();
    serviceInstance.start(() => {
        FSBL.publishReady();
    });
};
if (window.FSBL && FSBL.addEventListener) {
    FSBL.addEventListener("onReady", FSBLReady);
}
else {
    window.addEventListener("FSBLReady", FSBLReady);
}
//# sourceMappingURL=bloombergSearchService.js.map