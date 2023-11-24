/* eslint-disable @typescript-eslint/no-explicit-any */

import {getDisplayName} from "../common.ts";

export const Rule = ({link, bbgSecurity, editFunction}) => {
  const BloombergBridgeClient = (FSBL.Clients as any).BloombergBridgeClient;
  return <tr>
    <td>{getDisplayName(link)}</td>
    <td>
      <button disabled={bbgSecurity === ""} onClick={() => {

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
      }}>Run Command
      </button>
    </td>
    <td>
      <button onClick={() => {editFunction(link)}}>Edit</button>
    </td>
  </tr>
}
