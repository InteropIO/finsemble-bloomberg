# Getting Started

The technical prerequisites of this integration are:

- Latest version of [Finsemble's Bloomberg Terminal Connect integration](https://github.com/ChartIQ/fpe-bloomberg) integration
    - Make sure your Finsemble environment is up to date.
- Node 8 LTS or 10.15.13
- Visual Studio 2019
- *Finsemble.dll*
  - Installed via NuGet when using Visual Studio to build the integration.
- *Bloomberglp.TerminalApiEx.dll*
  - Download from Bloomberg Terminal.
    1. Run `TMCT <GO>`.
    1. Click `Software Downloads`.
    1. Follow `To install` instructions in the Terminal.
  - Add the downloaded DLL as a reference to your integration's project.
- *Bloomberglp.Blpapi.dll*
  - Download the [BLP API C# (.NET) Supported Release for Windows](https://www.bloomberg.com/professional/support/api-library/) from Bloomberg.
  - Add the downloaded DLL as a reference to your integration's project.

## Running the integration

1.  First, confirm that the previously downloaded DLLs have been referenced in your project. Specifically:
    - Terminal Connect API (`Bloomberglp.TerminalApiEx.dll`)
    - BLP API (`Bloomberglp.Blpapi.dll`)
2.  Using Visual Studio, build `BloombergIntegration.sln`. This will install NuGet dependencies.
3. `npm install`
4. `npm run start` - This will enable a local server so the integration can be hosted and used by Finsemble.
5. Launch Finsemble locally.
    - Note: Make sure that your development environment is set to port 8000: `"serverConfig": "http://localhost:8000/manifest-local.json"`
6. Confirm that the integration appears in the Apps menu of the Finsemble toolbar.

## Delivering the integration to your users

One delivery approach is to host the completed integration on a server accessible to all your users. Finsemble can be configured to launch this integration, just like it would any other application. As a consideration, each user would need their own Bloomberg Terminal license on the same machine as Finsemble.

1. Open *manifest-local.json*.
2. In this file, look for the `"finsemble"` key.
3. You will need to add two lines, one under the `"finsemble"` key and one under the `"importConfig"` key.
4. Under `"finsemble"` add:
```javascript
`"fpe-bloombergRoot": "the server address for the completed integration"`
```
5. Then under `"importConfig"` add:
```javascript
`"$fpe-bloombergRoot/config-examples.json"`
```

After adding these lines, your manifest should look something like the following:

```json
    ...
    ...
    ...
    "finsemble": {
        "applicationRoot": "http://localhost:3375",
        "moduleRoot": "$applicationRoot/finsemble",
        "servicesRoot": "$applicationRoot/finsemble/services",
        "notificationURL": "$applicationRoot/components/notification/notification.html",
        "fpe-bloombergRoot": "https://some-server/place-where-the-integration-is-hosted/",
        "importConfig": [
            "$applicationRoot/configs/application/config.json",
            "$fpe-bloombergRoot/config-examples.json"
        ],
        "IAC": {
            "serverAddress": "ws://127.0.0.1:3376"
        }
    ...
    ...
    ...
    }
```

These two lines will allow Finsemble to pull in the Bloomberg Terminal Connect integration to your users' app launcher.

After updating the configuration, an administrator will need to package and release a new version of your smart desktop to your users. The Finsemble Seed Project has a NPM script for creating a Finsemble installer to hand off to users.
[Read more about creating installers and deploying your smart desktop here.](https://documentation.chartiq.com/finsemble/tutorial-deployingYourSmartDesktop.html)

**Note:** Alternatively, the Terminal Connect API supports remote authentication so theoretically a single desktop that has both Finsemble and Bloomberg could be used by multiple users via a remote desktop client.