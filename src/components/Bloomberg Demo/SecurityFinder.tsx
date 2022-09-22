import React, { ChangeEvent, FormEvent } from "react";
import Autosuggest, {
  FetchRequestedReasons,
  InputProps,
  SuggestionsFetchRequestedParams,
} from "react-autosuggest";
import { Tab, Tabs, TabList, TabPanel } from "react-tabs";
import Select from "react-select";

/** When a suggestion is clicked, Autosuggest needs to populate the input
 *  field based on the clicked suggestion (such that the search will return
 *  the suggestion as the first result).
 */
const getSuggestionValue = (suggestion: { name: string; type: string }) =>
  suggestion.name + " " + suggestion.type;

/** Render suggestions for display in the suggestions list.
 */
const renderSuggestion = (suggestion: { name: string; type: string }) => (
  <div>{suggestion.name + " <" + suggestion.type + ">"}</div>
);

type SecurityFinderState = {
  value: string;
  suggestions: { name: string; type: string }[];
  isLoading: boolean;
  isConnected: boolean;
  isRemote: boolean;
  commandMnemonic: string;
  commandPanel: number;
  commandTails: string;
  commandError: string;
  commandSuccess: string;
  groupError: string;
  groupSuccess: string;
  launchPadGroup: null | { value: string; label: string };
  launchPadGroups: { value: string; label: string }[];
  linkerError: string;
  linkerSuccess: string;
  suppressLinkerLoops: null | boolean;
  worksheet: null | { value: string; label: string };
  worksheets: { value: string; label: string }[];
  worksheetError: string;
  worksheetSuccess: string;
  finsembleToLaunchpad: boolean;
  launchpadToFinsemble: boolean;
  linkerToLaunchpad: boolean;
};
class SecurityFinder extends React.Component<any, SecurityFinderState> {
  BloombergBridgeClient;

  constructor(props: any) {
    super(props);

    // @ts-ignore - provided by preload
    this.BloombergBridgeClient = FSBL.Clients.BloombergBridgeClient;

    this.state = {
      value: "",
      suggestions: [],
      isLoading: false,
      isConnected: false,
      isRemote: false,
      commandMnemonic: "DES",
      commandPanel: 1,
      commandTails: "",
      commandError: "",
      commandSuccess: "",
      groupError: "",
      groupSuccess: "",
      launchPadGroup: null,
      launchPadGroups: [],
      linkerError: "",
      linkerSuccess: "",
      suppressLinkerLoops: null,
      worksheet: null,
      worksheets: [],
      worksheetError: "",
      worksheetSuccess: "",
      finsembleToLaunchpad: true,
      launchpadToFinsemble: true,
      linkerToLaunchpad: false,
    };

    this.handleTabSelected = this.handleTabSelected.bind(this);

    this.checkConfig = this.checkConfig.bind(this);
    this.checkConnection = this.checkConnection.bind(this);
    this.setupConnectionLifecycleChecks =
      this.setupConnectionLifecycleChecks.bind(this);

    this.handleCommandPanelInput = this.handleCommandPanelInput.bind(this);
    this.handleCommandExecute = this.handleCommandExecute.bind(this);

    this.handleLaunchPadGroupInput = this.handleLaunchPadGroupInput.bind(this);
    this.handleSetGroupContext = this.handleSetGroupContext.bind(this);
    this.getLaunchPadGroups = this.getLaunchPadGroups.bind(this);
    this.setupGroupEventListener = this.setupGroupEventListener.bind(this);
    this.handleNoOptionMessage = this.handleNoOptionMessage.bind(this);

    this.subscribeToContext = this.subscribeToContext.bind(this);
    this.handleContextPublish = this.handleContextPublish.bind(this);

    this.getWorksheets = this.getWorksheets.bind(this);
    this.handleWorksheetInput = this.handleWorksheetInput.bind(this);
    this.handleAddToWorksheet = this.handleAddToWorksheet.bind(this);

    this.handleFinsembleToLaunchpad =
      this.handleFinsembleToLaunchpad.bind(this);
    this.handleLaunchpadToFinsemble =
      this.handleLaunchpadToFinsemble.bind(this);

    this.setupConnectionLifecycleChecks();
    this.subscribeToContext();
  }

