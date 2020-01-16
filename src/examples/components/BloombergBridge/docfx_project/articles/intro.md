# Bloomberg & Finsemble Integration

# Technical prerequisites for this integration
* Node 8 LTS or 10.15.13
* Finsemble.dll
    * Installed via NuGet (preferred method)
    * Located in the `FinsembleResources` folder in each sample project (as necessary)
* Bloomberglp.TerminalApiEx.dll
    * Download from Bloomberg Terminal
        1. Run `TMCT <GO>`
        2. Click `Software Downloads`
        3. Follow `To install` instructions in the Terminal
    * Add as reference to your integration's project
* Bloomberglp.Blpapi.dll
    * Download from [Bloomberg](https://www.bloomberg.com/professional/support/api-library/)
    * Add as reference to your integration's project

# How to run
* Confirm project dependencies have been installed
    * Terminal Connect API (`Bloomberglp.TerinalApiEx.dll`)
    * Bloomberg API (`Bloomberglp.Blpapi.dll`)
* Build `BloombergIntegration.sln`
    * This will install NuGet dependencies
* `npm install`
* `npm run start`
    * `npm run start` will enable a local server so the integration can be hosted and used by Finsemble
* Launch local Finsemble
    * Assuming that the local Finsemble is searching for a manifest at `http://localhost:8000`
* Confirm that your integration appears in the `Apps` menu in the Finsemble toolbar.

# Helpful snippets and examples
* Snippets can be seen in the `Snippets.cs` file or [Snippets API reference](xref:BloombergBridge.Snippets)
* A proof of concept example can be seen in the `Program.cs` file or [Program API reference](xref:BloombergBridge.Program)
