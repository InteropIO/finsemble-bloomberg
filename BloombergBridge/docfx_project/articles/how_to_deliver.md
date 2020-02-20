# Getting Started with the Bloomberg Terminal Connect Integration

1. Make sure you have the latest version of the [`fpe-bloomberg`](https://github.com/ChartIQ/fpe-bloomberg) integration.
1. Make sure you have the Terminal Connect API SDK. Note that this project will fail to build if the Terminal Connect DLL is not available.
    * Run `TMCT <GO>` in your Bloomberg Terminal for more information about this.
1. Make sure your Finsemble environment is up to date.
1. Refer to [Articles](articles/intro.md) or [API Documentation](xref:BloombergBridge).

# Technical prerequisites for this integration

- Node 8 LTS or 10.15.13
- Visual Studio 2019
- Finsemble.dll
  - Installed via NuGet when using Visual Studio to build the integration.
- Bloomberglp.TerminalApiEx.dll
  - Download from Bloomberg Terminal
    1. Run `TMCT <GO>`
    1. Click `Software Downloads`
    1. Follow `To install` instructions in the Terminal
  - Add the downloaded DLL as a reference to your integration's project
- Bloomberglp.Blpapi.dll
  - Download the `C# (.NET) Supported Release` from [Bloomberg](https://www.bloomberg.com/professional/support/api-library/) for Windows.
  - Add the downloaded DLL as a reference to your integration's project

## Quick Start Notes



## How to run

- Confirm that the previously downloaded DLLs have been referenced in your project.
  - Terminal Connect API (`Bloomberglp.TerminalApiEx.dll`)
  - Bloomberg API (`Bloomberglp.Blpapi.dll`)
- Using Visual Studio, build `BloombergIntegration.sln`
  - This will install NuGet dependencies
- `npm install`
- `npm run start`
  - `npm run start` will enable a local server so the integration can be hosted and used by Finsemble
- Launch local Finsemble
  - Assuming that the local Finsemble is searching for a manifest at `http://localhost:8000`
  - If you have your own Finsemble seed, follow these steps:
    1. Navigate to `configs/other`
    1. Open the `server-environment-startup.json` file
    1. Under the `"development"` entry, modify `"serverConfig"`
       - `"serverConfig": "http://localhost:8000/manifest-local.json"`
  - If you have the Launch Local Finsemble installer, double-click the installer or the installed shortcut
    - The installed shortcut will default to your desktop
- Confirm that your integration appears in the `Apps` menu in the Finsemble toolbar.

## Helpful snippets and examples

- Snippets can be seen in the `Snippets.cs` file or [Snippets API reference](xref:BloombergBridge.Snippets)
- A proof of concept example can be seen in the `Program.cs` file or [Program API reference](xref:BloombergBridge.Program)

# How to deliver this integration to your users

One approach is to host the completed integration on a server accessible to all your users.
Finsemble can be configured to launch this integration. As a consideration, each user would need their own Bloomberg Terminal license on the same machine as Finsemble.

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

Your manifest after adding these lines should look something like the following:

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

These two lines will allow Finsemble to pull in the Finsemble-Bloomberg integration to your users' app launcher.

After updating the configuration, an administrator will need to package and release a new version of your smart desktop to your users. The Finsemble Seed Project has a NPM script for creating a Finsemble installer to hand off to users.
[Read more about creating installers and deploying your smart desktop here.](https://documentation.chartiq.com/finsemble/tutorial-deployingYourSmartDesktop.html)

**Note:** Alternatively, the Terminal Connect API supports remote authentication so theoretically a single desktop that has both Finsemble and Bloomberg could be used by multiple users. **@FPE: Not sure what this means or why it's important to call out here.**