import React from 'react';
import Autosuggest from 'react-autosuggest';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import Select from 'react-select'

/** When a suggestion is clicked, Autosuggest needs to populate the input
 *  field based on the clicked suggestion (such that the search will return
 *  the suggestion as the first result). 
 */	
const getSuggestionValue = suggestion => suggestion.name + " " + suggestion.type;

/** Render suggestions for display in the suggestions list.
 */
const renderSuggestion = suggestion => (
	<div>
		{suggestion.name + " <" + suggestion.type + ">"}
	</div>
);

class SecurityFinder extends React.Component {
	constructor() {
		super();

		// Autosuggest is a controlled component.
		// This means that you need to provide an input value
		// and an onChange handler that updates this value (see below).
		// Suggestions also need to be provided to the Autosuggest,
		// and they are initially empty because the Autosuggest is closed.
		this.state = {
			value: '',
			suggestions: [],
			isLoading: false,
			isConnected: false,
			commandMnemonic: "DES",
			commandPanel: "1",
			commandTails: "",
			commandError: "",
			commandSuccess: "",
			groupError: "",
			groupSuccess: "",
			launchPadGroup: "",
			launchPadGroups: []
		};

		this.checkConnection = this.checkConnection.bind(this);
		this.setupConnectionLifecycleChecks = this.setupConnectionLifecycleChecks.bind(this);
		
		this.handleCommandPanelInput = this.handleCommandPanelInput.bind(this);
		this.handleCommandExecute = this.handleCommandExecute.bind(this);

		this.handleLaunchPadGroupInput = this.handleLaunchPadGroupInput.bind(this);
		this.handleSetGroupContext = this.handleSetGroupContext.bind(this);
		this.getLaunchPadGroups = this.getLaunchPadGroups.bind(this);
		this.setupGroupEventListener = this.setupGroupEventListener.bind(this);
		this.handleNoOptionMessage = this.handleNoOptionMessage.bind(this);

		this.setupConnectionLifecycleChecks();
	}

	checkConnection() {
		FSBL.Clients.BloombergBridgeClient.checkConnection((err, resp) => {
			if (!err && resp === true) {
				if (!this.state.isConnected) {
					//we are connecting
					this.getLaunchPadGroups();
					this.setupGroupEventListener();
				}

				this.setState({
					isConnected: true
				});
			} else if (err) {
				FSBL.Clients.Logger.error("Error received when checking connection", err);
				this.setState({
					isConnected: false
				});
			} else {
				FSBL.Clients.Logger.debug("Negative response when checking connection: ", resp);
				this.setState({
					isConnected: false
				});
			}
		});
	};

	setupConnectionLifecycleChecks() {
		//listen for connection events (listen/transmit)
		FSBL.Clients.BloombergBridgeClient.setConnectionEventListener(this.checkConnection);
		//its also possible to poll for connection status,
		//  worth doing in case the bridge process is killed off and doesn't get a chance to send an update
		setInterval(this.checkConnection, 30000);
		//do the initial check
		this.checkConnection();
	};

	loadSuggestions(value) {
		//could cancel a previous request here

		this.setState({
			isLoading: true
		});

		const inputValue = value.trim().toLowerCase();
		const inputLength = inputValue.length;

		//Expects the client to have been preloaded via config
		FSBL.Clients.BloombergBridgeClient.runSecurityLookup(inputValue, (err, data) => {
			if (err) {
				FSBL.Clients.Logger.error(`Error received from runSecurityLookup: search string: ${inputValue}, error: `, err);
				this.setState({
					isLoading: false,
					suggestions: []
				});
			} else {
				let securities = [];
				data.results.forEach(result => {
					securities.push({ name: result.name, type: result.type });
				});
				this.setState({
					isLoading: false,
					suggestions: securities
				});
			}
		});
	}

	onChange = (event, { newValue }) => {
		this.setState({
			value: newValue
		});
	};

	onSuggestionsFetchRequested = ({ value }) => {
		this.loadSuggestions(value);
	};

