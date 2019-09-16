# fpe-bloomberg
# Introduction
The Finsemble Bloomberg integration utilizes the .NET API exposed by Bloomberg Terminal Connect, enabling data synchronicity between the Bloomberg Terminal and applications running in Finsemble. 

For more information on Terminal Connect, run TMCT<GO> in your terminal.

For a brief video demonstration of the types of context sharing that are possible between Finsemble and Bloomberg, please see [Finsemble Bloomberg Integration](https://chartiq.wistia.com/projects/9zacla7xfo). 

For additional support, please contact your ChartIQ Client Support specialist.

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

# How to view documentation
This project uses [docfx](https://dotnet.github.io/docfx/) to generate source code documentation.
The [docfx getting started](https://dotnet.github.io/docfx/tutorial/docfx_getting_started.html) gives helpful examples for different workflows to generate this documentation.
