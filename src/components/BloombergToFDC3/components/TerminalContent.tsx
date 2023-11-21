import React from "react";

type TerminalContentProps = {
	security:string
}

export const TerminalContent = ({security}:TerminalContentProps) => {

	const onEdit = (rule:any) => {

	}

	const onRun = (rule:any) => {

	}


	const onSave = () => {

	}

	const onDelete = () => {

	}

	return <div>
		<Command name={"My chart command 1"} onEdit={onEdit} onRun={onRun} />
		<Command name={"My chart command 2"} onEdit={onEdit} onRun={onRun} />
		<Command name={"Create trade ticket"} onEdit={onEdit} onRun={onRun} />
		<div className={"edit-container"}>
			<div>Add Terminal Connect command</div>
			<div className={"name-row"}><label><input id={"display-name"} type={"text"} placeholder={"Display name"} /></label></div>
			<div className={"command-row"}><label><input id={"command"} type={"text"} placeholder={"Command entry box"} /></label></div>
			<div className={"args-row"}><label><input id={"args"} type={"text"} placeholder={"command args"} /></label></div>
			<div className={"intent-row"}><select>
				<option>FDC3 intent</option>
				<option></option>
			</select></div>
			<button onClick={onDelete}>Delete</button>
			<button onClick={onSave}>Save</button>
		</div>
	</div>
}

type CommandProps = {
	name:string;
	onEdit:Function
	onRun:Function
}

const Command = ({name,
					 onEdit,
					 onRun

				 }:CommandProps) => {

	const runHandler = () => {
		onRun(name)
	}

	const editHandler = () => {
		onEdit(name)
	}

	return <div>{name} <button onClick={runHandler}>Run</button><button onClick={editHandler}>Edit</button></div>

}