  checkConfig() {
    const configHandler = (err: any, remote: any) => {
      if (err) {
        FSBL.Clients.Logger.error(
          "Error received when checking bloomberg bridge config",
          err
        );
      } else {
        const isRemote =
          typeof remote.value == "undefined" ? remote : remote.value;
        console.log("Connection is configured for a remote terminal: ", remote);
        this.setState({
          isRemote: isRemote,
        });
      }
    };
    FSBL.Clients.ConfigClient.getValue(
      { field: "finsemble.custom.bloomberg.remote" },
      configHandler
    );
    FSBL.Clients.ConfigClient.addListener(
      { field: "finsemble.custom.bloomberg.remote" },
      configHandler
    );
  }

  /**
   * Checks the connection to the BloombergBride and performs setup tasks if we've just connected.
   */
  checkConnection() {
    this.BloombergBridgeClient.checkConnection((err: any, resp: any) => {
      if (!err && resp === true) {
        if (!this.state.isConnected) {
          //we are connecting, setup LaunchPad group lsiteners
          this.getLaunchPadGroups();
          this.setupGroupEventListener();
        }

        this.setState({
          isConnected: true,
        });
      } else if (err) {
        FSBL.Clients.Logger.error(
          "Error received when checking connection",
          err
        );
        this.setState({
          isConnected: false,
        });
      } else {
        FSBL.Clients.Logger.debug(
          "Negative response when checking connection: ",
          resp
        );
        this.setState({
          isConnected: false,
        });
      }
    });
  }

  /**
   * Setup an event listener and periodic checks on the BloombergBridge connection.
   */
  setupConnectionLifecycleChecks() {
    //check the bridge config as security search is only supported for local connections
    this.checkConfig();

    //listen for connection events (listen/transmit)
    this.BloombergBridgeClient.setConnectionEventListener(() =>
      this.checkConnection()
    );
    //its also possible to poll for connection status,
    //  worth doing in case the bridge process is killed off and doesn't get a chance to send an update
    setInterval(() => this.checkConnection(), 30000);
    //do the initial check
    this.checkConnection();
  }

  /**
   * Load suggestions of resolved securities based on the text input.
   * @param {*} value Input text to attempt to resolve
   * @param {*} cb Optional callback to run once suggestions are received
   */
  loadSuggestions(value: string, cb?: Function) {
    //could cancel a previous request here

    this.setState({
      isLoading: true,
    });

    const inputValue = value.trim().toLowerCase();
    const inputLength = inputValue.length;

    //Expects the client to have been preloaded via config
    this.BloombergBridgeClient.runSecurityLookup(
      inputValue,
      (err: any, data: any) => {
        if (err) {
          FSBL.Clients.Logger.error(
            `Error received from runSecurityLookup: search string: ${inputValue}, error: `,
            err
          );
          this.setState({
            isLoading: false,
            suggestions: [],
          });
        } else {
          const securities: { name: string; type: string }[] = [];
          data.results.forEach((result: { name: string; type: string }) => {
            securities.push({ name: result.name, type: result.type });
          });
          this.setState({
            isLoading: false,
            suggestions: securities,
          });
        }
        if (cb) {
          cb();
        }
      }
    );
  }

  onChange = (
    event: FormEvent<HTMLElement>,
    params: Autosuggest.ChangeEvent
  ) => {
    this.setState({
      value: params.newValue,
    });
  };

  onSuggestionsFetchRequested = (
    {
      value,
    }: {
      value: string;
      reason: FetchRequestedReasons;
    },
    callback?: Function
  ) => {
    this.loadSuggestions(value, callback);
  };

  /**
   * Autosuggest will call this function every time you need to clear suggestions.
   */
  onSuggestionsClearRequested = () => {
    this.setState({
      suggestions: [],
    });
  };

  /** Handler function for terminal command panel input fields. */
  handleCommandPanelInput(
    event: ChangeEvent<HTMLInputElement> | React.ChangeEvent<HTMLSelectElement>
  ) {
    const name = event.target.name;
    if (name === "commandMnemonic") {
      this.setState({ commandMnemonic: event.target.value });
    } else if (name === "commandTails") {
      this.setState({ commandTails: event.target.value });
    } else if (name === "commandPanel") {
      this.setState({ commandPanel: parseFloat(event.target.value) });
    }
  }

