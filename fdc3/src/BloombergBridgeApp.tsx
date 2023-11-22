/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect } from "react";

type CommandHistoryEntry = {
  command: string;
  tails: string;
  security: string;
  result: string;
}

function BloombergBridgeApp() {
  const [security, setSecurity] = useState("");
  const [groupInfo, setGroupInfo] = useState<Record<number, string>>({});
  const [selectedGroupIds, setSelectedGroupIds] = useState<number[]>([]);
  const [selectedTab, setSelectedTab] = useState(1);

  const [terminalCommand, setTerminalCommand] = useState("");
  const [terminalTails, setTerminalTails] = useState("");
  const [commandHistory, setCommandHistory] = useState<CommandHistoryEntry[]>([]);

  const shouldShowGroupZeroState = Object.keys(groupInfo).length === 0;

  const toggleIds = (id: number) => {
    const selected = new Set(selectedGroupIds);
    if(selected.has(id)){
      selected.delete(id);
    }else{
      selected.add(id);
      maybeGrabGroupContext(id);
    }

    setSelectedGroupIds([...selected]);
  }

  const maybeSetSecurity = (ctx: string, id: number) => {
    if(selectedGroupIds.includes(id)){
      setSecurity(ctx);
      relayContextToFdc3(ctx);
    }
  };

  const maybeGrabGroupContext = (groupId: number) => {
    if(security !== ""){
      return;
    }
    
    FSBL.Clients.BloombergBridgeClient.runGetAllGroups((err, {groups}) => {
      const relevantGroup = groups.find(({id}) => id == groupId);
      if(relevantGroup.value !== security){
        setSecurity(relevantGroup.value);
      }
    });
  };

  const relayContextToBloomberg = (instrument: string) => {
    selectedGroupIds.forEach((groupId) => {
      FSBL.Clients.BloombergBridgeClient.runSetGroupContext(groupInfo[groupId], instrument, "", () => {});
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

  useEffect(() => {
    // Get initial list of groups
    FSBL?.Clients?.BloombergBridgeClient?.runGetAllGroups((err, data) => {
      if(err){
        return;
      }
      const {groups} = data;
      setGroupInfo(
        Object.fromEntries(groups.map(({id, name}) => [id, name]))
      );
    });

    // Add event listeners for changes in the group
    FSBL?.Clients?.BloombergBridgeClient?.setGroupEventListener((err, {data}) => {
      if(err){
        return;
      }
      const {group} = data;

      switch(group.eventType){
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
      const instrument = ctx.id.ticker ?? security;
      relayContextToBloomberg(instrument)
      setSecurity(instrument);
    })
  }, []);


  return (
    <div id="container">
      <div className="search">
        <input type="text" placeholder="Security search box" aria-label="Security" value={security} onChange={(e) => {
          setSecurity(e.target.value);
        }} />
      </div>

      <div className="content">
        <div role="tablist">
          <div role="tab" tabIndex={0} aria-selected={selectedTab === 1} onClick={() => setSelectedTab(1)}>Launchpad</div>
          <div role="tab" tabIndex={0} aria-selected={selectedTab === 2} onClick={() => setSelectedTab(2)}>Terminal</div>
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
                <th>Command</th>
                <th>Tails</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <input value={terminalCommand} disabled={security === ""} aria-label="Command" type="text" size={5} maxLength={5} onChange={(e) => {
                    setTerminalCommand(e.target.value);
                  }}/>
                </td>
                <td>
                  <input value={terminalTails} disabled={security === ""} aria-label="Tails" type="text" onChange={(e) => {
                    setTerminalTails(e.target.value);
                  }} />
                </td>
                <td>
                  <button disabled={terminalCommand === ""} onClick={() => {
                    FSBL.Clients.BloombergBridgeClient.runBBGCommand(
                      terminalCommand,
                      security,
                      terminalTails,
                      "",
                      (err: string | null) => {
                        console.log(1);
                        setCommandHistory([
                          {
                            command: terminalCommand,
                            security,
                            tails: terminalTails,
                            result: err ?? "Sucess"
                          },
                          ...commandHistory
                        ]);
                        console.log(2);
                        setTerminalCommand("");
                        console.log(3);
                        setTerminalTails("");
                        console.log(4);
                      }
                    )
                  }}>Run</button>
                </td>
              </tr>
            </tbody>
          </table>

          {commandHistory.length > 0 && <h2>Recent history</h2>}

          <ul className="history-log">
            {commandHistory.slice(0, 5).map((entry, index) => <li key={index}>
              {entry.security}: <pre>{entry.command} {entry.tails}</pre><br/>
              <b>Result:</b> {entry.result}<br/>
              <button onClick={() => {
                setTerminalCommand(entry.command);
                setTerminalTails(entry.tails);
              }}>Re-use command</button>
            </li>)}
          </ul>
        </div>
      </div>
    </div>
  )
}

export default BloombergBridgeApp
