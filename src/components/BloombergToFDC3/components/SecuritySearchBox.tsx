import React, {ChangeEventHandler} from "react";

type SecuritySearchBoxProps = {
	value: string;
	changeFunction: ChangeEventHandler;
}

export const SecuritySearchBox = ({
							   value,
							   changeFunction
						   }:SecuritySearchBoxProps) => {

	return <div><input type="text" value={value} onChange={changeFunction} placeholder="Security search box" /></div>;
}
