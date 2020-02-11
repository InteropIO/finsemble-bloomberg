# Finsemble-Bloomberg Integration

## Overview

**Blurb about this integration allows Finsemble and Bloomberg to communicate with each other on the same machine as well as that this integration will fail to build if the Terminal Connect DLL is not available.**

## Technical prerequisites for this integration

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
