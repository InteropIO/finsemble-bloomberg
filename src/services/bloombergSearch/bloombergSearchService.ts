const BloombergBridgeClient = FSBL.Clients.BloombergBridgeClient;
const Logger = FSBL.Clients.Logger;

Logger.start();
Logger.log("BloombergSearch Service starting up");

//Setup the BloombergBridgeClient that will be used for all messaging to/from Bloomberg
const bbg = new BloombergBridgeClient();

/** Flag used to track whether we are currently connected to a Bloomberg terminal.
 * Both the Bloomberg terminal and the BloombergBridge must be runnign for this
 * to be true.
 */
let connectedToBbg = false;

/**
 * Type for search results that will be provided
 */
type BloombergSecuritySearchResults = {
  name: string;
  score: number;
  type: string;
  bbgSecurity: string;
  ticker: string;
  actions: { name: string }[];
  icon: { type: string; path: string };
};

/**
 * SearchProvider that provides Bloomberg Securities as results using
 * Terminal connect and the BLP API. Results clicked on set the state
 * of all LaunchPad groups in Bloomberg.
 *
 * The Search results are only provided if we are connected to the Bloomberg Bridge
 * and the bridge is connected to a running Bloomberg Terminal.
 */
class BloombergSearchService {
  /**
   * Initializes a new instance of the bloombergSearchService class.
   */
  constructor() {
    this.customSearchFunction = this.customSearchFunction.bind(this);
    this.setupConnectionLifecycleChecks =
      this.setupConnectionLifecycleChecks.bind(this);
    this.checkConnection = this.checkConnection.bind(this);
  }

  /**
   * Fired when the service is ready for initialization
   * @param {function} callback
   */
  start(callback: () => void) {
    Logger.log("readyHandler called");
    //BBG lifecycle checks
    this.setupConnectionLifecycleChecks();

    //register search function
    this.customSearchFunction();

    callback();
  }

  async customSearchFunction() {
    Logger.log("Registering search handler");
    SearchClient.register(
      {
        name: "Bloomberg", // The name of the provider
        searchCallback: bloombergSearch, // A function called when a search is initialized
        itemActionCallback: searchResultActionCallback, // (optional) A function that is called when an item action is fired
        // providerActionTitle: "My Provider action title", // (optional) The title of the provider action
        // providerActionCallback: providerActionCallback //(optional) A function that is called when a provider action is fired
      },
      (err: any) => {
        if (err) {
          Logger.error(err);
        } else {
          Logger.log("Registration succeeded");
        }
      }
    );

    /**
     * Perform the search using the Bloomberg Bridge and client
     * @param params query string
     * @param callback
     */
    function bloombergSearch(
      params: { text: string; windowName: string },
      callback: (err: any, results: any) => void
    ) {
      Logger.log("SEARCH PARAMS: ", params);

      // Search is only performed when we are connected to the birdge and the birdge to the terminal
      if (connectedToBbg) {
        // only get the city from the string
        const searchText = params.text;

        bbg.runSecurityLookup(searchText, (err, response) => {
          if (err) {
            Logger.error(`Bloomberg security lookup returned an error: `, err);
            callback(err, null);
          } else {
            const results: BloombergSecuritySearchResults[] = [];

            results.forEach((result) => {
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
      } else {
        Logger.warn(
          "Search not passed to Bloomberg as we are not connected to the terminal"
        );
      }
    }

    function searchResultActionCallback(params: {
      item: { bbgSecurity: string };
      action: { name: string; bbgSecurity: string };
    }) {
      //Push context to the FDC3 Channel we setup a reference to
      Logger.log(`searchResultActionCallback called with params: `, params);
      const { item, action } = params;

      if (connectedToBbg) {
        if (action.name == "LP") {
          bbg.runGetAllGroups((err, response) => {
            if (response && response.groups && Array.isArray(response.groups)) {
              Logger.log(
                `Setting context '${item.bbgSecurity}' on launchpad groups: `,
                response.groups
              );
              //cycle through all launchpad groups
              response.groups.forEach((group) => {
                //TODO: may want to check group.type and only apply to type == security groups
                //Set group's context
                //N.b. this is replying on Bloomberg to resolve the name to a valid Bloomberg security string (e.g. TSLA = TSLA US Equity)
                bbg.runSetGroupContext(
                  group.name,
                  item.bbgSecurity,
                  null,
                  (err, data) => {
                    if (err) {
                      Logger.error(
                        `Error received from runSetGroupContext, group: ${group.name}, value: ${item.bbgSecurity}, error: `,
                        err
                      );
                    }
                  }
                );
              });
            } else if (err) {
              Logger.error("Error received from runGetAllGroups:", err);
            } else {
              Logger.error("invalid response from runGetAllGroups", response);
            }
          });
        } else if (action.name == "DES") {
          bbg.runBBGCommand(
            "DES",
            [item.bbgSecurity],
            1,
            "",
            (err, response) => {
              if (err) {
                Logger.error("DES returned an error", err);
              } else if (!response.status) {
                Logger.error("DES returned a negative status", response);
              }
            }
          );
        } else {
          Logger.error(
            `Unrecognised action selected!, action: ${JSON.stringify(
              action
            )}, item: ${JSON.stringify(item)}`
          );
        }
      } else {
        Logger.warn(
          "Context not shared to Bloomberg as we are not connected to the terminal"
        );
      }
    }
  }

  //-----------------------------------------------------------------------------------------
  // Functions related to Bloomberg connection status
  // Used to enable/disable calls to send context to launchpad automatically
  //-----------------------------------------------------------------------------------------
  setupConnectionLifecycleChecks = () => {
    //do the initial check
    this.checkConnection();
    //listen for connection events (listen/transmit)
    bbg.setConnectionEventListener(this.checkConnection);
    //its also possible to poll for connection status,
    //  worth doing in case the bridge process is killed off and doesn't get a chance to send an update
    setInterval(this.checkConnection, 30000);
  };

  checkConnection = () => {
    bbg.checkConnection((err, resp) => {
      if (!err && resp === true) {
        connectedToBbg = true;
      } else if (err) {
        Logger.warn("Error received when checking connection", err);
        connectedToBbg = false;
      } else {
        Logger.debug("Negative response when checking connection: ", resp);
        connectedToBbg = false;
      }
    });
  };
  //-----------------------------------------------------------------------------------------
}

function onFSBLReady() {
  const serviceInstance = new BloombergSearchService();
  serviceInstance.start(() => {
    FSBL.publishReady();
  });
}

if (window.FSBL && FSBL.addEventListener) {
  FSBL.addEventListener("onReady", onFSBLReady);
} else {
  window.addEventListener("FSBLReady", onFSBLReady);
}
