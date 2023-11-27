/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { FormEvent, useState } from "react";
import Autosuggest, {
	FetchRequestedReasons,
	InputProps,
	SuggestionsFetchRequestedParams,
} from "react-autosuggest";

export const SecuritySearch = ({ isConnected, maybeSetSecurity, instrument, market}) => {
	const BloombergBridgeClient = (FSBL.Clients as any).BloombergBridgeClient;

	const [isLoading, setIsLoading] = useState(false);
	const [suggestions, setSuggestions] = useState<{ name: string; type: string }[]>([]);

	/** When a suggestion is clicked, Autosuggest needs to populate the input
	 *  field based on the clicked suggestion (such that the search will return
	 *  the suggestion as the first result).
	 */
	const getSuggestionValue = (suggestion: { name: string; type: string }) =>
		suggestion.name + " " + suggestion.type;

	/** Render suggestions for display in the suggestions list.
	*/
	const renderSuggestion = (suggestion: { name: string; type: string }) => (
		<div>{suggestion.name + " <" + suggestion.type + ">"}</div>
	);

	/**
	 * Load suggestions of resolved securities based on the text input.
	 * @param {*} value Input text to attempt to resolve
	 * @param {*} cb Optional callback to run once suggestions are received
	 */
	const loadSuggestions = (value: string, cb?: () => void) => {
		//could cancel a previous request here
		if (isConnected) {
			setIsLoading(true);

			const inputValue = value.trim().toLowerCase();

			//Expects the client to have been preloaded via config
			BloombergBridgeClient.runSecurityLookup(
				inputValue,
				(err: any, data: any) => {
					const securities: { name: string; type: string }[] = [];
					if (err) {
						FSBL.Clients.Logger.error(
							`Error received from runSecurityLookup: search string: ${inputValue}, error: `,
							err
						);
					} else {
						data.results.forEach((result: { name: string; type: string }) => {
							securities.push({ name: result.name, type: result.type });
						});
					}
					setIsLoading(false);
					setSuggestions(securities);
					if (cb) {
						cb();
					}
				}
			);
		} else {
			setIsLoading(false);
			setSuggestions([{name: "Not connected", type: ""}]);
		}
	};

	const onSuggestionsFetchRequested = (
		{
			value,
		}: {
			value: string;
			reason: FetchRequestedReasons;
		},
		callback?: () => void
	) => {
		loadSuggestions(value, callback);
	};

	/**
	 * Autosuggest will call this function every time you need to clear suggestions.
	 */
	const onSuggestionsClearRequested = () => {
		setSuggestions([]);
	};

	// Autosuggest will pass through all these props to the input.
	const inputProps: InputProps<any> = {
		placeholder: "Enter a security...",
		value: `${instrument} ${market}`,
		onChange: (
			event: FormEvent<HTMLElement>,
			params: Autosuggest.ChangeEvent
		) => maybeSetSecurity(params.newValue),
	};

	// Finally, render it!
	return (
		<Autosuggest
			id="securitySearch"
			suggestions={suggestions}
			onSuggestionsFetchRequested={(
				params: SuggestionsFetchRequestedParams
			) => onSuggestionsFetchRequested(params)}
			onSuggestionsClearRequested={() => onSuggestionsClearRequested()}
			getSuggestionValue={getSuggestionValue}
			renderSuggestion={renderSuggestion}
			alwaysRenderSuggestions={true}
			highlightFirstSuggestion={true}
			inputProps={inputProps}
		/>
	);
};