/* eslint-disable react-hooks/exhaustive-deps */

/**
 * Todo:
 * Organise code into logical chunks
 * Add UI for tails
 * Persist Groups to ComponentState
 * Save Rule
 * Edit Rule
 */

import {useState, useEffect} from "react";



const linkPreferencesPath = ["finsemble", "custom", "bloomberg", "links"];

const BloombergBridgeClient = (FSBL.Clients as any).BloombergBridgeClient;

function BloombergBridgeApp() {
  const [editLink, setEditLink] = useState(null);
  const [security, setSecurity] = useState("");
  const [groupInfo, setGroupInfo] = useState<Record<number, string>>({});
  const [selectedGroupIds, setSelectedGroupIds] = useState<number[]>([]);
  const [selectedTab, setSelectedTab] = useState(1);

  const [links, setLinks] = useState<any[]>([]);

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

  const maybeSetSecurity = (ctx: string, id: number) => {
    if (selectedGroupIds.includes(id)) {
      setSecurity(ctx);
      relayContextToFdc3(ctx);
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
      BloombergBridgeClient.runSetGroupContext(groupInfo[groupId], instrument, "", () => {});
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
      console.log(links)
      const filteredLinks = links.filter((link: any, index) => {
        link.index = index;
        return link.source.type == "fdc3.intent" && link.target.type == "BloombergCommand" && !link.bidirectional
      })
      setLinks(filteredLinks);
    }
  };

  useEffect(() => {

    FSBL.Clients.ConfigClient.get(linkPreferencesPath, updateLinks)

    // Get initial list of groups
    BloombergBridgeClient?.runGetAllGroups((err, data: { groups }) => {
      if (err) {
        return;
      }
      const {groups} = data;
      setGroupInfo(
        Object.fromEntries(groups.map(({id, name}) => [id, name]))
      );
    });

    // Add event listeners for changes in the group
    BloombergBridgeClient?.setGroupEventListener((err, {data}: { data }) => {
      if (err) {
        return;
      }
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
    fdc3.addContextListener("fdc3.instrument", (ctx) => {
      console.log("Received context broadcast: ", ctx);
      const instrument = ctx?.id?.ticker ?? security;
      relayContextToBloomberg(instrument)
      setSecurity(instrument);
    })

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
              <th>FDC3 Intent</th>
              <th>Context</th>
              <th>&nbsp;</th>
              <th>Command::Tails</th>
              <th>Panel</th>
            </tr>
            </thead>
            <tbody>
            {links.map((link) =>
              <Rule link={link} security={security}/>)}
            </tbody>
          </table>

          <h3>Add</h3>
          <RuleForm activeLink={editLink} />

        </div>
      </div>
    </div>
  )
}

const Rule = ({link, security}) => {
  return <tr>
    <td></td>
    <td>{link.source.id}</td>
    <td>{link.source.data}</td>
    <td>---&gt;</td>
    <td>{`${link.target.id}::${link.target.args.tails}`}</td>
    <td>{link.target.args.panel ?? 1}</td>
    <td>
      <button disabled={security === ""} onClick={() => {
        BloombergBridgeClient.runBBGCommand(
          link.target.id,
          security,
          link.target.args.tails,
          link.target.args.panel ?? 1
        )
      }}>Run Command
      </button>
    </td>
  </tr>
}

const RuleForm = (activeLink) => {
  const [displayName, setDisplayName] = useState("")
  const [intent, setIntent] = useState("")
  const [command, setCommand] = useState("")
  const [tails, setTails] = useState("")
  const [panel, setPanel] = useState(1)

  const saveLink = () => {
    const value = {
      bidirectional: false,
      displayName,
      source: {
        id: intent,
        data:"fdc3.instrument",
        type:"fdc3.intent"
      },
      target: {
        id: command,
        data:"bbg.security",
        type:"BloombergCommand",
        args: {
          tails,
          panel
        }
      }
    }
  }

  console.log(activeLink)
  return <table role="presentation">
    <tr>
      <th>Display Name</th> <td><input type="text"value={displayName} onChange={(e) => {
        setDisplayName(e.target.value);
    }} /></td>
    </tr>
    <tr>
      <th>FDC3 Intent</th>
      <td><select value={intent} onChange={(e) => {
        setIntent(e.target.value);
      }}>
        <option>Select Intent</option>
        <option value="ViewChart">ViewChart</option>
        <option value="ViewInstrument">ViewInstrument</option>
        <option value="CreateInteraction">CreateInteraction</option>
        <option value="StartCall">StartCall</option>
        <option value="StartChat">StartChat</option>
        <option value="StartEmail">StartEmail</option>
        <option value="ViewAnalysis">ViewAnalysis</option>
        <option value="ViewChat">ViewChat</option>
        <option value="ViewHoldings">ViewHoldings</option>
        <option value="ViewInteractions">ViewInteractions</option>
        <option value="ViewMessages">ViewMessages</option>
        <option value="ViewNews">ViewNews</option>
        <option value="ViewOrders">ViewOrders</option>
        <option value="ViewProfile">ViewProfile</option>
        <option value="ViewQuote">ViewQuote</option>
        <option value="ViewResearch">ViewResearch</option>
      </select>
      </td>
    </tr>
    <tbody>
    <tr>
      <th>Command</th>
      <td>
        <input value={command} aria-label="Command" type="text" size={5} maxLength={5}
         onChange={(e) => {
           setCommand(e.target.value)
         }}/> <strong>Tails</strong> <input value={tails} aria-label="Tails" type="text" onChange={(e) => {
           setTails(e.target.value)
      } }/>
      </td>
    </tr>
    <tr>
      <th>Panel</th>
      <td></td>
    </tr>
    <tr>
      <td>
        <button onClick={saveLink}>Save</button>
      </td>
    </tr>
    </tbody>
  </table>
}

export default BloombergBridgeApp
