import BloombergBridgeClient from "../../clients/BloombergBridgeClient/BloombergBridgeClient";

let UIReady = false;
//Setup the BloombergBridgeClient that will be used for all messaging to/from Bloomberg
let bbg = new BloombergBridgeClient(FSBL.Clients.RouterClient, FSBL.Clients.Logger);

//-----------------------------------------------------------------------------------------
//Ready function that sets up the form
const FSBLReady = () => {
	try {
		setupFormUX();
		UIReady = true;
	} catch (e) {
		FSBL.Clients.Logger.error(e);
	}
}

//-----------------------------------------------------------------------------------------
//functions related to connection status
window.setupConnectionLifecycleChecks = () => { 
	//do the initial check
	checkConnection();
	//listen for connection events (listen/transmit)
	bbg.setConnectionEventListener(checkConnection);
	//its also possible to poll for connection status,
	//  worth doing in case the bridge process is killed off and doesn't get a chance to send an update
	setInterval(checkConnection, 30000);
};

window.checkConnection = () => {
	bbg.checkConnection((err, resp) => { 
		if (!err && resp === true) {
			showConnectedIcon();
		} else if (err) {
			FSBL.Clients.Logger.error("Error received when checking connection", err);
			showDisconnectedIcon();
		} else {
			FSBL.Clients.Logger.debug("Negative response when checking connection: ", resp);
			showDisconnectedIcon();
		}
	});
};

//-----------------------------------------------------------------------------------------
//functions related to runCommand

window.runBBGCommand = () => {
	hideElementsByClass("errorLabel");
	hideElementsByClass("successLabel");

	let mnemonic = getFieldValue("mnemonic");
	let securities = getSecurities("securities");
	let tails = getFieldValue("tails");
	let panel = getFieldValue("panel");
	
	//validate input
	let error = false;
	if (!mnemonic) {
		showElement("mnemonicError");
		error = true;
	}
	//Note many commands are valid with only one security, most can also be run with none
	if (!error) {
		bbg.runBBGCommand(mnemonic, securities, panel, tails, (err, response) => {
			if (err) {
				FSBL.Clients.Logger.error(`Error received from runBBGCommand: mnemonic: ${mnemonic}, securities: ${JSON.stringify(securities)}, panel: ${panel}, tails: ${tails}, error:`, err);
				showElement("commandError");
			} else {
				showElement("commandSuccess");
			}
		});
	}
};



//-----------------------------------------------------------------------------------------
//functions related to worksheets

window.createWorksheet = () => {
	hideElementsByClass("errorLabel");
	hideElementsByClass("successLabel");

	let worksheetName = getFieldValue("worksheetName");
	let securities = getSecurities("worksheetSecurities");

	//validate input
	let error = false;
	if (!worksheetName || worksheetName == "") {
		showElement("worksheetNameError");
		error = true;
	}
	if (!error) {
		bbg.runCreateWorksheet(worksheetName, securities, (err, data) => { 
			if (err) {
				FSBL.Clients.Logger.error(`Error received from runCreateWorksheet: worksheetName: ${worksheetName}, securities: ${JSON.stringify(securities)}, error:`, err);
				showElement("worksheetError");
			} else {
				renderWorksheet(data.worksheet.name, data.worksheet.id, data.worksheet.securities);
				showElement("worksheetCreateSuccess");
			}
			getAllWorksheets();
		});
	}
};

window.getAllWorksheets = () => {
	hideElementsByClass("errorLabel");
	hideElementsByClass("successLabel");

	bbg.runGetAllWorksheets((err, response) => {
		if (response && response.worksheets && Array.isArray(response.worksheets)) {
			//clear the list
			let theList = document.getElementById("allWorksheets");
			while (theList.lastElementChild) {
				theList.removeChild(theList.lastElementChild);
			}
			//render the updated list
			response.worksheets.forEach(element => {
				let li = document.createElement("li");
				li.id = "li_worksheet_" + element.id;
				li.className = "worksheetLi";
				let worksheetLabel = document.createElement("span");
				worksheetLabel.className = "worksheetLabel hover";
				worksheetLabel.textContent = element.name;
				worksheetLabel.onclick = (e) => {
					e.preventDefault();
					loadWorkSheet(element.id);
				};
				li.appendChild(worksheetLabel);

				theList.appendChild(li);
			});
		} else if (err) {
			FSBL.Clients.Logger.error("Error received from runGetAllWorksheets:", err);
			showElement("allWorksheetsError");
		} else {
			FSBL.Clients.Logger.error("invalid response from runGetAllWorksheets", response);
			showElement("allWorksheetsError");
		}
	});
};

