import React, { useEffect, useState } from "react";
import { LINK_PREFERENCES_PATH } from "../common";


export const RuleForm = ({ activeLink, editFunction, hideForm }) => {
  const [displayName, setDisplayName] = useState("")
  const [intent, setIntent] = useState("")
  const [command, setCommand] = useState("")
  const [tails, setTails] = useState("")
  const [panel, setPanel] = useState("1")
  const [errorString, setErrorString] = useState("");


  useEffect(() => {
    if (activeLink) {
      setIntent(activeLink.source.id);
      setCommand(activeLink.target.id)
      setTails(activeLink.target.args.tails)
      setPanel(activeLink.target.args.panel)
      setDisplayName(activeLink.displayName);
    }
  }, [activeLink])

  const resetForm = () => {
    setDisplayName("")
    setIntent("")
    setTails("")
    setCommand("")
    setPanel("");
    editFunction(null);
    hideForm();
  }

  const saveLink = async () => {
    setErrorString("");
    if (command && command.trimEnd() != ""){
      const value = {
        bidirectional: false,
        displayName,
        source: {
          id: intent,
          data: "fdc3.instrument",
          type: "fdc3.intent"
        },
        target: {
          id: command.toUpperCase(),
          data: "bbg.security",
          type: "BloombergCommand",
          args: {
            tails,
            panel
          }
        }
      };

      resetForm();

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
      }
    } else {
      setErrorString("You must set a terminal command");
    }
  }

  return <div>
    <div className="error-warning" aria-disabled={errorString == ""}>{errorString}</div>
    <table role="presentation" className="full-width">
      <tbody>
        <tr>
          <th>Command</th>
          <td>
            <input value={command} aria-label="Command" type="text" size={5} maxLength={9} placeholder="DES"
              className="mnemonic-input"
              onChange={(e) => {
                setCommand(e.target.value)
            }} />
            <input value={tails} aria-label="Command arguments (Tails)" type="text" size={5} maxLength={64} placeholder="args"
              className="stretchy-input"
              onChange={(e) => {
                setTails(e.target.value)
            }} />
          </td>
        </tr>
        <tr>
          <th>Panel</th>
          <td>  
            <select value={panel} onChange={(e) => setPanel(e.target.value)}>
              <option value={0}>0</option>
              <option value={1}>1</option>
              <option value={2}>2</option>
              <option value={3}>3</option>
              <option value={4}>New tab</option>
            </select>
          </td>
        </tr>
        <tr>
          <th>FDC3 Intent</th>
          <td><select value={intent} className="stretchy-input"
              onChange={(e) => setIntent(e.target.value)}>
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
          <th>Display Name</th>
          <td>
            <input type="text" value={displayName} size={5} maxLength={64} placeholder="optional"
              className="stretchy-input"
              onChange={(e) => setDisplayName(e.target.value)} />
          </td>
        </tr>
        <tr>
          <th>&nbsp;</th>
          <td className="buttons-cell">
            <div
                className="finsemble__btn accent" title="Save" role="button"
                onClick={saveLink}><span className="btn-label">Save</span>
            </div>
            <div
                className="finsemble__btn" title="Cancel" role="button"
                onClick={resetForm}><span className="btn-label">Cancel</span>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
  
}