# Finsemble-Bloomberg Integration

## Technical prerequisites for this integration

* Node 8 LTS or 10.15.13
* Visual Studio 2019
* Finsemble.dll
  * Installed via NuGet (preferred method) **@FPE: What is "NuGet" and why is it the preferred method for downloading Finsemble.dll? Instructions should be included.**
  * Located in the `FinsembleResources` folder in each sample project (as necessary)
* Bloomberglp.TerminalApiEx.dll
  * Download from Bloomberg Terminal
      1. Run `TMCT <GO>`
      1. Click `Software Downloads`
      1. Follow `To install` instructions in the Terminal
  * Add as reference to your integration's project **@FPE: How?**
* Bloomberglp.Blpapi.dll
  * Download from [Bloomberg](https://www.bloomberg.com/professional/support/api-library/) **@FPE: Which version do you download and install? There are several.**
  * Add as reference to your integration's project **@FPE: How?**

## How to run

* Confirm project dependencies have been installed **@FPE: How?**
  * Terminal Connect API (`Bloomberglp.TerinalApiEx.dll`)
  * Bloomberg API (`Bloomberglp.Blpapi.dll`)
* Build `BloombergIntegration.sln` **@FPE: What is the command to do this? npm run build at the Finsemble folder level?**
  * This will install NuGet dependencies
* `npm install`
* `npm run start`
  * `npm run start` will enable a local server so the integration can be hosted and used by Finsemble
* Launch local Finsemble **@FPE: How? npm run dev?**
  * Assuming that the local Finsemble is searching for a manifest at `http://localhost:8000`
* Confirm that your integration appears in the `Apps` menu in the Finsemble toolbar.

## Helpful snippets and examples

* Snippets can be seen in the `Snippets.cs` file or [Snippets API reference](xref:BloombergBridge.Snippets)
* A proof of concept example can be seen in the `Program.cs` file or [Program API reference](xref:BloombergBridge.Program)