	// Autosuggest will call this function every time you need to clear suggestions.
	onSuggestionsClearRequested = () => {
		this.setState({
			suggestions: []
		});
	};

	handleCommandPanelInput(event) {
		const name = event.target.name;
		this.setState({ [name]: event.target.value });
	};

	handleCommandExecute() {
		if (this.state.isConnected) {
			const mnemonic = this.state.commandMnemonic;
			const securities = [this.state.value];
			const tails = this.state.commandTails;
			const panel = this.state.commandPanel;

			if (!this.state.commandMnemonic) {
				this.setState({ commandError: "Set a command mnemonic to execute", commandSuccess: "" });
				console.error(`No command mnemonic set to execute`);
			} else {
				console.log(`Executing ${this.state.commandMnemonic} on panel ${this.state.commandPanel} with tails ${this.state.commandTails} and security ${this.state.value}`);
				FSBL.Clients.BloombergBridgeClient.runBBGCommand(mnemonic, securities, panel, tails, (err, response) => {
					if (err) {
						this.setState({ commandError: `Error: ${JSON.stringify(err)}` , commandSuccess: "" });
						console.error(`No command mnemonic set to execute`);
					} else {
						this.setState({ commandError: "", commandSuccess: `executed ${mnemonic}` });
					}
				});
			}
			
		} else {
			console.error(`Unable to run command, not connected to Bloomberg bridge and terminal`);
			this.setState({ commandError: "Not connected to Bloomberg terminal!", commandSuccess: "" });
		}
	};

	getLaunchPadGroups() {
		FSBL.Clients.BloombergBridgeClient.runGetAllGroups((err, response) => {
			if (response && response.groups && Array.isArray(response.groups)) {
				let launchPadGroups = [];
				response.groups.forEach(element => {
					launchPadGroups.push({ value: element.name, label: element.name });
				});
				let _state = { groupError: "", launchPadGroups: launchPadGroups };
				//if no group is selected, select one
				if (!this.state.launchPadGroup && launchPadGroups.length > 0) {
					_state.launchPadGroup = launchPadGroups[0];
				}
				//if the selected group doesn't exist deselect it
				if (this.state.launchPadGroup) {
					let found = false;
					launchPadGroups.forEach((group) => {
						if (group.value === this.state.launchPadGroup.value) {
							found = true;
						}
					});
					if (!found) {
						_state.launchPadGroup = "";
					}
				}

				this.setState(_state);
			} else if (err) {
				console.error("Error retrieving launchpad groups:", err);
				this.setState({ groupError: "Error retrieving launchpad groups", groupSuccess: "", launchPadGroups: [] });
			} else {
				console.error("invalid response from runGetAllGroups", response);
				this.setState({ groupError: "Error retrieving launchpad groups", groupSuccess: "", launchPadGroups: [] });
			}
		});
	};

	setupGroupEventListener() {
		FSBL.Clients.BloombergBridgeClient.setGroupEventListener((err, resp) => {
			//ignore events - just refresh the groups list
			this.getLaunchPadGroups();
		});
	};
	
	handleLaunchPadGroupInput(value) {
		this.setState({ launchPadGroup: value});
	};

	handleNoOptionMessage() {
		// this.setState({ launchPadGroup: "", groupError: "No LaunchPad groups", groupSuccess: "" });
	}

	handleSetGroupContext() {
		if (this.state.isConnected) {
			if (this.state.launchPadGroup) {
				FSBL.Clients.BloombergBridgeClient.runSetGroupContext(this.state.launchPadGroup.value, this.state.value, null, (err, data) => {
					if (err) {
						FSBL.Clients.Logger.error(`Error received from runSetGroupContext, group: ${this.state.launchPadGroup.value}, value: ${this.state.value}, error: `, err);
						this.setState({ groupError: `Error: ${JSON.stringify(err)}`, groupSuccess: "" });
						console.error(`Error when setting LaunchPad group context`, err);
					} else {
						this.setState({ groupError: "", groupSuccess: `Set ${this.state.launchPadGroup.value} context` });
					}
				});
			} else {
				console.error(`Unable to set LaunchPad group context, no LaunchPad group selected`);
				this.setState({ groupError: "No LaunchPad group selected", groupSuccess: "" });
			}
		} else {
			console.error(`Unable to set LaunchPad group context, not connected to Bloomberg bridge and terminal`);
			this.setState({ groupError: "Not connected to Bloomberg terminal!", groupSuccess: "" });
		}
	};

