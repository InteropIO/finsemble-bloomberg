/* eslint-disable @typescript-eslint/no-explicit-any */

export const getDisplayName = (link) => {
  console.log(link);
  const tailsPart = link.target.args?.tails ? ` ${link.target.args.tails}` : "";
  const panelPart = link.target.args?.panel ? ` on panel ${link.target.args.panel}` : "";
  return link.displayName ? link.displayName : `Bloomberg: ${link.target.id}${tailsPart}${panelPart}`;
}

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
