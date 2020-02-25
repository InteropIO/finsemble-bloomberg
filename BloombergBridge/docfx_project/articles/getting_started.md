# Getting Started

The technical prerequisites of this integration are:

- Latest version of [Finsemble's Bloomberg Terminal Connect integration](https://github.com/ChartIQ/fpe-bloomberg) integration
    - Make sure your Finsemble environment is up to date.
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

## How to go about integration
We should provide an overview of the integration process - a develop will not necessarily know exactly what they need to use at the start of the project and the better we guide them at the beginning, the less confused they will be and the less (confusing) support requests we will receive. I think the typical process will be:
Research the use case(s)
Talk to your traders and document
the workflows they operate
what commands they run  AND the associated tails
whether they are working with a launchpad group, worksheet or BBG panel
Work out your improved user journey
What integration types will you use
What data needs to flow in each direction
Determine if you need to translate data to/from an internal format to pass to/from Bloomberg
Implement that translation
Work out where your integration will sit in Finsemble, possibilities include:
A specific component
A custom client library or preload you can add to multiple components
A custom desktop service that your components and services will interact with that will pass on commands etc. to the BTC integration
