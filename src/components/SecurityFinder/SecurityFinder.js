import React from 'react';
import Autosuggest from 'react-autosuggest';

// Teach Autosuggest how to calculate suggestions for any given input value.
// const getSuggestions = async (value) => {
// 	const inputValue = value.trim().toLowerCase();
// 	const inputLength = inputValue.length;

// 	if (!asyncRunSecurityLookup) {
// 		//Promisify the BBG Bridge client function
// 		//  Expects the client to have been preloaded via config
// 		asyncRunSecurityLookup = util.promisify(FSBL.Clients.BloombergBridgeClient.runSecurityLookup);
// 	}
	
// 	if (inputLength > 1) {
// 		// //Expects the client to have been preloaded via config
// 		// FSBL.Clients.BloombergBridgeClient.runSecurityLookup(inputValue, (err, data) => {
// 		// 	if (err) {
// 		// 		FSBL.Clients.Logger.error(`Error received from runSecurityLookup: search string: ${inputValue}, error: `, err);
// 		// 		showElement("securityLookupError");
// 		// 	} else {
// 		// 		const end = Date.now();
// 		// 		data.results.forEach(result => {
// 		// 			out.push(result.name + " " + result.type);
// 		// 		});
// 		// 	}
// 		// });
		
// 		let output = await asyncRunSecurityLookup(inputValue).then((data) => {
// 			let out = [];
// 			data.results.forEach(result => {
// 				out.push(result.name + " " + result.type);
// 			});
// 			return Promise.resolve(out);
// 		}).catch((err) => { 
// 			FSBL.Clients.Logger.error(`Error received from runSecurityLookup: search string: ${inputValue}, error: `, err);
// 			return Promise.resolve([]);
// 		});
// 		console.log(output);
// 		return output;
// 	} else {
// 		return [];
// 	}
// };

// When suggestion is clicked, Autosuggest needs to populate the input
// based on the clicked suggestion. Teach Autosuggest how to calculate the
// input value for every given suggestion.
const getSuggestionValue = suggestion => suggestion.name + " " + suggestion.type;

// Use your imagination to render suggestions.
const renderSuggestion = suggestion => (
	<div>
		{suggestion.name + " " + suggestion.type}
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
			isLoading: false
		};
	}

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

	render() {
		const { value, suggestions, isLoading } = this.state;

		// Autosuggest will pass through all these props to the input.
		const inputProps = {
			placeholder: 'Enter a security...',
			value,
			onChange: this.onChange
		};
		const status = (isLoading ? "Searching..." : (suggestions.length > 0 ? "Select a result" : "Type to search for securities"));

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
					<div id="controls">
						<button className="control">Push me</button>
						<button className="control">Push me</button>
						<button className="control">Push me</button>
					</div>
					<div id="status">
						<strong>Status:</strong> {status}
					</div>
				</div>
				
			</div>
		);
	}
}

export default SecurityFinder;