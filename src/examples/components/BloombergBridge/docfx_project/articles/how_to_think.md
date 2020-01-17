# How to think about this integration when starting an implementation

## Appropriate use cases

Only you know what you want to do with this Bloomberg integration and some other set of components.
However, we do have some sample use cases to spark inspiration:

* Running arbitrary commands in Bloomberg with arbitrary tails on arbitrary panels, using data from Finsemble components.
  * E.g. A chart in Finsemble displays an equity.
    When the ticker changes, this Bloomberg integration can send the updated ticker and a DES command to a panel of the Bloomberg Terminal.
    * E.g. A chart in Finsemble displays a bond.
     When a user updates this bond, this Bloomberg integration can send this new bond with a TOMS command to a panel of the Bloomberg Terminal.
     This will allow a user to view and use the Trade Order Management System inside of Bloomberg.
    * E.g. A worksheet in Finsemble displays multiple bonds.
      A user select a bond from this worksheet and sends it to Bloomberg through this integration.
      The integration then sends a DES, YAS, QMGR, and TOMS command to each of the Bloomberg Terminal panels and/or LaunchPad components.
      Additionally, the integration could send separate tails on each of the previous Bloomberg functions to deliver the exact information a user needs.
* Two way data synchronization between Bloomberg LaunchPad components/groups and Finsemble components/groups.
  * E.g. A user has multiple charts and other components in Finsemble linked on the same color channel.
    Additionally, the user has multiple charts and other components in their LaunchPad environment.
    If the user changes their symbol/ticker context in either Finsemble or LaunchPad, the linked components in both environment will update accordingly.
    This cuts down on data duplication between applications and environments.
* Pulling data from Bloomberg using the BLPAPI (not Terminal Connect API) into Finsemble components.
  * E.g. A user can use the BLPAPI to search for a particular equity or bond, then this integration can send that data back into one or more Finsemble components.

## Implementation Details

The main method of achieving interoperability and data synchronization in this integration is utilizing both the Finsemble API and Terminal Connect API.

### Finsemble and the Router

Finsemble has a powerful API that utilizes the Finsemble router to communicate with other Finsemble components.
In this integration, we use separate router channels as API endpoints.
However, this is not the only way to set up communication with the router.
For additional information, please refer to the [Finsemble Router documentation](https://documentation.chartiq.com/finsemble/tutorial-TheRouter.html).

In the [API documentation for the main Program](xref:BloombergBridge.Program.BBG_CreateWorksheet(ChartIQ.Finsemble.FinsembleEventArgs)) we have a function called `BBG_CreateWorksheet`.
This function name is also the channel name we declare in the router, so that any router query calls to this channel will call the corresponding function in the integration.
When these endpoints are queried, the Bloomberg integration handles the call and redirects as appropriate.
Sometimes this redirect is as simple as passing the data directly to a Terminal Connect API endpoint.
Other times, it will involve data manipulation and transformation to conform to the Terminal Connect endpoint.

Again, this model of communication is not the only one supported by the Finsemble router.
Another style of communication is using the [Pub/Sub or middleware concept](https://documentation.chartiq.com/finsemble/tutorial-TheRouter.html).
Using this model gives a developer the ability to check every publish request and subscription request that comes across the wire.
This allows for a centralized location to aggregate and spread data to the appropriate parties.
A benefit of this approach is that publishers and subscribers no longer have to be aware of each other.

### Terminal Connect and the Bloomberg Terminal

Once you have a subscription to the Bloomberg Terminal, you gain access to the Terminal Connect API.
[The instructions for obtaining the Terminal Connect DLL](intro.md) are available in the "Introduction" article.
The Terminal Connect API comes with its own documentation to showcase what the API is capable of.
In this integration, we did not implement all possible Terminal Connect API calls.
However, we did implement the ones where we saw useful and relevant use cases.

In order to utilize the Terminal Connect API, it is useful to understand the relevant parts of the Bloomberg Terminal.
The Bloomberg Terminal consists of four panels and zero or more LaunchPad windows.
The four panels are the traditional Bloomberg experience, allowing users to select securities and then run commands (DES, YAS, GP, etc.) using these securities.
Each panel is a separate window and are not interconnected.
The Bloomberg LaunchPad product is the newer Bloomberg experience.
A user can have one or more LaunchPad windows and connect them visually and/or logically.
Each LaunchPad window can run a Bloomberg command and update if the connected context changes.
LaunchPad allows a user to fine tune their visual layout, as well as have more than four commands running at the same time.

By utilizing both Finsemble and Bloomberg, a user can have all the relevant data and components at their fingertips immediately.
