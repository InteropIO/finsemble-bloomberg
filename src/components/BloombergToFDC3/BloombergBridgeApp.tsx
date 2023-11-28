/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */

import React from "react";
import { Rule } from "./components/Rule";
import { RuleForm } from "./components/RuleForm";
import { SecuritySearch } from "./components/SecuritySearch";
import { LINK_PREFERENCES_PATH } from "./common";
import { Listener } from "@finsemble/finsemble-core/dist/lib/typedefs/FDC3/api/Listener";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { FEAGlobals/*, BloombergBridgeClient */ } from "@finsemble/finsemble-core";

const {useState, useEffect, useRef} = React;

function useRefState<T>(
  initialState: T,
): [React.MutableRefObject<T>, React.Dispatch<React.SetStateAction<T>>] {
  const [internalState, setInternalState] = React.useState<T>(initialState);

  const state = useRef<T>(internalState);

  const setState = (newState: React.SetStateAction<T>) => {
    if (newState instanceof Function) {
      state.current = newState(state.current);
      setInternalState(newState);
    } else {
      state.current = newState;
      setInternalState(newState);
    }
  };

  return [state, setState];
}


function BloombergBridgeApp() {
  const [isConnected, setIsConnected] = useState(false);
	const [editLink, setEditLink] = useState(null);
  const [instrument, setInstrument] = useState("");
  const [market, setMarket] = useState("");
  const [bbgSecurityString, setBbgSecurityString] = useState("");
  
  const [selectedTab, setSelectedTab] = useState(1);
  const [showAddEditForm, setShowAddEditForm] = useState(false);
  
  const [groupInfo, setGroupInfo] = useRefState<Record<number, string>>({});
  const [selectedGroupIds, setSelectedGroupIds] = useRefState<number[]>([]);
  const [searchValue, setSearchValue] = useRefState<string>("");

  const [links, setLinks] = useState<any[]>([]);

  let contextListener: Listener | null = null;

  const bbgClient = (FSBL.Clients as any).BloombergBridgeClient;

  /** Handles clicks on the tab headers and stores state in the workspace ensuring
   *  that the component restores with teh same tab selected. */
  const changeTab = (tabName: number) => {
    // Persist to storage
    FSBL.Clients.WindowClient.setComponentState({field: "activeTab", value: tabName})
    setSelectedTab(tabName);
  }

  const shouldShowGroupZeroState = Object.keys(groupInfo.current).length === 0;

  /**
	 * Checks the connection to the BloombergBride and performs setup tasks if we've just connected.
	 */
	const checkConnection = () => {
		bbgClient.checkConnection((err: any, resp: any /*BBGConnectionStatusMessage*/) => {
      if (!err && resp === true) {
        setIsConnected(true);
      } else if (err) {
        FSBL.Clients.Logger.error(
          "Error received when checking connection",
          err
        );
        setIsConnected(false);
      } else {
        FSBL.Clients.Logger.debug(
          "Negative response when checking connection: ",
          resp
        );
        setIsConnected(false);
      }
		});
	};

  /**
   * Setup an event listener and periodic checks on the BloombergBridge connection.
   */
 const setupConnectionLifecycleChecks = () => {
    //listen for connection events (listen/transmit)
    bbgClient.setConnectionEventListener((event: { registered: boolean; enabled: boolean; connectedTo: string } /*BBGConnectionStatusMessage*/) => {
      if (event.registered && event.enabled){
        setIsConnected(true);
        console.log("Connected to Bloomberg", event);
      } else {
        setIsConnected(false);
        console.log("Disconnected from Bloomberg", event);
      }
    });
  };

  const handleConnectionToBloomberg = () => {
    checkConnection();
    setupConnectionLifecycleChecks();
  };

  const splitBbgSecurityString = (bbgSecurityString: string) => {
    const contextParts = bbgSecurityString.split(" ");
    let ticker = contextParts[0];
    let tickerMarket = contextParts[1] ?? null;
    let tickerType = contextParts[2] ?? null;

    if (ticker) { ticker = ticker.trim(); }
    if (tickerMarket) { tickerMarket = tickerMarket.trim(); }
    if (tickerType) { tickerType = tickerType.trim(); }

    return {ticker, market: tickerMarket, type: tickerType};
  }

  const setCurrentSecurity = (bbgSecurityString: string) => {
    setBbgSecurityString(bbgSecurityString);
    const {ticker, market} = splitBbgSecurityString(bbgSecurityString);
    setInstrument(ticker);
    setMarket(market);

    //do not set the search value as this may have come from search
  };

  /** Handles events from the LaunchPad group checkboxes. */
  const toggleIds = (id: number) => {
    console.log(`toggleIds: toggle ${id} in set ${JSON.stringify(selectedGroupIds.current)}`);
    const selected = new Set<number>([...selectedGroupIds.current]);
    if (selected.has(id)) {
      selected.delete(id);
    } else {
      selected.add(id);
      maybeGrabGroupContext(id);
    }

    const newSelectedGroupIds = [...selected];
    console.log(`toggleIds: toggle ${id} new set ${JSON.stringify(newSelectedGroupIds)}`);
    FSBL.Clients.WindowClient.setComponentState({field: "selectedGroupIds", value: newSelectedGroupIds})
    setSelectedGroupIds(newSelectedGroupIds);    
  }

  /** resolves a ticker and market string to Bloomberg Security String by conducting a search 
   *  and taking the first result. */
  const resolveSecurity = async (ticker: string, market: string): Promise<string | null> => {
    const searchString = ticker + " " + market;
    return new Promise((resolve,reject) => {
      bbgClient.runSecurityLookup(
        searchString,
        (err: any, data: any) => {
          if (err) {
            reject (`Error received from runSecurityLookup: search string: ${searchString}, error: ${JSON.stringify(err)}`);
          } else {
            if(data?.results && data?.results.length > 1 && data?.results[0].name) {
              resolve(`${data?.results[0].name} ${data?.results[0].type}`);
            } else {
              resolve(null);
            }
          }
      });
    });
  }

  /** Handles events from LaunchPad groups and search */
  const maybeSetSecurity = (ctx: string, id?: number) => {
    const {ticker, market: tickerMarket} = splitBbgSecurityString(ctx);

    //ignore events that don't provide us with a ticker and market - might be a partial search entry
    if (!!ticker && ticker.length > 1 && !!tickerMarket && tickerMarket.length > 1) {
      //ignore events for non-selected groups and if we are already showing that security (as changes we pushed out are sent back to us)
      if (instrument != ticker || market != tickerMarket){
        if (id && selectedGroupIds.current.includes(id)) {
          console.log(`Setting security '${ctx}' from selected Launchpad group ${id}: ${JSON.stringify(groupInfo.current[id])}`, " Selected Groups: ", selectedGroupIds.current);
          setCurrentSecurity(ctx);
          relayContextToFdc3(ticker, tickerMarket);
          setSearchValue(ctx);
        } else if (!id) {
          console.log(`Setting security '${ctx}' from search`);
          setCurrentSecurity(ctx);
          relayContextToFdc3(ticker, tickerMarket);
          relayContextToBloomberg(ticker, tickerMarket);
        } else {
          console.debug(`ignoring event from unselected Launchpad group ${id}:`, groupInfo.current[id], " Selected Groups: ", selectedGroupIds.current);
        }
      } else {
        console.debug(`ignoring event as it wouldn't change the current ticker (${ticker}) and market (${market})`);
      }
    } else {
      console.debug(`ignoring event as as either the ticker (${ticker}) or market (${tickerMarket}) weren't valid`);
    }
  };

  /** If we don't have a current context, retrieve the current security of the indicated
   *  Launchpad group and use that to set the current security.
   */
  const maybeGrabGroupContext = (groupId: number) => {
    if (instrument !== "") {
      return;
    }

    bbgClient.runGetAllGroups((err, {groups}: { groups }) => {
      if (!err) {
        const relevantGroup = groups.find(({id}) => id == groupId);

        if (relevantGroup?.value && relevantGroup?.value !== instrument) {
          setBbgSecurityString(`${relevantGroup.value} ${relevantGroup.type}`);
          const contextParts = relevantGroup.value.split(" ");
          setInstrument(contextParts[0]);
          setMarket(contextParts[1]);
        }
      }
    });
  };

  /** Sends the indicated ticker and market to the currently selected LaunchPad groups.
   *  The ticker and market are resolved to a Bloomberg security string first.
  */
  const relayContextToBloomberg = (ticker: string, market: string) => {
    //lookup the security first
    resolveSecurity(ticker, market).then((securityString) => {
      if (securityString) {
        setBbgSecurityString(securityString);
        selectedGroupIds.current.forEach((groupId) => {
          bbgClient.runSetGroupContext(groupInfo.current[groupId], securityString, "", () => {
          });
        });
      }
    }).catch((err) => {
      console.warn("Not relaying security to BBG as it couldn't resolve it: ", err);
    });
  }

  /** Sends the indicated ticker and market to the current FDC3 user channel  as an
   *  fdc3.instrument.
  */
  const relayContextToFdc3 = (ticker: string, market: string) => {
    fdc3.broadcast({
      type: "fdc3.instrument",
      id: {
        ticker: ticker,
        BBG: `${ticker}:${market}` 
      },
      market: {
        BBG: market
      }
    } as any);
  }

  /** Handles events from Launchpad groups which are sent on creating, renaming or 
   *  deleting a group, and when the current context (secuity) of each group changes.
   **/
  const groupEventHandler = (err, {data}: { data }) => {
    if (err) {
      console.error("Error on launchpad group event: ", err);
      return;
    }

    console.log("Launchpad group event received: ", data);

    const {group} = data;

    switch (group.eventType) {
      case "VALUE_CHANGED": {
        maybeSetSecurity(group.value, group.id);
        break;
      }
      case "DELETED": {
        const newGroupInfo = groupInfo.current;
        delete newGroupInfo[group.id];
        setGroupInfo(newGroupInfo);
        break;
      }
      case "RENAMED": // Explicit fall-through
      case "CREATED": {
        setGroupInfo({
          ...groupInfo.current,
          [group.id]: group.name
        });
        break;
      }
      default: {
        console.log("Unknown eventType: ", group.eventType);
      }
    }
  };

  /**
   * Retrieves the current set of LaunchPad groups and sets up listener
   * for group events.
   */
  const handleLaunchPadGroups = () => {
    console.log("Retrieving launchpad groups and setting up listener...");
    bbgClient.runGetAllGroups((err, data: { groups }) => {
      if (err) {
        console.error("Error on retrieving launchpad groups: ", err);
        return;
      }
      const {groups} = data;
      const newGroupsInfo = Object.fromEntries(groups.map(({id, name}) => [id, name])); 
      setGroupInfo(newGroupsInfo);
      console.log("Initial set of launchpad groups retrieved: ", newGroupsInfo);

      console.log("Listening for launchpad group events...");
      bbgClient.setGroupEventListener(groupEventHandler);
    });
  };

  /** Handles FDC3 context messages (fdc3.instrument) received from the FDC3 User Channel. */
  const fdc3ContextListener = (ctx) => {
    console.log("Received context broadcast: ", ctx);
    const ticker = ctx?.id?.ticker ?? ctx?.id?.CUSIP ?? ctx?.id?.ISIN ?? instrument;
    const tickerMarket = ctx?.market?.BBG ?? ctx?.market?.COUNTRY_ISOALPHA2 ?? ctx?.market?.MIC ?? "US";
    
    setInstrument(ticker);
    setMarket(tickerMarket);

    relayContextToBloomberg(ticker, tickerMarket);
    setSearchValue(`${ticker} ${market}`.trim());
  };

  /** Sets up the FDC3 User Channel context listener */
  const setupContextListener = async () => {
    console.log("Listening for instruments from FDC3 user channels...")
    contextListener = await fdc3.addContextListener("fdc3.instrument", fdc3ContextListener);
  };

  /** Removes the FDC3 User Channel context listener. */
  const tearDownContextListener = async () => {
    if (contextListener){
      contextListener.unsubscribe();
      contextListener = null;
    } else {
      console.trace("tearDownContextListener: there was no context listener to remove...");
    }
  };

  /** Retrieves teh user preference used as state for the Bloomberg terminal commands
   *  then listens for changes from the user prefences panel or other coopies of the 
   *  app.
   */
  const handleBloombergLinkPreferences = () => {
    console.log("Retrieving Bloomberg link preferences...");
    FSBL.Clients.ConfigClient.get(LINK_PREFERENCES_PATH, updateLinks);
    FSBL.Clients.ConfigClient.addListener( LINK_PREFERENCES_PATH, updateLinks);
  };

  const updateLinks = (err: any, links: any) => {
    if (!err) {
      if (links.value) {
        // get and the listener have different return values
        links = links.value;
      }
      const filteredLinks = links.filter((link: any, index) => {
        link.index = index;
        return link.source.type == "fdc3.intent" && link.target.type == "BloombergCommand" && !link.bidirectional
      })
      console.log("Updating (FDC3 Intent related) links to: ", JSON.stringify(filteredLinks));
      setLinks(filteredLinks);
    }
  };

  /** Retrieves the component state from the workspace and uses it to restore those settings. */
  const retrieveComponentState = () => {
    console.log("Retrieving component state...");
    FSBL.Clients.WindowClient.getComponentState(
      {
        fields: ["activeTab","selectedGroupIds"],
      },
      (err, state) => {
        if (!err) {
          const fetchedTab = state["activeTab"];
          if (fetchedTab) {
            changeTab(fetchedTab)
          }
          const fetchedGroupIds = state["selectedGroupIds"];
          if (fetchedGroupIds) {
            setSelectedGroupIds(fetchedGroupIds);
          }
        }
      },
    );
  };

  const editCommand = (link) => {
    console.log("click");
    setEditLink(link);
    setShowAddEditForm(true)
  };
  
  useEffect(() => {
    //Make the component aware of the status of the bloomerg connection
    handleConnectionToBloomberg();

    // Retrieve configuration for terminal commands and listen for changes
    handleBloombergLinkPreferences();

    //retrieve and restore any saved state in the workspace
    retrieveComponentState();

    // Get initial list of groups and setup event listeners
    handleLaunchPadGroups();

    // Listen for context broadcasts
    setupContextListener();

    return () => {
      //remove listeners added above
      FSBL.Clients.ConfigClient.removeListener(LINK_PREFERENCES_PATH, updateLinks);
      bbgClient.removeGroupEventListener();
      tearDownContextListener();
    };

  }, []);

  return (
    <div id="container">
      {/* <div className="search">
        <input type="text" placeholder="Security search box" aria-label="Security" value={instrument} onChange={(e) => {
          setInstrument(e.target.value);
        }}/>
      </div> */}

      <SecuritySearch isConnected={isConnected} maybeSetSecurity={maybeSetSecurity} searchValue={searchValue} setSearchValue={setSearchValue}/>

      <div className="content">
        <div role="tablist">
          <div role="tab" tabIndex={0} aria-selected={selectedTab === 1} onClick={() => changeTab(1)}>Launchpad</div>
          <div role="tab" tabIndex={0} aria-selected={selectedTab === 2} onClick={() => changeTab(2)}>Terminal</div>
        </div>

        <div role="tabpanel" data-active={selectedTab === 1}>
          Select Launchpad groups to link to:
          <div className="checkbox-container">
            {shouldShowGroupZeroState && <span>No groups found in Launchpad.</span>}
            {Object.entries(groupInfo.current).map(([id, name]) => <label key={id}>
              <input type="checkbox" value={id} checked={selectedGroupIds.current.includes(parseInt(id))} onChange={() => toggleIds(parseInt(id))} />
              {name}
            </label>)}
          </div>
        </div>

        <div role="tabpanel" data-active={selectedTab === 2}>
	{links.length > 0 && <>
          {instrument === "" && <div className="error-warning">Must have a security to run a command.</div>}

          <table role="presentation" className="full-width" id="command-list">
            <thead>
            <tr>
              <th>Command List</th>
            </tr>
            </thead>
            <tbody>
            {links.map((link, index) =>
              <Rule index={index} link={link} bbgSecurity={bbgSecurityString} editFunction={editCommand} key={`rule-${index}`}/>)}
            </tbody>
          </table>
          </>}
          <div className="add-form-container" aria-disabled={!showAddEditForm}>
            <h3>Add/edit terminal command</h3>
            <RuleForm activeLink={editLink} editFunction={setEditLink} hideForm={() => {setShowAddEditForm(false)}}/>
          </div>
          <div className="flex center margin-top-10">
            <div aria-disabled={showAddEditForm}
              className="finsemble__btn add-form-button" title="Add terminal command"
              onClick={() => {setShowAddEditForm(true)}}><span className="btn-label">Add command</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BloombergBridgeApp