  /**
   * Executes a BloombergTerminal function on a Bloomberg panel.
   */
  handleCommandExecute() {
    if (this.state.isConnected && this.state.value) {
      const mnemonic = this.state.commandMnemonic;
      const securities = [this.state.value];
      const tails = this.state.commandTails;
      const panel = this.state.commandPanel * 1;

      if (!this.state.commandMnemonic) {
        this.setState({
          commandError: "Set a command mnemonic to execute",
          commandSuccess: "",
        });
        console.error(`No command mnemonic set to execute`);
      } else {
        console.log(
          `Executing ${this.state.commandMnemonic} on panel ${this.state.commandPanel} with tails ${this.state.commandTails} and security ${this.state.value}`
        );
        this.BloombergBridgeClient.runBBGCommand(
          mnemonic,
          securities,
          panel,
          tails,
          (err: any, response: any) => {
            if (err) {
              this.setState({
                commandError: `Error: ${JSON.stringify(err)}`,
                commandSuccess: "",
              });
              console.error(`No command mnemonic set to execute`);
            } else {
              this.setState({
                commandError: "",
                commandSuccess: `executed ${mnemonic}`,
              });
            }
          }
        );
      }
    } else if (!this.state.value) {
      console.error(`Unable to run command, no security value set`);
      this.setState({
        commandError: "No security value set, search for a security first",
        commandSuccess: "",
      });
    } else {
      console.error(
        `Unable to run command, not connected to Bloomberg bridge and terminal`
      );
      this.setState({
        commandError: "Not connected to Bloomberg terminal!",
        commandSuccess: "",
      });
    }
  }

  /**
   * Retrieve the current set of LaunchPad groups and selects a group if none are selected.
   */
  getLaunchPadGroups() {
    this.BloombergBridgeClient.runGetAllGroups((err: any, response: any) => {
      if (response && response.groups && Array.isArray(response.groups)) {
        const launchPadGroups: { value: string; label: string }[] = [];
        response.groups.forEach((element: { name: string }) => {
          launchPadGroups.push({ value: element.name, label: element.name });
        });
        const _state: Pick<
          SecurityFinderState,
          "groupError" | "launchPadGroup" | "launchPadGroups"
        > = {
          groupError: "",
          launchPadGroup: null,
          launchPadGroups: launchPadGroups,
        };
        //if no group is selected, select one
        if (
          (!this.state.launchPadGroup || this.state.launchPadGroup === null) &&
          launchPadGroups.length > 0
        ) {
          _state.launchPadGroup = launchPadGroups[0];
        }
        //if the selected group doesn't exist deselect it
        if (this.state.launchPadGroup) {
          let found = false;
          launchPadGroups.forEach((group) => {
            if (group.value === this.state.launchPadGroup?.value) {
              found = true;
            }
          });
          if (!found) {
            _state.launchPadGroup = null;
          }
        }

        this.setState(_state);
      } else if (err) {
        console.error("Error retrieving launchpad groups:", err);
        this.setState({
          groupError: "Error retrieving launchpad groups",
          groupSuccess: "",
          launchPadGroups: [],
        });
      } else {
        console.error("invalid response from runGetAllGroups", response);
        this.setState({
          groupError: "Error retrieving launchpad groups",
          groupSuccess: "",
          launchPadGroups: [],
        });
      }
    });
  }

  /** Setup a listener for all Launchpad group events.
   * Security events will automatically be published as context via Finsemble FDC3 APIs
   * and used to search for securities. Note that the channel for FDC3 channel integration
   * must be selected on the SecurityFinder's via the menu on the titlebar. */
  setupGroupEventListener() {
    this.BloombergBridgeClient.setGroupEventListener((err: any, resp: any) => {
      //push context to Finsemble context FDC3 APIs if its a security
      //Note this reacts to *all* LaunchPad groups as no filter is offered in the UI
      if (this.state.launchpadToFinsemble) {
        let logEntry = "\n";
        let logFn = console.log;

        if (err) {
          logEntry += "Error: " + JSON.stringify(err, null, 2) + "\n---";
          logFn = console.error;
        } else if (resp.data.group && resp.data.group.type == "monitor") {
          logEntry +=
            "Ignoring Monitor event\n" +
            JSON.stringify(resp.data, null, 2) +
            "\n---";
        } else if (resp.data.group && resp.data.group.type == "security") {
          this.setState({
            value: resp.data.group.value,
            suppressLinkerLoops: null,
          });
          logEntry +=
            "Received security " +
            resp.data.group.value +
            " from group: " +
            JSON.stringify(resp.data.group, null, 2) +
            "\n---";
          this.handleContextPublish();
          this.onSuggestionsFetchRequested({
            value: resp.data.group.value,
            reason: "input-changed",
          });
        } else {
          logEntry +=
            "Ignoring unrecognized event:\n" +
            JSON.stringify(resp.data, null, 2) +
            "\n---";
          logFn = console.warn;
        }
        logFn(logEntry);
      }

      //refresh the groups list
      this.getLaunchPadGroups();
    });
  }

