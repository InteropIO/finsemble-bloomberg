/* eslint-disable @typescript-eslint/no-explicit-any */

import {LINK_PREFERENCES_PATH, getDisplayName} from "../common.ts";

const deleteLink = async (index: number) => {
  const response = await FSBL.Clients.ConfigClient.get(LINK_PREFERENCES_PATH);

  if (!response.err) {
    let links = response.data as {}[];
    if (!Array.isArray(links)) {
      links = [];
    }
    links.splice(index);
    
    await FSBL.Clients.ConfigClient.setPreference({
      field: LINK_PREFERENCES_PATH.join("."),
      value: links,
    });
  }
}

export const Rule = ({index, link, bbgSecurity, editFunction}) => {
  const BloombergBridgeClient = (FSBL.Clients as any).BloombergBridgeClient;
  return <tr>
    <td className="flex">
      <span className={`finsemble__btn accent command-btn ${bbgSecurity === "" ? "disabled" : ""}}`} title={getDisplayName(link)}
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
           }}><span className="btn-label">{getDisplayName(link)}</span>
      </span>
      <span
        className="finsemble__btn edit-btn" title="Edit"
        onClick={() => {editFunction(link)}}><i className="ff-adp-edit"></i>
      </span>
      <span
        className="finsemble__btn delete-btn" title="Delete"
        onClick={() => {deleteLink(index)}}><i className="ff-adp-trash-outline"></i>
      </span>
    </td>
  </tr>
}