window.loadWorkSheet = (worksheetId) => {
	hideElementsByClass("errorLabel");
	hideElementsByClass("successLabel");
	
	bbg.runGetWorksheet(worksheetId, (err, response) => {
		//TODO: support other types of worksheet
		if (response && response.worksheet && Array.isArray(response.worksheet.securities)) {
			renderWorksheet(response.worksheet.name, response.worksheet.id, response.worksheet.securities);
		} else if (err) {
			FSBL.Clients.Logger.error(`Error received from runGetWorksheet: worksheetId: ${worksheetId}, error:`, err);
			showElement("worksheetError");
		} else {
			FSBL.Clients.Logger.error(`invalid response from runGetWorksheet: worksheetId: ${worksheetId}, response:`, response);
			showElement("worksheetError");
		}
	});
};


window.replaceWorksheet = () => {
	hideElementsByClass("errorLabel");
	hideElementsByClass("successLabel");

	let worksheetId = getFieldValue("worksheetId")
	let securities = getSecurities("worksheetSecurities");

	//validate input
	let error = false;
	if (!worksheetId || worksheetId == "") {
		showElement("worksheetIdError");
		error = true;
	}
	if (!error) {
		bbg.runReplaceWorksheet(worksheetId, securities, (err, data) => {
			if (err) {
				FSBL.Clients.Logger.error("Error received from runReplaceWorksheet:", err);
				showElement("worksheetError");
			} else {
				renderWorksheet(data.worksheet.name, data.worksheet.id, data.worksheet.securities);
				showElement("worksheetSaveSuccess");
			}
			getAllWorksheets();
		});
	}
};


//-----------------------------------------------------------------------------------------
//UI functions related to groups

window.getAllGroups = () => {
	hideElementsByClass("errorLabel");
	hideElementsByClass("successLabel");

	bbg.runGetAllGroups((err, response) => {
		if (response && response.groups && Array.isArray(response.groups)) {
			//clear the list
			let theList = document.getElementById("allGroups");
			while (theList.lastElementChild) {
				theList.removeChild(theList.lastElementChild);
			}
			//render the updated list
			response.groups.forEach(element => {
				let li = document.createElement("li");
				li.className = "groupLi";
				li.id = "li_group_" + encodeURI(element.name);
				let groupLabel = document.createElement("span");
				groupLabel.textContent = element.name + " (" + element.type + ")";
				groupLabel.className = " groupLabel hover";
				groupLabel.onclick = (e) => {
					e.preventDefault();
					toggleGroup(li.id, element);
				};
				li.appendChild(groupLabel);

				theList.appendChild(li);
			});
		} else if (err) {
			FSBL.Clients.Logger.error("Error received from runGetAllGroups:", err);
			showElement("allGroupsError");
		} else {
			FSBL.Clients.Logger.error("invalid response from runGetAllGroups", response);
			showElement("allGroupsError");
		}
	});
};

window.toggleGroup = (elementId, group) => {
	let element = document.getElementById(elementId);
	let detailsArr = element.getElementsByClassName("groupDetails");
	if (detailsArr.length > 0) {
		Array.prototype.forEach.call(detailsArr, (deets) => { deets.remove() });
	} else {
		let template = document.querySelector('#groupDetails');
		let details = template.content.cloneNode(true).firstElementChild;
		let nameField = details.children[0].children[0];
		let typeField = details.children[1].children[0];
		let valueField = details.children[2].children[0];
		nameField.value = group.name;
		typeField.value = group.type;
		valueField.value = group.value;

		element.appendChild(details);
	}
}