  /**
   * Handler for Launchpad group selection on the LaunchPad tab.
   * @param {*} value
   */
  handleLaunchPadGroupInput(value: any) {
    this.setState({ launchPadGroup: value });
  }

  /**
   * Handler for no option available messages on Select boxes. Currently no-op.
   */
  handleNoOptionMessage() {
    // this.setState({ launchPadGroup: "", groupError: "No LaunchPad groups", groupSuccess: "" });

    return <></>;
  }

  /**
   * Sets the context of the currently selected Launchpad group using the current security
   * string value in the security finder. Also used for auto-context sharing when the checkbox
   * if selected on the FDC3 tab.
   */
  handleSetGroupContext() {
    if (this.state.isConnected) {
      //A launchpad group must be selected on the Launchpad tab and there must be a security string value
      if (this.state.launchPadGroup && this.state.value) {
        this.BloombergBridgeClient.runSetGroupContext(
          this.state.launchPadGroup.value,
          this.state.value,
          null,
          (err: any, data: any) => {
            if (err) {
              FSBL.Clients.Logger.error(
                `Error received from runSetGroupContext, group: ${this.state.launchPadGroup?.value}, value: ${this.state.value}, error: `,
                err
              );
              this.setState({
                groupError: `Error: ${JSON.stringify(err)}`,
                groupSuccess: "",
              });
              console.error(`Error when setting LaunchPad group context`, err);
            } else {
              this.setState({
                groupError: "",
                groupSuccess: `Set ${this.state.launchPadGroup?.value} context`,
              });
            }
          }
        );
      } else if (!this.state.value) {
        console.error(
          `Unable to set LaunchPad group context, no security value set`
        );
        this.setState({
          groupError: "No security value set, search for a security first",
          commandSuccess: "",
        });
      } else {
        console.error(
          `Unable to set LaunchPad group context, no LaunchPad group selected`
        );
        this.setState({
          groupError: "No LaunchPad group selected",
          groupSuccess: "",
        });
      }
    } else {
      console.error(
        `Unable to set LaunchPad group context, not connected to Bloomberg bridge and terminal`
      );
      this.setState({
        groupError: "Not connected to Bloomberg terminal!",
        groupSuccess: "",
      });
    }
  }

  /**
   * Subscribe to the Finsemble context API (either Linker or FDC3). When context is received
   * it is used to perform a search and *may* also be used to set the context of the currently
   * selected Launchpad Group on the Launchpad tab.
   */
  subscribeToContext() {
    fdc3.addContextListener((context) => {
      if (context.type === "fdc3.instrument") {
        //setContext(context.id.ticker)
        let data = context.id?.BBG ? context.id.BBG : context.id?.ticker || "";
        this.setState({ value: data, suppressLinkerLoops: null });
        this.onSuggestionsFetchRequested(
          { value: data, reason: "input-changed" },
          () => {
            if (
              this.state.finsembleToLaunchpad &&
              this.state.suggestions &&
              this.state.suggestions[0]
            ) {
              //if we got suggestions back, push the value to the selected launchpad group:
              this.handleSetGroupContext();
            }
          }
        );
      }
    });
  }

  /**
   * Publish the current security value to Finsemble FDC3 context APIs
   */
  handleContextPublish() {
    if (this.state.value) {
      //just publish the first token as a ticker symbol
      let tickerValue = this.state.value;
      if (tickerValue.indexOf(" ") > -1) {
        tickerValue = tickerValue.substring(0, tickerValue.indexOf(" "));
      }
      fdc3.broadcast({
        type: "fdc3.instrument",
        name: this.state.value,
        id: {
          ticker: tickerValue,
          BBG: this.state.value,
        },
      });
    } else if (!this.state.value) {
      console.error(`Unable to publish to linker, no security value set`);
      this.setState({
        linkerError: "No security value set, search for a security first",
        linkerSuccess: "",
      });
    }
  }

  /**
   * Retrieve the current list of worksheets from the terminal.
   */

