import React from 'react';
import Autosuggest from 'react-autosuggest';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
// import 'react-tabs/style/react-tabs.css';

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
			commandSuccess: ""
		};

		this.checkConnection = this.checkConnection.bind(this);
		this.setupConnectionLifecycleChecks = this.setupConnectionLifecycleChecks.bind(this);
		this.handleCommandPanelInput = this.handleCommandPanelInput.bind(this);
		this.handleCommandExecute = this.handleCommandExecute.bind(this);
		this.setupConnectionLifecycleChecks();
	}

	checkConnection() {
		FSBL.Clients.BloombergBridgeClient.checkConnection((err, resp) => {
			if (!err && resp === true) {
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
	}

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
				bbg.runBBGCommand(mnemonic, securities, panel, tails, (err, response) => {
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
	}

	render() {
		const { value, suggestions, isLoading, isConnected, commandMnemonic, commandPanel, commandTails, commandError, commandSuccess } = this.state;

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
							<Tab>Launchpad Groups</Tab>
							<Tab>Run Command</Tab>
							<Tab>Worksheets</Tab>
						</TabList>

						<TabPanel>
							<h2>Launchpad</h2>
						</TabPanel>
						<TabPanel>
							<label className="inputLabel">
								{/* Mnemonic: */}
								<input name="commandMnemonic" className="textField" value={this.state.commandMnemonic} size="6" maxLength="6" placeholder="Mnemonic" onChange={this.handleCommandPanelInput}></input>
							</label>

							<label className="inputLabel">
								Tails:&nbsp;
								<input name="commandTails" className="textField" value={this.state.commandTails} size="15" maxLength="255" placeholder="optional..."onChange={this.handleCommandPanelInput}></input>
							</label>

							<label className="inputLabel">
								Panel:&nbsp;
								<select name="commandPanel" className="textField" value={this.state.commandPanel} onChange={this.handleCommandPanelInput}>
									<option value="1">1</option>
									<option value="2">2</option>
									<option value="3">3</option>
									<option value="4">4</option>
								</select>
							</label>

							<button className="button" id="runCommandButton" onClick={this.handleCommandExecute}>execute</button>
							&nbsp;
							<label id="commandError" className="errorLabel">{this.state.commandError}</label>
							<label id="commandSuccess" className="successLabel">{this.state.commandSuccess}</label>


						</TabPanel>
						
						<TabPanel>
							<h2>worksheets</h2>
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