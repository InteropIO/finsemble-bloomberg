# Bloomberg to FDC3 Example

This is an example app demonstrating interoperability between Bloomberg Terminal Connect API 3 and your apps using Finsemble's BloombergBridgeService and FDC3.

See [Integrating Bloomberg Terminal Connect](https://documentation.finsemble.com/docs/add-apps/bloomberg/integratingBloomberg) for instructions on setting up the Bloomberg Bridge service, configuring your API key, enabling Bloomberg, and enabling your app to use the BloombergBridgeClient.  

## The Launchpad tab

The Launchpad tab demonstrates two-way communication between apps in Finsemble and Bloomberg Terminal connect using the linker menu & FDC3 User channels.

This tab demonstrates:

- Listening for instruments broadcast via FDC3 and setting the Launchpad group accordingly.
- Listening for changes in the Launchpad groups' securities and using FDC3 to broadcast the appropriate context to linked apps.  
- Listening for changes to the actual Launchpad groups themselves and taking an appropriate action (in this updating the list of groups).
- Searching for a security in Bloomberg and both broadcasting to both linked apps AND Launchpad groups

## The Terminal tab

The Terminal tab allows the user to set-up commands that they can run in terminal panels using the current security, and automatic relays that listen for FDC3 intents, which can then be resolved by running the associated command in teh terminal.

This functionality demonstrated on this tab hooks into of the capabilities of the Bloomberg Bridge Service. This tab works by creating a list of relays stored in the Finsemble user preferences. The preferences are picked up by the Bloomberg Bridge service where it is acted upon. This is a simplified and improved version the Bloomberg preferences tab.

This functionality available on this tab demonstrates:

- Setup of terminal commands and the ability to run them against a current security.
- Listening for when an intent is raised and running an associated Bloomberg command

## Running the example

On the command line at the root of the project, install the project's dependencies `yarn install`. Build the source code by running `yarn build`. In a second command line window run `yarn serve`. This will run and serve the Bloomberg examples from a local server, the default should be `http://localhost:8080/`.

Alternatively, you can host a copy of the application by running `yarn build` and then copying the contents of the _/dist/BloombergToFDC3_ to your server.

### Finsemble Config

The example is now ready to be run in the Finsemble environment. Add the example to Finsemble by adding the config below to apps.json, or via the Finsemble SDD and start Finsemble.

**Note:** The preload in the config below may not be required. See the section on [Configuring your app to use BloombergBridgeClient](https://documentation.finsemble.com/docs/add-apps/bloomberg/integratingBloomberg#configuring-your-app-to-use-bloombergbridgeclient) for more information.

```json
{
    "appId": "BloombergCPanel",
    "name": "Bloomberg CPanel",
    "title": "Bloomberg CPanel",
    "type": "web",
    "details": {
        "url": "http://localhost:8080/components/BloombergToFDC3/"
    },
    "hostManifests": {
        "Finsemble": {
            "window":{
                "width": 400,
                "height": 480,
                "minWidth": 200,
                "minHeight": 250
            },
            "component": {
                "preload": ["$moduleRoot/preloads/BloombergBridgePreload.js", "$moduleRoot/preloads/zoom.js"]
            },
            "foreign": {
                "components": {
                    "App Launcher": {
                        "launchableByUser": true
                    }
                }
            }
        }
    }
}
```