  getAllWorksheets() {
    this.BloombergBridgeClient.runGetAllWorksheets(
      (err: any, response: any) => {
        if (
          response &&
          response.worksheets &&
          Array.isArray(response.worksheets)
        ) {
          const worksheetsArr: { value: string; label: string }[] =
            response.worksheets.map((element: any) => {
              return { value: element.id, label: element.name };
            });

          let _state: Pick<SecurityFinderState, "worksheet" | "worksheets"> = {
            worksheets: worksheetsArr,
            worksheet: null,
          };
          //if no worksheet is selected, select one
          if (!this.state.worksheet && worksheetsArr.length > 0) {
            _state.worksheet = worksheetsArr[0];
          }

          const currentWorksheet = this.state.worksheet;

          //if the selected worksheet doesn't exist deselect it
          if (currentWorksheet) {
            let found = false;
            worksheetsArr.forEach((aWorksheet) => {
              if (aWorksheet.value === currentWorksheet.value) {
                found = true;
              }
            });
            if (!found) {
              _state.worksheet = null;
            }
          }

          this.setState(_state);
        } else if (err) {
          console.error("Error retrieving worksheets:", err);
          this.setState({
            worksheetError: `Error retrieving worksheets: ${JSON.stringify(
              err
            )}`,
            worksheetSuccess: "",
            worksheets: [],
          });
        } else {
          console.error("invalid response from runGetAllWorksheets", response);
          this.setState({
            worksheetError: "Error retrieving worksheets",
            worksheetSuccess: "",
            worksheets: [],
          });
        }
      }
    );
  }

  getWorksheets() {
    if (this.state.isConnected) {
      this.getAllWorksheets();
    } else {
      console.error(
        `Unable to get worksheets, not connected to Bloomberg bridge and terminal`
      );
      this.setState({
        worksheetError: "Not connected to Bloomberg terminal!",
        worksheetSuccess: "",
      });
    }
  }

  /**
   * Handler function for the worksheet name select menu.
   * @param {*} value
   */
  handleWorksheetInput(value: any) {
    this.setState({ worksheet: value });
  }

  /**
   * Adds the current security value to the selected worksheet
   */
  handleAddToWorksheet() {
    if (this.state.isConnected) {
      if (this.state.worksheet && this.state.value) {
        const worksheetId = this.state.worksheet.value;
        this.BloombergBridgeClient.runGetWorksheet(
          worksheetId,
          (err: any, response: any) => {
            //TODO: support other types of worksheet
            if (
              response &&
              response.worksheet &&
              response.worksheet.id !== "Error" &&
              Array.isArray(response.worksheet.securities)
            ) {
              //replace the securities in the worksheet
              const securities = response.worksheet.securities;
              securities.push(this.state.value);
              this.BloombergBridgeClient.runReplaceWorksheet(
                worksheetId,
                securities,
                (err: any, data: any) => {
                  if (err) {
                    console.error("Error replacing worksheet securities:", err);
                    this.setState({
                      worksheetError: `Error replacing worksheet securities: ${JSON.stringify(
                        err
                      )}`,
                      worksheetSuccess: "",
                    });
                  } else {
                    this.setState({
                      worksheetError: "",
                      worksheetSuccess: "Worksheet updated",
                    });
                  }
                  this.getWorksheets();
                }
              );
            } else if (response.worksheet.id === "Error") {
              //handle non-existent worksheets
              console.error(
                `Error retrieving worksheet: worksheetId: ${worksheetId}, error:`,
                response.worksheet.name
              );
              this.setState({
                worksheetError: `${response.worksheet.name}`,
                worksheetSuccess: "",
              });
              this.getWorksheets();
            } else if (err) {
              console.error(
                `Error retrieving worksheet: worksheetId: ${worksheetId}, error:`,
                err
              );
              this.setState({
                worksheetError: `Error retrieving worksheet: ${JSON.stringify(
                  err
                )}`,
                worksheetSuccess: "",
              });
              this.getWorksheets();
            } else {
              FSBL.Clients.Logger.error(
                `invalid response from runGetWorksheet: worksheetId: ${worksheetId}, response:`,
                response
              );
              this.setState({
                worksheetError: `invalid response from runGetWorksheet`,
                worksheetSuccess: "",
              });
              this.getWorksheets();
            }
          }
        );
      } else if (!this.state.value) {
        console.error(`Unable to dd to worksheet, no security value set`);
        this.setState({
          worksheetError: "No security value set, search for a security first",
          worksheetSuccess: "",
        });
      } else {
        console.error(`Unable to add to worksheet, no worksheet selected`);
        this.setState({
          worksheetError: "No worksheet selected!",
          worksheetSuccess: "",
        });
      }
      this.getWorksheets();
    } else {
      console.error(
        `Unable to add to worksheet, not connected to Bloomberg bridge and terminal`
      );
      this.setState({
        worksheetError: "Not connected to Bloomberg terminal!",
        worksheetSuccess: "",
      });
    }
  }

