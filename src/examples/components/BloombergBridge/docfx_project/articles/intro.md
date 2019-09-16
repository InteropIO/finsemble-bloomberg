# Bloomberg & Finsemble Integration

# Technical prerequisites for this integration
* Node 8 or greater
* Finsemble.dll
    * Located in the `FinsembleResources` folder in each sample project
    * Can be installed via NuGet as well
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
* Build `BloombergIntegration.sln`
* `npm install`
* `npm run start`
* Launch local Finsemble
    * Assuming that the local Finsemble is searching for a manifest at `http://localhost:8000`
* Confirm that your integration appears in the `Apps` menu in the Finsemble toolbar.

# Helpful snippets and examples
* Snippets can be seen in the `Snippets.cs` file or [Snippets api referece](~/api/BloombergBridge.Snippets.html)
* A proof of concept example can be seen in the `Program.cs` file or [Program api reference](~/api/BloombergBridge.Program.html)
