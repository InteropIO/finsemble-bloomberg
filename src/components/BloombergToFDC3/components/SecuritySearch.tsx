/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { FormEvent, useState } from "react";
import Autosuggest, {
	FetchRequestedReasons,
	InputProps,
	SuggestionsFetchRequestedParams,
} from "react-autosuggest";

export const SecuritySearch = ({ isConnected, maybeSetSecurity, searchValue, setSearchValue}) => {
	const BloombergBridgeClient = (FSBL.Clients as any).BloombergBridgeClient;

	const [isLoading, setIsLoading] = useState(false);
	const [suggestions, setSuggestions] = useState<{ name: string; type: string }[]>([]);

	/** When a suggestion is clicked, Autosuggest needs to populate the input
	 *  field based on the clicked suggestion (such that the search will return
	 *  the suggestion as the first result).
	 */
	const getSuggestionValue = (suggestion: { name: string; type: string }) =>
		`${suggestion.name} ${suggestion.type ? suggestion.type : ""}`.trim();

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

	const shouldRenderSuggestions = (value: string, reason: string) => {
		//search string must contain a space and be at least 2 characters long (minus any trailing spaces)
		return (!!value && (value.trim().length > 2 || (value.length == 2 && value.indexOf(' ') > -1)));
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
		const trimmedValue = value.trim();
		loadSuggestions(value.trim(), callback);
	};

	/**
	 * Autosuggest will call this function every time you need to clear suggestions.
	 */
	const onSuggestionsClearRequested = () => {
		setSuggestions([]);
	};

	const setAndMaybeShareState = (securityStringToSet: string) => {
		setSearchValue(securityStringToSet);

		//Only set the security and communicate to FDC3 if this actually meets our minimum requirements
		//  to avoid setting while they type 
		if (shouldRenderSuggestions(securityStringToSet, "debounce")) {
			//TODO: actually debounce here, with 500ms threshold
			maybeSetSecurity(securityStringToSet);
		}
	};

	// Autosuggest will pass through all these props to the input.
	const inputProps: InputProps<any> = {
		placeholder: "Enter a security...",
		value: searchValue.current,
		onChange: (
			event: FormEvent<HTMLElement>,
			params: Autosuggest.ChangeEvent
		) => setAndMaybeShareState(params.newValue),
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
			shouldRenderSuggestions={shouldRenderSuggestions}
			//alwaysRenderSuggestions={true}
			highlightFirstSuggestion={true}
			inputProps={inputProps}
		/>
	);
};