  /**
   * Handler function for the selection of tabs at the bottom of the component.
   * Triggers retrieval of the lsit of worksheets when the worksheet tab is selected.
   * @param {*} index
   * @param {*} lastIndex
   * @param {*} event
   * @returns
   */
  handleTabSelected(index: number, last: number, event: Event) {
    if (index == 2) {
      //selected worksheets
      this.getWorksheets();
    }
    return true;
  }

  /**
   * Handler function for the Finsemble-to-Launchpad sharing checkbox
   * @param {*} changeEvent
   */
  handleFinsembleToLaunchpad(changeEvent: ChangeEvent<HTMLInputElement>) {
    this.setState((prevState) => {
      return {
        finsembleToLaunchpad: !prevState.linkerToLaunchpad,
      };
    });
  }

  /**
   * Handler function for the Launchpad-to-Finsemble sharing checkbox
   * @param {*} changeEvent
   */
  handleLaunchpadToFinsemble(changeEvent: ChangeEvent<HTMLInputElement>) {
    this.setState((prevState) => {
      return {
        launchpadToFinsemble: !prevState.launchpadToFinsemble,
      };
    });
  }

  render() {
    const {
      value,
      suggestions,
      isLoading,
      isConnected,
      isRemote,
      commandMnemonic,
      commandPanel,
      commandTails,
      commandError,
      commandSuccess,
      launchPadGroup,
      launchPadGroups,
      groupError,
      groupSuccess,
      linkerError,
      linkerSuccess,
      worksheet,
      worksheets,
      worksheetError,
      worksheetSuccess,
      launchpadToFinsemble,
      finsembleToLaunchpad,
    } = this.state;

    // Autosuggest will pass through all these props to the input.
    const inputProps: InputProps<any> = {
      placeholder: "Enter a security...",
      value,
      onChange: (
        event: FormEvent<HTMLElement>,
        params: Autosuggest.ChangeEvent
      ) => this.onChange(event, params),
    };
    /*eslint no-nested-ternary: "off"*/
    const status = isConnected
      ? isLoading
        ? "Searching..."
        : suggestions.length > 0
        ? "Select a result"
        : "Type to search for securities"
      : "Disconnected";

    // Finally, render it!
    return (
      <div id="container">
        <Autosuggest
          id="securitySearch"
          suggestions={suggestions}
          onSuggestionsFetchRequested={(
            params: SuggestionsFetchRequestedParams
          ) => this.onSuggestionsFetchRequested(params)}
          onSuggestionsClearRequested={() => this.onSuggestionsClearRequested()}
          getSuggestionValue={getSuggestionValue}
          renderSuggestion={renderSuggestion}
          alwaysRenderSuggestions={true}
          highlightFirstSuggestion={true}
          inputProps={inputProps}
        />

        <div id="tools" className="flex-dont-grow flex-dont-shrink">
          <Tabs
            onSelect={(index: number, lastIndex: number, event: Event) =>
              this.handleTabSelected(index, lastIndex, event)
            }
          >
            <TabList>
              <Tab>LaunchPad</Tab>
              <Tab>Commands</Tab>
              <Tab>Worksheets</Tab>
              <Tab>Link Context</Tab>
            </TabList>

            <TabPanel>
              <div className="controlsColumn">
                <div className="controlsRow">
                  <label className="inputLabel flex-dont-grow">
                    LaunchPad Group:&nbsp;
                  </label>
                  <Select
                    name="launchPadGroup"
                    options={launchPadGroups}
                    className="react-select-container"
                    classNamePrefix="react-select"
                    defaultValue={launchPadGroup}
                    menuPlacement="auto"
                    noOptionsMessage={() => this.handleNoOptionMessage()}
                    onChange={(e) => this.handleLaunchPadGroupInput(e)}
                  />
                </div>
                <div className="controlsRow justify-flex-start">
                  <button
                    className="button"
                    id="setGroupContextButton"
                    onClick={() => this.handleSetGroupContext()}
                  >
                    set context
                  </button>
                  &nbsp;
                  <label id="groupError" className="errorLabel">
                    {groupError}
                  </label>
                  <label id="groupSuccess" className="successLabel">
                    {groupSuccess}
                  </label>
                </div>
              </div>
            </TabPanel>

            <TabPanel>
              <div className="controlsColumn">
                <div className="controlsRow">
                  <label className="inputLabel flex-dont-grow">
                    {/* Mnemonic: */}
                    <input
                      name="commandMnemonic"
                      className="textField"
                      value={commandMnemonic}
                      size={6}
                      maxLength={6}
                      placeholder="Mnemonic"
                      onChange={(e) => this.handleCommandPanelInput(e)}
                    ></input>
                  </label>
                  <label className="inputLabel flex-dont-grow">
                    Tails:&nbsp;
                  </label>
                  <input
                    name="commandTails"
                    className="textField flex-grow"
                    value={commandTails}
                    size={15}
                    maxLength={255}
                    placeholder="optional..."
                    onChange={(e) => this.handleCommandPanelInput(e)}
                  ></input>

                  <label className="inputLabel flex-dont-grow">
                    Panel:&nbsp;
                    <select
                      name="commandPanel"
                      className="textField"
                      value={commandPanel}
                      onChange={(e) => this.handleCommandPanelInput(e)}
                    >
                      <option value="1">1</option>
                      <option value="2">2</option>
                      <option value="3">3</option>
                      <option value="4">4</option>
                    </select>
                  </label>
                </div>
                <div className="controlsRow justify-flex-start">
                  <button
                    className="button"
                    id="runCommandButton"
                    onClick={() => this.handleCommandExecute()}
                  >
                    execute
                  </button>
                  &nbsp;
                  <label id="commandError" className="errorLabel">
                    {commandError}
                  </label>
                  <label id="commandSuccess" className="successLabel">
                    {commandSuccess}
                  </label>
                </div>
              </div>
            </TabPanel>

            <TabPanel>
              <div className="controlsColumn">
                <div className="controlsRow">
                  <label className="inputLabel flex-dont-grow">
                    Worksheet:&nbsp;
                  </label>
                  <Select
                    name="worksheetName"
                    options={worksheets}
                    className="react-select-container"
                    classNamePrefix="react-select"
                    defaultValue={worksheet}
                    menuPlacement="auto"
                    noOptionsMessage={() => this.handleNoOptionMessage()}
                    onChange={(e) => this.handleWorksheetInput(e)}
                  />
                  <button
                    className="button flex-dont-grow"
                    id="refreshWorksheetsButton"
                    onClick={() => this.getWorksheets()}
                  >
                    refresh
                  </button>
                </div>
                <div className="controlsRow justify-flex-start">
                  <button
                    className="button"
                    id="addToWorksheetButton"
                    onClick={(e) => this.handleAddToWorksheet()}
                  >
                    Add to worksheet
                  </button>
                  &nbsp;
                  <label id="worksheetError" className="errorLabel">
                    {worksheetError}
                  </label>
                  <label id="worksheetSuccess" className="successLabel">
                    {worksheetSuccess}
                  </label>
                </div>
              </div>
            </TabPanel>

            <TabPanel>
              <div className="controlsColumn">
                <div className="controlsRow">
                  <label className="inputLabel">
                    <input
                      type="checkbox"
                      name="linkerToLaunchpadCheckbox"
                      onChange={(e) => {
                        this.handleFinsembleToLaunchpad(e);
                      }}
                      defaultChecked={true}
                      className="form-check-input"
                    />
                    FDC3 context broadcasts &lt;-&gt; selected Launchpad group
                  </label>
                </div>
                <div className="controlsRow">
                  <label className="inputLabel">
                    <input
                      type="checkbox"
                      name="launchpadToLinkerCheckbox"
                      onChange={(e) => {
                        this.handleLaunchpadToFinsemble(e);
                      }}
                      defaultChecked={true}
                      className="form-check-input"
                    />
                    All Launchpad group&apos;s security events &lt;-&gt; FDC3
                  </label>
                </div>
              </div>
            </TabPanel>
          </Tabs>

          <div id="status">
            <strong>Status:</strong> {status}
          </div>
        </div>
      </div>
    );
  }
}

export default SecurityFinder;
