# Finsemble's Bloomberg Terminal Connect Integration

Finsemble's Bloomberg Terminal Connect integration enables data synchronicity between the Bloomberg Terminal and Finsemble components on the same computer.

* The [GitHub repo for the Bloomberg Terminal Connect integration can be found here](https://github.com/ChartIQ/fpe-bloomberg).
* To get an idea of the types of context sharing that's possible between Finsemble and Bloomberg, [check out our video demonstration.](https://chartiq.wistia.com/medias/z77u5v8x2q)
* For additional support, please contact your ChartIQ Client Support specialist at <a href="mailto:support@finsemble.com">support@finsemble.com</a>.

## Glossary
**Bloomberg Terminal Connect**: Bloomberg Terminal Connect is an interface that allows you to use Bloomberg functions from other applications or spreadsheets.
* For more information on Terminal Connect, run `TMCT<GO>` in your terminal.

**BLP API**: The Bloomberg L.P. API (BLP API) is a public API designed to allow the creation of applications for the Bloomberg Terminal.

**Finsemble**: Finsemble is a desktop integration platform used to build smart desktops.

## How it works

This integration creates interoperability and data synchronization by utilizing both the Finsemble Router API and Terminal Connect API.

A subscription to the Bloomberg Terminal gives you access to the Terminal Connect API. This integration implements those Terminal Connect API calls where we saw useful and relevant use cases.

The Finsemble Router API is used to communicate with other Finsemble components. In this integration, we use separate Router channels as API endpoints. The Terminal Connect API interfaces with the Finsemble Router API to pass messages between Bloomberg Terminal panels/LaunchPad windows and Finsemble components.

The integration utilizes the Router's Query/Response model. In the source code of the main program there is a function called `BBG_CreateWorksheet`. This function name is also the channel name we declare in the Router. Any Router query calls to this channel will call the corresponding function in the integration. When these endpoints are queried, the integration handles the call and redirects as appropriate. Sometimes this redirect is as simple as passing the data directly to a Terminal Connect API endpoint. Other times, it will involve data manipulation and transformation to conform to the Terminal Connect endpoint.

Another style of communication that can be used is [Pub/Sub](https://documentation.chartiq.com/finsemble/tutorial-TheRouter.html). Use this model to check every publish/subscription request that comes across the wire. This allows a centralized location to aggregate and spread data to the appropriate parties. A benefit of this approach is that publishers and subscribers no longer have to be aware of each other. (For additional information about this powerful API, please refer to the [Finsemble Router documentation](https://documentation.chartiq.com/finsemble/tutorial-TheRouter.html).)

By utilizing both Finsemble and Bloomberg, a user can have all the relevant data and components at their fingertips immediately.