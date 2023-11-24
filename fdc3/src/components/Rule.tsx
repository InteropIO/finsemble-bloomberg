/* eslint-disable @typescript-eslint/no-explicit-any */

import {getDisplayName} from "../common.ts";

const BloombergBridgeClient = (FSBL.Clients as any).BloombergBridgeClient;


export const Rule = ({link, security, editFunction}) => {
  return <tr>
    <td>{getDisplayName(link)}</td>
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
    <td>
      <button onClick={() => {editFunction(link)}}>Edit</button>
    </td>
  </tr>
}