window.setGroupContext = (detailsElement, sector) => {
	hideElementsByClass("errorLabel");
	hideElementsByClass("successLabel");

	let name = detailsElement.children[0].children[0].value;
	let newValueField = detailsElement.getElementsByClassName("newGroupValue")[0];
	let newValue = newValueField.value;
	if (sector) {
		newValue += " " + sector;
	}

	bbg.runSetGroupContext(name, newValue, null, (err, data) => {
		if (err) {
			FSBL.Clients.Logger.error(`Error received from runSetGroupContext, group: ${name}, value: ${newValue}, error: `, err);
			showElement("setGroupContextError");
		} else {
			showElement("setGroupContextSuccess");
		}

		//Retrieve context and update values 
		refreshGroupContext(detailsElement);
	});

};

window.refreshGroupContext = (detailsElement) => { 
	let nameField = detailsElement.children[0].children[0];
	let typeField = detailsElement.children[1].children[0];
	let valueField = detailsElement.children[2].children[0];

	let groupName = nameField.value;
	//Retrieve context and update values 
	bbg.runGetGroupContext(groupName, (err, data2) => {
		if (err) {
			FSBL.Clients.Logger.error(`Error received from runGetGroupContext: groupName: ${groupName}, error:` , err);
			showElement("getGroupContextError");
		} else {
			nameField.value = data2.group.name;
			typeField.value = data2.group.type;
			valueField.value = data2.group.value;
		}
	});
};

window.setupGroupEventListener = () => {
	bbg.setGroupEventListener((err, resp) => {
		let logElement = document.getElementById("groupEventLog");
		let logEntry = "\n";
		if (err) {
			logEntry += JSON.stringify(err, null, 2) + "\n---";
		} else if (resp.data.group && resp.data.group.type == "monitor") {
			logEntry += "Monitor event:\n" + JSON.stringify(resp.data, null, 2) + "\n---";
		} else {
			logEntry += "Security event:\n" + JSON.stringify(resp.data, null, 2) + "\n---";

			//TODO: update group detail views for the change
			

		}
		//TODO: cap total length of log
		
		logElement.value += logEntry;
		//scroll to bottom
		logElement.scrollTop = logElement.scrollHeight;

	});
};

//-----------------------------------------------------------------------------------------
//functions related to runSecurityLookup

window.runSecurityLookup = () => {
	hideElementsByClass("errorLabel");
	hideElementsByClass("successLabel");

	let security = getFieldValue("securityLookup");
	
	//validate input
	let error = false;
	if (!security || security == "") {
		FSBL.Clients.Logger.error("No security set to lookup");
		showElement("securityLookupDataError");
		error = true;
	}

	if (!error) {
		const start = Date.now();
		bbg.runSecurityLookup(security, (err, data) => {
			if (err) {
				FSBL.Clients.Logger.error(`Error received from runSecurityLookup: search string: ${security}, error: `, err);
				showElement("securityLookupError");
			} else {

				const end = Date.now();
				//render results:
				let results = "";
				data.results.forEach(result => {
					results += "&nbsp;&nbsp;" + result.name + " " + result.type + "<br>";
				});

				let successLabel = document.getElementById("securityLookupSuccess");
				successLabel.innerHTML = "Security Lookup successful, response time: " + (end - start) + " milliseconds<br>"
					+ "results:<br>" + results;
				showElement("securityLookupSuccess");
			}
		});
	}
};

//-----------------------------------------------------------------------------------------
//UI functions related to components

//Not implemented yet


//-----------------------------------------------------------------------------------------
//Util functions for the form UI

// auto-hit add button on enter
const setupFormUX = () => {
	console.log("Setting up form UX");
	clickButtonOnEnter("securityInput", "addSecurityButton");
	clickButtonOnEnter("mnemonic", "runCommandButton");
	clickButtonOnEnter("createWorksheetSecurityInput", "cwAddSecurityButton");
	setupConnectionLifecycleChecks();
	setupGroupEventListener();
};

const displayType = (heading, column) => {
	if (UIReady) {
		// first child of the parent node
		let sibling = heading.parentNode.firstChild;

		// process all siblings of the selected heading 
		while (sibling) {
			if (sibling.nodeType === 1) {
				if (sibling !== heading) {
					sibling.className = "heading";
				}
			}
			sibling = sibling.nextSibling;
		}
		heading.className = "heading active";

		// process all siblings of the selected column
		sibling = column.parentNode.firstChild;
		while (sibling) {
			if (sibling.nodeType === 1) {
				if (sibling !== column) {
					sibling.className = "column hidden";
				}
			}
			sibling = sibling.nextSibling;
		}
		column.className = "column";

	} else {
		console.warn("User clicked on header before UI was ready, ignoring...");
	}
};