	render() {
		const {
			value, suggestions,
			isLoading, isConnected,
			commandMnemonic, commandPanel, commandTails, commandError, commandSuccess,
			groupError, groupSuccess,
			launchPadGroup, launchPadGroups
		} = this.state;

		// Autosuggest will pass through all these props to the input.
		const inputProps = {
			placeholder: 'Enter a security...',
			value,
			onChange: this.onChange
		};
		const status = (
			isConnected ? (
				isLoading ? "Searching..." : (
					suggestions.length > 0 ? "Select a result" : "Type to search for securities"
				)
			) : "Disconnected"
		);

		// Finally, render it!
		return (
			<div id="container">
				<Autosuggest
					suggestions={suggestions}
					onSuggestionsFetchRequested={this.onSuggestionsFetchRequested}
					onSuggestionsClearRequested={this.onSuggestionsClearRequested}
					getSuggestionValue={getSuggestionValue}
					renderSuggestion={renderSuggestion}
					alwaysRenderSuggestions={false}
					highlightFirstSuggestion={true}
					inputProps={inputProps}
				/>
				
				<div id="tools">
					<Tabs>
						<TabList>
							<Tab>LaunchPad Groups</Tab>
							<Tab>Commands</Tab>
							<Tab>Worksheets</Tab>
							<Tab>Linker</Tab>
						</TabList>

						<TabPanel>
							<div className="controlsColumn">
								<div className="controlsRow">
									<label className="inputLabel flex-dont-grow">
										LaunchPad Group:&nbsp;
									</label>
									<Select
										name="launchPadGroup"
										options={launchPadGroups}
										className='react-select-container'
										classNamePrefix="react-select"
										defaultValue={launchPadGroup}
										menuPlacement='auto'
										noOptionsMessage={this.handleNoOptionMessage}
										onChange={this.handleLaunchPadGroupInput}
									/>
								</div>
								<div className="controlsRow justify-flex-start">
									<button className="button" id="setGroupContextButton" onClick={this.handleSetGroupContext}>set context</button>
									&nbsp;
									<label id="groupError" className="errorLabel">{groupError}</label>
									<label id="groupSuccess" className="successLabel">{groupSuccess}</label>
								</div>
							</div>
							
							
						</TabPanel>

						<TabPanel>
							<label className="inputLabel">
								{/* Mnemonic: */}
								<input name="commandMnemonic" className="textField" value={commandMnemonic} size="6" maxLength="6" placeholder="Mnemonic" onChange={this.handleCommandPanelInput}></input>
							</label>

							<label className="inputLabel">
								Tails:&nbsp;
								<input name="commandTails" className="textField" value={commandTails} size="15" maxLength="255" placeholder="optional..."onChange={this.handleCommandPanelInput}></input>
							</label>

							<label className="inputLabel">
								Panel:&nbsp;
								<select name="commandPanel" className="textField" value={commandPanel} onChange={this.handleCommandPanelInput}>
									<option value="1">1</option>
									<option value="2">2</option>
									<option value="3">3</option>
									<option value="4">4</option>
								</select>
							</label>

							<button className="button" id="runCommandButton" onClick={this.handleCommandExecute}>execute</button>
							&nbsp;
							<label id="commandError" className="errorLabel">{commandError}</label>
							<label id="commandSuccess" className="successLabel">{commandSuccess}</label>


						</TabPanel>
						
						<TabPanel>
							<h2>worksheets</h2>
						</TabPanel>

						<TabPanel>
							<h2>linker</h2>
						</TabPanel>
					</Tabs>


					
					<div id="status">
						<strong>Status:</strong> {status}
					</div>
				</div>
				
			</div>
		);
	}
}

export default SecurityFinder;