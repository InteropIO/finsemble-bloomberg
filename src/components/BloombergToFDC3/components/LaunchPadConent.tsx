import React, {ChangeEventHandler, useEffect} from "react";

type LaunchPadContentProps = {
	security: string;

}
export const LaunchPadContent = ({security}:LaunchPadContentProps) => {

	useEffect(() => {
		// Does this app have componentState see if it does and
		const componentState = false
		if(componentState) {
			linkGroup();
		}
	}, [])

	const changed:ChangeEventHandler = () => {
		// The button has been clicked link or unlink the groups and store it in component state
		linkGroup();
	}

	const linkGroup = () => {

	}

	return <div>
		Select Launchpad groups to link to:
		<div><label><input type="checkbox" id="Group A" onChange={changed} /> Group A</label></div>
		<div><label><input type="checkbox" id="Group B" checked={true}  /> Group B</label></div>
		<div>Note: For this tab, each copy of this app is independent of each other, meaning you can have multiple copies. The state is held in the app.</div>
	</div>
}
