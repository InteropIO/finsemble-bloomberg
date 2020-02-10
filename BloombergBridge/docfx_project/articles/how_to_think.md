# How to think about this integration when starting an implementation

## Sample use cases

You know your users and your use case better than anybody, and your implementation of the Finsemble-Bloomberg Integration will reflect this expertise. However, we do have some sample use cases to spark inspiration:

* You can run arbitrary commands in Bloomberg with arbitrary tails **@FPE What are tails?** on arbitrary panels while using data from Finsemble components. For example:
    * A chart in Finsemble displays an equity.
    When the ticker changes, the Bloomberg integration can send the updated ticker and a DES command to a panel of the Bloomberg Terminal.
    * A chart in Finsemble displays a bond. When an end user updates this bond, the Bloomberg integration can send this new bond with a TOMS command to a panel of the Bloomberg Terminal. This will allow a user to view and use the Trade Order Management System inside of Bloomberg.
    * A worksheet in Finsemble displays multiple bonds. An end user selects a bond from this worksheet and sends it to Bloomberg through this integration. The integration then sends a `DES`, `YAS`, `QMGR`, and `TOMS` command to each of the Bloomberg Terminal panels or LaunchPad components. Additionally, the integration could send separate tails on each of the previous Bloomberg functions to deliver the exact information a user needs.
* You can create two-way data synchronization between Bloomberg LaunchPad components and Finsemble components. For example:
  * A user has multiple charts and other components in Finsemble linked on the same channel.
    Additionally, the user has multiple charts and other components in their LaunchPad environment.
    If the user changes their symbol/ticker context in either Finsemble or LaunchPad, the linked components in both environments will update accordingly.
    This cuts down on data duplication between applications and environments.
* You can pull data from Bloomberg using the BLP API (not Terminal Connect API) into Finsemble components. For exmaple:
  * A user can use the BLP API to search for a particular equity or bond, then this integration can send that data back into one or more Finsemble components.

## Implementation Details

The main method of achieving interoperability and data synchronization in this integration is utilizing both the Finsemble Router API and Terminal Connect API.

### Finsemble and the Router

Finsemble has a powerful API that utilizes the Finsemble Router to communicate with other Finsemble components. In this integration, we use separate Router channels as API endpoints.
However, this is not the only way to set up communication with the Router.

For additional information, please refer to the [Finsemble Router documentation](https://documentation.chartiq.com/finsemble/tutorial-TheRouter.html).

In the [API documentation for the main Program](xref:BloombergBridge.Program.BBG_CreateWorksheet(ChartIQ.Finsemble.FinsembleEventArgs)) **@FPE: Broken link. Confused about the term "main Program." Which one is the main program?** we have a function called `BBG_CreateWorksheet`. This function name is also the channel name we declare in the Router, so that any Router query calls to this channel will call the corresponding function in the integration. When these endpoints are queried, the Bloomberg integration handles the call and redirects as appropriate. Sometimes this redirect is as simple as passing the data directly to a Terminal Connect API endpoint. Other times, it will involve data manipulation and transformation to conform to the Terminal Connect endpoint.

Again, this model of communication is not the only one supported by the Finsemble Router.
Another style of communication is using [Pub/Sub](https://documentation.chartiq.com/finsemble/tutorial-TheRouter.html). **@FPE: Does that mean that the method utilized above is Query/Response?** Using this model gives a developer the ability to check every publish request and subscription request that comes across the wire. This allows for a centralized location to aggregate and spread data to the appropriate parties.
A benefit of this approach is that publishers and subscribers no longer have to be aware of each other.

### Terminal Connect and the Bloomberg Terminal

Once you have a subscription to the Bloomberg Terminal, you gain access to the Terminal Connect API. [The instructions for obtaining the Terminal Connect DLL](intro.md) are available in the "Introduction" article. The Terminal Connect API comes with its own documentation to showcase what the API is capable of. In this integration, we did not implement all possible Terminal Connect API calls. However, we did implement the ones where we saw useful and relevant use cases.

In order to utilize the Terminal Connect API, it is useful to understand the relevant parts of the Bloomberg Terminal. The Bloomberg Terminal consists of four panels and zero or more LaunchPad windows. The four panels are the traditional Bloomberg experience, allowing users to select securities and then run commands (`DES`, `YAS`, `GP`, etc.) using these securities.
Each panel is a separate window and are not interconnected.

The Bloomberg LaunchPad product is the newer Bloomberg experience. A user can have one or more LaunchPad windows and connect them visually and logically. Each LaunchPad window can run a Bloomberg command and update if the connected context changes. LaunchPad allows a user to fine tune their visual layout, as well as have more than four commands running at the same time.

By utilizing both Finsemble and Bloomberg, a user can have all the relevant data and components at their fingertips immediately.
