/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect } from "react";
import "./App.css";

function App() {
  const [security, setSecurity] = useState("");
  const [groupInfo, setGroupInfo] = useState<Record<number, string>>({});
  const [selectedGroupIds, setSelectedGroupIds] = useState<number[]>([]);
  const [selectedTab, setSelectedTab] = useState(1);

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
    console.log(selectedGroupIds, id, security);
    if(selectedGroupIds.includes(id)){
      setSecurity(ctx);
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

  useEffect(() => {
    // Get initial list of groups
    FSBL.Clients.BloombergBridgeClient.runGetAllGroups((err, {groups}) => {
      setGroupInfo(
        Object.fromEntries(groups.map(({id, name}) => [id, name]))
      );
    });

    // Add event listeners for changes in the group
    FSBL.Clients.BloombergBridgeClient.setGroupEventListener((err, {data}) => {
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
      setSecurity(ctx.id.ticker ?? security);
    })
  }, []);

  useEffect(() => {
    // Send security to Launchpad groups
    selectedGroupIds.forEach((groupId) => {
      FSBL.Clients.BloombergBridgeClient.runSetGroupContext(groupInfo[groupId], security, "", (err, response) => {
        console.log(err, response);
      });
    });

    fdc3.broadcast({
      type: "fdc3.instrument",
      id: {
        ticker: "IBM"
      }
    });
  }, [security]);


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

        </div>
      </div>
    </div>
  )
}

export default App
