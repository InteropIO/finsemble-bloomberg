/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */

import {useState, useEffect} from "react";
import {Rule} from "./components/Rule.tsx";
import {RuleForm} from "./components/RuleForm.tsx";
import {LINK_PREFERENCES_PATH} from "./common.ts";
import { Listener } from "@finsemble/finsemble-core/dist/lib/typedefs/FDC3/api/Listener";

/**
 * Todo:
 * Comment and organise code into logical chunks
 * Persist Groups to ComponentState
 * Edit Rule - select does not work
 */



function BloombergBridgeApp() {
  const [editLink, setEditLink] = useState(null);
  const [instrument, setInstrument] = useState("");
  const [market, setMarket] = useState("");
  const [bbgSecurityString, setBbgSecurityString] = useState("");
  const [groupInfo, setGroupInfo] = useState<Record<number, string>>({});
  const [selectedGroupIds, setSelectedGroupIds] = useState<number[]>([]);
  const [selectedTab, setSelectedTab] = useState(1);

  const [links, setLinks] = useState<any[]>([]);
  let contextListener: Listener | null = null;

  const BloombergBridgeClient = (FSBL.Clients as any).BloombergBridgeClient;

  const changeTab = (tabName: number) => {
    // Persist to storage
    FSBL.Clients.WindowClient.setComponentState({field: "activeTab", value: tabName,})
    setSelectedTab(tabName);
  }

  const shouldShowGroupZeroState = Object.keys(groupInfo).length === 0;

  const toggleIds = (id: number) => {
    const selected = new Set(selectedGroupIds);
    if (selected.has(id)) {
      selected.delete(id);
    } else {
      selected.add(id);
      maybeGrabGroupContext(id);
    }

    setSelectedGroupIds([...selected]);
  }

  const resolveSecurity = async (ticker: string, market: string): Promise<string | null> => {
    const searchString = ticker + " " + market;
    return new Promise((resolve,reject) => {
      BloombergBridgeClient.runSecurityLookup(
        searchString,
        (err: any, data: any) => {
          if (err) {
            reject (`Error received from runSecurityLookup: search string: ${searchString}, error: ${JSON.stringify(err)}`);
          } else {
            if(data?.results && data?.results.length > 1 && data?.results[0].name) {
              resolve(data?.results[0].name + " " + data?.results[0].type);
            } else {
              resolve(null);
            }
          }
      });
    });
  }

  /** Handles events from LaunchPad groups */
  const maybeSetSecurity = async (ctx: string, id: number) => {
    const contextParts = ctx.split(" ");
    const ticker = contextParts[0];
    const ticketMarket = contextParts[1];

    //ignore events for non-selected groups and if we are already showing that security (as changes we pushed out are sent back to us)
    if (instrument != ticker || market != ticketMarket){
      if (selectedGroupIds.includes(id)) {
        console.log(`handling event from selected group ${id}: ${JSON.stringify(groupInfo[id])}`);
        setBbgSecurityString(ctx);
        setInstrument(ticker);
        setMarket(ticketMarket);
        relayContextToFdc3(ticker, ticketMarket);
      } else {
        console.log(`ignoring event from unselected group ${id}: ${JSON.stringify(groupInfo[id])}`);
      }
    } else {
      console.log(`ignoring event as it wouldn't change the current ticker (${ticker}) and market (${market})`);
    }
    
  };

  const maybeGrabGroupContext = (groupId: number) => {
    if (instrument !== "") {
      return;
    }

    BloombergBridgeClient.runGetAllGroups((err, {groups}: { groups }) => {
      if (!err) {
        const relevantGroup = groups.find(({id}) => id == groupId);
        if (relevantGroup?.value !== instrument) {
          setInstrument(relevantGroup?.value);
        }
      }
    });
  };

  const relayContextToBloomberg = async (instrument: string, market: string) => {
    //lookup the security first
    try {
      let securityString = await resolveSecurity(instrument, market);
      if (securityString) {
        setBbgSecurityString(securityString);
        selectedGroupIds.forEach((groupId) => {
          BloombergBridgeClient.runSetGroupContext(groupInfo[groupId], securityString, "", () => {
          });
        });
      }
    } catch (err) {
      console.warn("Not relaying security to BBG as it couldn't resolve it: ", err);
    }
  }

  const relayContextToFdc3 = (ticker: string, market: string) => {
    fdc3.broadcast({
      type: "fdc3.instrument",
      id: {
        ticker: ticker
      },
      market: {
        BBG: market
      }
    });
  }

  const fdc3ContextListener = (ctx) => {
    console.log("Received context broadcast: ", ctx);
    const ticker = ctx?.id?.ticker ?? instrument;
    const tickerMarket = ctx?.market?.BBG ?? ctx?.market?.COUNTRY_ISOALPHA2 ?? ctx?.market?.MIC ?? "US";
    setInstrument(ticker);
    setMarket(tickerMarket);
    relayContextToBloomberg(ticker, tickerMarket);
  };

  async function setupContextListener() {
    console.log("Listening for instruments from FDC3 user channels...")
    contextListener = await fdc3.addContextListener("fdc3.instrument", fdc3ContextListener);
  }

  async function tearDownContextListener() {
    if (contextListener){
      contextListener.unsubscribe();
    }
  }

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

  useEffect(() => {
    console.log("Initializing...");
    FSBL.Clients.ConfigClient.get(LINK_PREFERENCES_PATH, updateLinks)

    // Get initial list of groups
    console.log("Retrieving launchpad groups...");
    BloombergBridgeClient.runGetAllGroups((err, data: { groups }) => {
      if (err) {
        console.error("Error on retrieving launchpad groups: ", err);
        return;
      }
      const {groups} = data;
      const newGroupsInfo = Object.fromEntries(groups.map(({id, name}) => [id, name])); 
      setGroupInfo(newGroupsInfo);
      console.log("Initial set of launchpad groups retrieved: ", JSON.stringify(newGroupsInfo, null, 2));
    });

    // Add event listeners for changes in the group
    console.log("Listening for launchpad group events...");
    BloombergBridgeClient.setGroupEventListener((err, {data}: { data }) => {
      if (err) {
        console.error("Error on launchpad group event: ", err);
        return;
      }

      console.log("Launchpad group event received: ", JSON.stringify(data, null, 2));

      const {group} = data;

      switch (group.eventType) {
        case "VALUE_CHANGED": {
          maybeSetSecurity(group.value, group.id);
          break;
        }
        case "DELETED": {
          const newGroupInfo = groupInfo;
          delete newGroupInfo[group.id];
          setGroupInfo(newGroupInfo);
          break;
        }
        case "RENAMED": // Explicit fall-through
        case "CREATED": {
          setGroupInfo({
            ...groupInfo,
            [group.id]: group.name
          });
          break;
        }
        default: {
          console.log("Unknown eventType: ", group.eventType);
        }
      }
    });

    // Listen for context broadcasts
    setupContextListener();

    console.log("Retrieving component state...");
    FSBL.Clients.WindowClient.getComponentState(
      {
        fields: ["activeTab"],
      },
      (err, state) => {
        if (!err) {
          const fetchedTab = state["activeTab"];
          if (fetchedTab) {
            changeTab(fetchedTab)
          }
        }
      },
    );

    console.log("Listening for Bloomberg link preferences...");
    FSBL.Clients.ConfigClient.addListener( LINK_PREFERENCES_PATH, updateLinks);

    return () => {
      FSBL.Clients.ConfigClient.removeListener(LINK_PREFERENCES_PATH, updateLinks);
      tearDownContextListener();
    };


  }, []);

  return (
    <div id="container">
      <div className="search">
        <input type="text" placeholder="Security search box" aria-label="Security" value={instrument} onChange={(e) => {
          setInstrument(e.target.value);
        }}/>
      </div>

      <div className="content">
        <div role="tablist">
          <div role="tab" tabIndex={0} aria-selected={selectedTab === 1} onClick={() => changeTab(1)}>Launchpad</div>
          <div role="tab" tabIndex={0} aria-selected={selectedTab === 2} onClick={() => changeTab(2)}>Terminal</div>
        </div>

        <div role="tabpanel" data-active={selectedTab === 1}>
          Select Launchpad groups to link to:
          <div className="checkbox-container">
            {shouldShowGroupZeroState && <span>No groups found in Launchpad.</span>}
            {Object.entries(groupInfo).map(([id, name]) => <label key={id}>
              <input type="checkbox" value={id} checked={selectedGroupIds.includes(+id)} onChange={() => toggleIds(+id)} />
              {name}
            </label>)}
          </div>
        </div>

        <div role="tabpanel" data-active={selectedTab === 2}>
	{links.length > 0 && <>
          {instrument === "" && <div id="error-warning">Must have a security to run a command.</div>}

          <table role="presentation">
            <thead>
            <tr>
              <th>Command List</th>
              <th></th>
              <th></th>
            </tr>
            </thead>
            <tbody>
            {links.map((link, index) =>
              <Rule link={link} bbgSecurity={bbgSecurityString} editFunction={setEditLink} key={`rule-${index}`}/>)}
            </tbody>
          </table>
          </>}
          <h3>Add</h3>
          <RuleForm activeLink={editLink} editFunction={setEditLink}/>
        </div>
      </div>
    </div>
  )
}



export default BloombergBridgeApp
