# Finsemble's Bloomberg Terminal Connect Integration

Finsemble's Bloomberg Terminal Connect integration enables data synchronicity between the Bloomberg Terminal and Finsemble components on the same computer. Importantly, because Finsemble creates interoperability between apps, this integration allows you to connect the Bloomberg Terminal to many different apps in your portfolio: a one-to-many integration.

This integration is provided as a starting point. Use these examples to build meaningful workflows for your end users. New workflows will speed up work by keeping your internal apps in sync with the Bloomberg Terminal. Eliminate copy and paste errors as the Terminal shares data automatically with your Finsembilized applications.

* The [GitHub repo for the Bloomberg Terminal Connect integration can be found here](https://github.com/ChartIQ/fpe-bloomberg).
* To get an idea of the types of context sharing that's possible between Finsemble and Bloomberg, [check out our video demonstration.](https://chartiq.wistia.com/medias/z77u5v8x2q)
* For additional support, please contact your ChartIQ Client Support specialist at <a href="mailto:support@finsemble.com">support@finsemble.com</a>.

## Glossary
**Bloomberg Terminal Connect**: Terminal Connect links proprietary tools and spreadsheets with the Bloomberg Professional Service.
* For more information on Terminal Connect, run `TMCT<GO>` in your terminal.

**BLP API**: The Bloomberg L.P. API (BLP API) is a public API designed to allow the creation of applications for the Bloomberg Terminal.

**Finsemble**: Finsemble is a desktop integration platform used to build smart desktops.

## Using the Bloomberg Terminal Connect Integration

It provides:
* Bi-directional data sharing with a Launchpad group and Finsemble
* Bi-directional data sharing with a Worksheet and Finsemble
* The ability to send a command from Finsemble to a Bloomberg Panel

By using BTC with Finsemble, you will be able to make use of any of the above integrations with your apps and components and have them drive context in the Bloomberg terminal or react to context changes received from it.

### Data sharing with Launchpad Groups
Most (but not all) Bloomberg components can be placed in a Launchpad group, which can also be used for integration purposes with Finsemble over the BTC API.
Launchpad groups can take a single security as context, with each member of the group reacting to it when it is set (for example a pricing chart and a news component might both belong to a group, allowing both to show data relating to a particular security when it is set as the group's context.
You can get, set or subscribe to changes for a particular group
 I.e.  Integration is bi-directional; the launchpad group can react to a change in context, or send a message when its context is changed.
There are a particular set of BBG commands for working with Launchpad groups
<fill in what the finsemble integration does for you here - perhaps it auto pushes/pulls context for matching colour groups?>
Its important that there is a value add here over and above just using terminal connect API manually

### Data sharing with Worksheets
A worksheet is a list of securities that may be referenced by various BBG components in either Launchpad or a BBG main panel. Generally, a component that integrates uses a worksheet as its context will not also be part of or need to be part of a launchpad group
In launchpad, a component might be set up to listen to a particular worksheet and may react to changes to it. The same goes for other functions that are more commonly interacted with via the main panels, such as alerts.
The BTC integration for Finsemble allows you to create, retrieve or append to worksheets in BBG terminal.
Changes to a worksheet via the integration will trigger updates within any launchpad components that are listening to the worksheet/using it as their context.
There are a particular set of BBG commands for working with Worksheets

### Send commands from FInsemble to the Bloomberg Terminal

The Finsemble BTC integration can also facilitate working with the 4 main BBG panels
Where launchpad is used to setup groups of context-linked components to provide information about a single security, the BBG panels are used for more complex comparisons with multiple securities and more interactive processes, such as send a VCON.
Hence, integration with panels is likely to be for convenience within workflows, for example, a particular command is triggered (perhaps with options and inputs) automatically on integration with a particular Finsemble component, as then the user interacts with the resulting display in BBG pannel to complete the operation.
Most BBG commands can be used this, even if they don't have specific terminal connect support. E.g. A VCON form can be triggered currently,  but can't (yet) be filled out fully.
Integration is currently unidirectional, i.e. commands can be sent to a panel via BTC.
Bi-directional support may be available from BBG later in the year
<Its not actually clear to me if the commands are fired and any response is int he BBG terminal only, or if any data comes back. I suspect terminal only>
Most BBG commands can be sent to the terminal over BTC
Anatomy of a Bloomberg command
Each Bloomberg command is made up of
Mnemonic: The specific command that would normally be entered into the terminal (e.g. DES, YAS, VCON etc.)
Panel number to send it to
Tail: arguments specific to the mnemonic (optional) - see tje help page in terminal for each menmonic (shortcuts section) to discover what options it supports.
security 1 (optional)
security 2 (optional)


## How it works

This integration creates interoperability and data synchronization by utilizing both the Finsemble Router API and Terminal Connect API.

A subscription to the Bloomberg Terminal gives you access to the Terminal Connect API. This integration implements those Terminal Connect API calls where we saw useful and relevant use cases.

The Finsemble Router API is used to communicate with other Finsemble components. In this integration, we use separate Router channels as API endpoints. The Terminal Connect API interfaces with the Finsemble Router API to pass messages between Bloomberg Terminal panels/LaunchPad windows and Finsemble components.

The integration utilizes the Router's Query/Response model. In the source code of the main program there is a function called `BBG_CreateWorksheet`. This function name is also the channel name we declare in the Router. Any Router query calls to this channel will call the corresponding function in the integration. When these endpoints are queried, the integration handles the call and redirects as appropriate. Sometimes this redirect is as simple as passing the data directly to a Terminal Connect API endpoint. Other times, it will involve data manipulation and transformation to conform to the Terminal Connect endpoint. (For additional information about this powerful API, please refer to the [Finsemble Router documentation](https://documentation.chartiq.com/finsemble/tutorial-TheRouter.html).)

By utilizing both Finsemble and Bloomberg, a user can have all the relevant data and components at their fingertips immediately.