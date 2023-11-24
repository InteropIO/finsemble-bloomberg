import {useEffect, useState} from "react";
import {LINK_PREFERENCES_PATH} from "../common.ts";


export const RuleForm = ({activeLink, editFunction}) => {
  const [displayName, setDisplayName] = useState("")
  const [intent, setIntent] = useState("")
  const [command, setCommand] = useState("")
  const [tails, setTails] = useState("")
  const [panel, setPanel] = useState("1")


  useEffect(() => {
    if(activeLink) {
      setIntent(activeLink.source.id);
      setCommand(activeLink.target.id)
      setTails(activeLink.target.args.tails)
      setPanel(activeLink.target.args.panel)
      setDisplayName(activeLink.displayName);
    }
  }, [activeLink])

  useEffect(() => {

  }, [intent])


  const saveLink = async () => {
    const value = {
      bidirectional: false,
      displayName,
      source: {
        id: intent,
        data: "fdc3.instrument",
        type: "fdc3.intent"
      },
      target: {
        id: command,
        data: "bbg.security",
        type: "BloombergCommand",
        args: {
          tails,
          panel
        }
      }
    }

    const response = await FSBL.Clients.ConfigClient.get(LINK_PREFERENCES_PATH);

    if (!response.err) {
      let links = response.data;
      if (!Array.isArray(links)) {
        links = [];
      }
      links[activeLink?.index ?? links.length] = value;

      await FSBL.Clients.ConfigClient.setPreference({
        field: LINK_PREFERENCES_PATH.join("."),
        value: links,
      });

      setDisplayName("")
      setIntent("")
      setTails("")
      setCommand("")
      setPanel(1);
      editFunction(null);
    }
  }

  return <table role="presentation">
    <tbody>
    <tr>
      <th>Display Name</th>
      <td><input type="text" value={displayName ?? ""} onChange={(e) => setDisplayName(e.target.value)} /></td>
    </tr>
    <tr>
      <th>FDC3 Intent</th>
      <td><select value={intent} onChange={(e) => setIntent(e.target.value)}>
        <option value="">Select Intent</option>
        <option value="CreateTradeTicket">CreateTradeTicket</option>
        <option value="ViewChart">ViewChart</option>
        <option value="ViewAnalysis">ViewAnalysis</option>
        <option value="ViewHoldings">ViewHoldings</option>
        <option value="ViewInstrument">ViewInstrument</option>
        <option value="ViewNews">ViewNews</option>
        <option value="ViewOptions">ViewOptions</option>
        <option value="ViewOrders">ViewOrders</option>
        <option value="ViewQuote">ViewQuote</option>
        <option value="ViewResearch">ViewResearch</option>
      </select>
      </td>
    </tr>
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
      <td><select value={panel} onChange={(e) => setPanel(e.target.value)}>
        <option>1</option>
        <option value={2}>2</option>
        <option value={3}>3</option>
        <option value={4}>4</option>
      </select></td>
    </tr>
    <tr>
      <td>
        <div
          className="finsemble__btn" title="Edit"
          onClick={saveLink}><span className="btn-label">Save</span></div>
      </td>
    </tr>
    </tbody>
  </table>
}