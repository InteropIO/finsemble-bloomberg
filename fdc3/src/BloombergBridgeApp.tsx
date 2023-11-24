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
 * Edit Rule - select do not work
 * Make it look decent
 */



function BloombergBridgeApp() {
  const [editLink, setEditLink] = useState(null);
  const [security, setSecurity] = useState("");
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

  /** Handles events from LaunchPad groups */
  const maybeSetSecurity = (ctx: string, id: number) => {
    //remove any Bloomberg market and security type details
    const ticker = ctx.split(" ")[0];

    //ignore events for non-selected groups and if we are already showing that security (as chages we pushed out are sent back to us)
    if (security != ticker && selectedGroupIds.includes(id)) {
      console.log(`handling event from selected group ${id}: ${JSON.stringify(groupInfo[id])}`);
      setSecurity(ticker);
      relayContextToFdc3(ticker);
    } else {
      console.log(`ignoring event from unselected group ${id}: ${JSON.stringify(groupInfo[id])}`);
    }
  };

  const maybeGrabGroupContext = (groupId: number) => {
    if (security !== "") {
      return;
    }

    BloombergBridgeClient.runGetAllGroups((err, {groups}: { groups }) => {
      if (!err) {
        const relevantGroup = groups.find(({id}) => id == groupId);
        if (relevantGroup?.value !== security) {
          setSecurity(relevantGroup?.value);
        }
      }
    });
  };

  const relayContextToBloomberg = (instrument: string) => {
    selectedGroupIds.forEach((groupId) => {
      BloombergBridgeClient.runSetGroupContext(groupInfo[groupId], instrument, "", () => {
      });
    });
  }

  const relayContextToFdc3 = (instrument: string) => {
    fdc3.broadcast({
      type: "fdc3.instrument",
      id: {
        ticker: instrument
      }
    });
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

  async function setupContextListener() {
    console.log("Listening for instruments from FDC3 user channels...")
    contextListener = await fdc3.addContextListener("fdc3.instrument", (ctx) => {
      console.log("Received context broadcast: ", ctx);
      const instrument = ctx?.id?.ticker ?? security;
      relayContextToBloomberg(instrument)
      setSecurity(instrument);
    });
  }

  async function tearDownContextListener() {
    if (contextListener){
      contextListener.unsubscribe();
    }
  }

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
        case "RENAMED":   // Explicit fall-through
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
    FSBL.Clients.ConfigClient.addListener({field: LINK_PREFERENCES_PATH.join(".")}, updateLinks);

    return () => {
      FSBL.Clients.ConfigClient.removeListener({field: LINK_PREFERENCES_PATH.join(".")}, updateLinks);
      tearDownContextListener();
    };


  }, []);

  return (
    <div id="container">
      <div className="search">
        <input type="text" placeholder="Security search box" aria-label="Security" value={security} onChange={(e) => {
          setSecurity(e.target.value);
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
          {security === "" && <div id="error-warning" style={{color: "red", fontWeight: "bold"}}>Must have a security to run a command.</div>}

          <table role="presentation">
            <thead>
            <tr>
              <th>Display Name</th>
              <th></th>
              <th></th>
            </tr>
            </thead>
            <tbody>
            {links.map((link, index) =>
              <Rule link={link} security={security} editFunction={setEditLink} key={`rule-${index}`}/>)}
            </tbody>
          </table>

          <h3>Add</h3>
          <RuleForm activeLink={editLink} editFunction={setEditLink}/>
        </div>
      </div>
    </div>
  )
}



export default BloombergBridgeApp
