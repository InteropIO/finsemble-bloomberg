const chokidar = require('chokidar');
const path = require("path");
const { copy, mkdirp, access, constants, readJson, writeJson, remove } = require("fs-extra");

const configJSON = require("../finsemble.config.json")


const SRC_FOLDER = "./src"
const FINSEMBLE_CONFIG = "finsemble.config.json"

const seedDirectory = path.join(configJSON.seedProjectDirectory)

access(seedDirectory, constants.F_OK | constants.W_OK, (err) => {
  if (err) {
    console.error(
      `${seedDirectory} ${err.code === 'ENOENT' ? 'does not exist' : 'is read-only'}`);
  } else {
    beginWatch(seedDirectory)
  }
});

function beginWatch(seedDirectory) {
  // Initialize watcher.
  const watcher = chokidar.watch([SRC_FOLDER, FINSEMBLE_CONFIG], {
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
    .on('ready', () => ready(seedDirectory))
}


function updateSeed(action, currentPath, message, seedDirectory) {
  const destDir = `${seedDirectory}`
  const destinationPath = path.join(destDir, currentPath)

  if (currentPath === FINSEMBLE_CONFIG) {
    try {
      updateConfig(seedDirectory, currentPath)
    } catch (error) {
      console.error(`could not update the config due to: ${error}`)
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
  ✔ src folder found

  ---Begin watching---
  Ready for changes`)
}


async function updateConfig(seedDirectory, currentFile) {
  const seedConfigPath = path.join(seedDirectory, 'configs/application/config.json')

  try {
    const seedConfig = await readJson(seedConfigPath)
    const projectConfig = await readJson(currentFile)

    const importConfig = [...seedConfig.importConfig, ...projectConfig.importConfig]
    seedConfig.importConfig = Array.from(new Set(importConfig))

    const output = await writeJson(seedConfigPath, seedConfig, { spaces: 2 })
    if (output) console.log('success writing config!')


  } catch (error) {
    console.error(error)
  }

}