"use strict";

const components = require("../../utils/application-components");

function addToComponentsJson() {
	let componentsData = components.loadData_appd();

	componentsData.appd["Bloomberg Test"] = require("./appd.json");

	components.saveData_appd(componentsData);
}

function register() {
	addToComponentsJson();
	console.log("Added testBloomberg into AppD config.");
}

module.exports = { register };
