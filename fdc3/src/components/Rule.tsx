/* eslint-disable @typescript-eslint/no-explicit-any */

import {getDisplayName} from "../common.ts";

const BloombergBridgeClient = (FSBL.Clients as any).BloombergBridgeClient;


export const Rule = ({link, security, editFunction}) => {
  return <tr>
    <td>
      <div className={`finsemble__btn accent ${security === "" ? "disabled" : ""}}`} title={getDisplayName(link)}
         onClick={() => {
        BloombergBridgeClient.runBBGCommand(
          link.target.id,
          security,
          link.target.args.tails,
          link.target.args.panel ?? 1
        )
      }}
      ><span className="btn-label">{getDisplayName(link)}</span></div>
    </td>
    <td>
      <div
        className="finsemble__btn" title="Edit"
        onClick={() => {editFunction(link)}}><span className="btn-label">Edit</span></div>
    </td>
  </tr>
}
