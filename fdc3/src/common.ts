export const LINK_PREFERENCES_PATH = ["finsemble", "custom", "bloomberg", "links"];


export const getDisplayName = (link) => {
  console.log(link);
  const tailsPart = link.target.args?.tails ? ` ${link.target.args.tails}` : "";
  const panelPart = link.target.args?.panel ? ` on panel ${link.target.args.panel}` : "";
  return link.displayName ? link.displayName : `Bloomberg: ${link.target.id}${tailsPart}${panelPart}`;
}