window.displayCol = (elementName) => {
	displayType(document.getElementById(elementName + "Heading"), document.getElementById(elementName + "Col"));
	//do any custom functionality for particular cols
	switch (elementName) {
		case "worksheets":
			window.getAllWorksheets();
			break;
		case "groups":
			window.getAllGroups();
		default:
			break;
	}
};

window.showElement = (id) => {
	let element = document.getElementById(id);
	element.classList.remove("hidden");
};

window.hideElement = (id) => {
	let element = document.getElementById(id);
	element.classList.add("hidden");
};

window.hideElementsByClass = (className) => {
	Array.from(document.getElementsByClassName(className)).forEach((el) => {
		el.classList.add("hidden");
	});
}

window.showConnectedIcon = () => {
	document.getElementById("connectedIndicator").classList.remove("hidden");
	document.getElementById("disconnectedIndicator").classList.add("hidden");
}

window.showDisconnectedIcon = () => {
	document.getElementById("connectedIndicator").classList.add("hidden");
	document.getElementById("disconnectedIndicator").classList.remove("hidden");
}

window.clickButtonOnEnter = (fieldId, buttonId) => {
	document.getElementById(fieldId).addEventListener("keyup", function (event) {
		// Number 13 is the "Enter" key on the keyboard
		if (event.keyCode === 13) {
			// Cancel the default action, if needed
			event.preventDefault();
			// Trigger the button element with a click
			document.getElementById(buttonId).click();
		}
	});
}

window.addSecurity = (input, list, sector) => {
	let security = document.getElementById(input).value;
	if (security) {
		hideElement("securityError");
		if (sector) {
			security = security + " " + sector;
		}

		let li = document.createElement("li");
		li.id = "li_security_" + encodeURI(security);
		li.appendChild(document.createTextNode(security));

		let removeButton = document.createElement("button");
		removeButton.className = "removeButton";
		removeButton.textContent = " X ";
		removeButton.onclick = (e) => {
			e.preventDefault();
			window.removeSecurity(security, list);
		};

		li.appendChild(removeButton);

		document.getElementById(list).appendChild(li);
		document.getElementById(input).value = "";
	} else {
		console.warn(`Already added security '${security}', ignoring...`);
	}
};

window.removeSecurity = (security, list) => {
	let element = document.getElementById("li_security_" + encodeURI(security));
	if (element) {
		document.getElementById(list).removeChild(element);
	}
};

window.getSecurities = (list) => {
	let element = document.getElementById(list).firstChild;
	let securitiesArr = [];
	while (element) {
		if (element.nodeType === 1) {

			securitiesArr.push(element.firstChild.textContent);
		}
		element = element.nextSibling;
	}
	return securitiesArr;
};

window.getFieldValue = (fieldId) => {
	let fieldValue = document.getElementById(fieldId).value;
	return fieldValue ? fieldValue.trim() : null;
}

window.renderWorksheet = (worksheetName, id, securities) => {
	//clear the list
	let theList = document.getElementById("worksheetSecurities");
	while (theList.lastElementChild) {
		theList.removeChild(theList.lastElementChild);
	}
	//render the updated list
	securities.forEach(element => {
		let li = document.createElement("li");
		li.id = "li_security_" + encodeURI(element);
		li.appendChild(document.createTextNode(element));

		let removeButton = document.createElement("button");
		removeButton.className = "removeButton";
		removeButton.textContent = " X ";
		removeButton.onclick = (e) => {
			e.preventDefault();
			window.removeSecurity(element, "worksheetSecurities");
		};

		li.appendChild(removeButton);

		theList.appendChild(li);
	});
	document.getElementById("worksheetName").value = worksheetName;
	document.getElementById("worksheetId").value = id;
};

if (window.FSBL && FSBL.addEventListener) {
	FSBL.addEventListener("onReady", FSBLReady)
} else {
	window.addEventListener("FSBLReady", FSBLReady)
}