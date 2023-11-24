/* eslint-disable @typescript-eslint/no-explicit-any */

import {getDisplayName} from "../common.ts";

export const Rule = ({link, bbgSecurity, editFunction}) => {
  const BloombergBridgeClient = (FSBL.Clients as any).BloombergBridgeClient;
  return <tr>
    <td>
      <div className={`finsemble__btn accent ${bbgSecurity === "" ? "disabled" : ""}}`} title={getDisplayName(link)}
           onClick={() => {
             BloombergBridgeClient.runBBGCommand(
               link.target.id,
               [bbgSecurity],
               link.target.args.panel ?? 1,
               link.target.args.tails,
               (err) => {
                 if (err) {
                   console.error("Error on running terminal command: ", err);
                 }
               }
             )
           }}><span className="btn-label">{getDisplayName(link)}</span></div>
    </td>
    <td>
      <div
        className="finsemble__btn" title="Edit"
        onClick={() => {editFunction(link)}}><span className="btn-label">Edit</span></div>
    </td>
  </tr>
}
