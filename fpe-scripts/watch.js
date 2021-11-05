const chokidar = require('chokidar');
const path = require("path");
const { copy, mkdirp, access, constants, readJson, writeJson, remove } = require("fs-extra");

const configJSON = require("../finsemble.config.json")


const SRC_FOLDER = "src";
const HOSTED_FOLDER = "public/hosted";
const FINSEMBLE_CONFIG = "finsemble.config.json";
const FINSEMBLE_MANIFEST = "finsemble.manifest.json";
const FINSEMBLE_PRELOADS_BUILD_CONFIG = "finsemble.webpack.preloads.entries.json";

const seedDirectory = path.join(configJSON.seedProjectDirectory);

access(seedDirectory, constants.F_OK | constants.W_OK, (err) => {
	if (err) {
		console.error(
			`${seedDirectory} ${err.code === 'ENOENT' ? 'does not exist' : 'is read-only'}`);
	} else {
		beginWatch(seedDirectory);
	}
});

function beginWatch(seedDirectory) {
	// Initialize watcher.
	const watcher = chokidar.watch([SRC_FOLDER, HOSTED_FOLDER, FINSEMBLE_CONFIG, FINSEMBLE_MANIFEST, FINSEMBLE_PRELOADS_BUILD_CONFIG], {
		ignored: /(^|[\/\\])\../, // ignore dotfiles
		persistent: true
	});

	// Add event listeners.
	watcher
		.on('add', path => updateSeed('add', path, `File ${path} has been added`, seedDirectory))
		.on('change', path => updateSeed('add', path, `File ${path} has been changed`, seedDirectory))
		.on('unlink', path => updateSeed('add', path, `File ${path} has been removed`, seedDirectory))
		.on('addDir', path => updateSeed('addDir', path, `Directory ${path} has been added`, seedDirectory))
		.on('unlinkDir', path => updateSeed('unlinkDir', path, `Directory ${path} has been removed`, seedDirectory))
		.on('error', error => console.log(`Watcher error: ${error}`, seedDirectory))
		.on('ready', () => ready(seedDirectory));
}


function updateSeed(action, currentPath, message, seedDirectory) {
	const destDir = `${seedDirectory}`;
	const destinationPath = path.join(destDir, currentPath);

	if (currentPath === FINSEMBLE_CONFIG) {
		try {
			updateConfig(seedDirectory, currentPath);
		} catch (error) {
			console.error(`could not update the config due to: ${error}`);
		}
		return
	}

	if (currentPath === FINSEMBLE_MANIFEST) {
		try {
			updateManifestLocal(seedDirectory, currentPath);
		} catch (error) {
			console.error(`could not update the config due to: ${error}`);
		}
		return
	}

	if (currentPath === FINSEMBLE_PRELOADS_BUILD_CONFIG) {
		try {
			updatePreloadsBuildConfig(seedDirectory, currentPath);
		} catch (error) {
			console.error(`could not update the config due to: ${error}`);
		}
		return
	}

	if (action === "addDir") {
		mkdirp(destinationPath)
	}

	if (action === "change" || action === "add") {
		copy(currentPath, destinationPath)
			.then(() => console.log(message))
			.catch(err => console.error(`could not change or add file or folder: ${err}`))
		return
	}

	if (action === "remove" || action === "unlinkDir") {
		remove(destinationPath)
			.then(() => console.log(message))
			.catch(err => console.error(`could not remove file or folder: ${err}`))
		return
	}
}

function ready(seedDirectory) {
	console.log(`
  ✔ Seed Project Folder Found at ${seedDirectory}

  ---Begin watching---
  Ready for changes`)
}

async function updateManifestLocal(seedDirectory, currentFile) {
	console.log("Updating manifest file");
    const seedManifestPath = path.join(seedDirectory, 'public/configs/application/manifest-local.json');
	try {
		const seedManifest = await readJson(seedManifestPath);
		const projectManifest = await readJson(currentFile);

		const seedAppAssets = seedManifest.appAssets;
		const projectAppAssets = projectManifest.appAssets;
		const newAppAssets = [...projectAppAssets];
		const projectAliases = {};
		projectAppAssets.forEach(projectElement => { projectAliases[projectElement.alias] = true; });

		//process seed app assets and remove any overlapping ones
		seedAppAssets.forEach(element => {
			let skip = false;
			if (!projectAliases[element.alias]) {
				newAppAssets.push(element);
			}
		});

		seedManifest.appAssets = newAppAssets;

		//add the variable for the bloomberg bridge path (for development)
		if (!seedManifest.finsemble.custom) { seedManifest.finsemble.custom = {};}
		seedManifest.finsemble.custom.bloombergBridgeFolder = projectManifest.finsemble.custom.bloombergBridgeFolder;
		seedManifest.finsemble.custom.bloomberg = projectManifest.finsemble.custom.bloomberg;

		const output = await writeJson(seedManifestPath, seedManifest, { spaces: 4 });
		if (output) console.log('success writing manifest');
	} catch (error) {
		console.error(error);
	}
}

async function updateConfig(seedDirectory, currentFile) {
	console.log("Updating config.json file");
    const seedConfigPath = path.join(seedDirectory, 'public/configs/application/config.json');
	try {
		const seedConfig = await readJson(seedConfigPath);
		const projectConfig = await readJson(currentFile);

		//add config imports
		const importConfig = [...seedConfig.importConfig, ...projectConfig.importConfig];
		seedConfig.importConfig = Array.from(new Set(importConfig));

		//add variable for bloombergBridgeFolder (for development use with "Bloomberg Bridge Debug")
		seedConfig.bloombergBridgeFolder = projectConfig.bloombergBridgeFolder;
		
		//write out updated config
		const output = await writeJson(seedConfigPath, seedConfig, { spaces: 2 });
		if (output) console.log('success writing config');


	} catch (error) {
		console.error(error);
	}

}

async function updatePreloadsBuildConfig(seedDirectory, currentFile) {
	console.log("Updating webpack.preloads.entries.json file");
    const seedConfigPath = path.join(seedDirectory, 'webpack/webpack.preloads.entries.json');
	try {
		const seedConfig = await readJson(seedConfigPath);
		const projectConfig = await readJson(currentFile);

		//add preloads to finsemble seed's preload build config
		Object.keys(projectConfig).forEach((key) => {
			seedConfig[key] = projectConfig[key];

		});

		//write out updated config
		const output = await writeJson(seedConfigPath, seedConfig, { spaces: 2 });
		if (output) console.log('success writing webpack.preloads.entries.json');

	} catch (error) {
		console.error(error);
	}

}

async function updateToolbar(seedDirectory, currentFile) { }
async function updatePreferences(seedDirectory, currentFile) { }