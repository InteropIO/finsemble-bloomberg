# Finsemble's Bloomberg Terminal Connect Integration

Finsemble's Bloomberg Terminal Connect integration enables data synchronicity between the Bloomberg Terminal and Finsemble components on the same computer. Crucially, because Finsemble creates interoperation between multiple applications, you gain added synergy from connecting them all to the Bloomberg Terminal.

This integration is provided as a starting point. Build out these basic examples to provide meaningful workflows for your end users. New workflows will speed up work by keeping your internal apps in sync with the Bloomberg Terminal. Eliminate costly errors as the Terminal shares data automatically with your Finsembilized applications.

* The [GitHub repo for the Bloomberg Terminal Connect integration can be found here](https://github.com/ChartIQ/fpe-bloomberg). Request access by reaching out to a ChartIQ Client Support specialist at <a href="mailto:support@finsemble.com">support@finsemble.com</a>.
* To get an idea of the types of context sharing that's possible between Finsemble and Bloomberg, [check out our video demonstration.](https://chartiq.wistia.com/medias/z77u5v8x2q)

## Glossary
**Bloomberg Terminal Connect**: Terminal Connect links proprietary tools and spreadsheets with the Bloomberg Professional Service.
* For more information on Terminal Connect, run `TMCT<GO>` in your terminal.

**BLP API**: The Bloomberg L.P. API (BLP API) is a public API designed to allow the creation of applications for the Bloomberg Terminal.

**Finsemble**: Finsemble is a desktop integration platform used to build smart desktops.

## Using the Bloomberg Terminal Connect integration

The Bloomberg Terminal Connect integration provides:
* Bi-directional data sharing between a Launchpad group and Finsemble
* Bi-directional data sharing between a worksheet and Finsemble
* The ability for Finsemble to trigger a function in a Bloomberg Panel

By using this integration with Finsemble, you can provide these capabilities to your applications. Your Finsembilized components can drive context in the Bloomberg Terminal or react to context changes received from it.

### Data sharing with Launchpad groups
Most Bloomberg components can be placed in a Launchpad group. Launchpad groups can take a single security as context. When the security is changed, each member of the Launchpad automatically updates to the new security, e.g., a pricing chart and a news component on a Launchpad both update and show new data when the Launchpad's context is updated. This works similarly to Finsemble's concept of Linker channels.

You can get, set, or subscribe to changes for a particular group. This is bi-directional; the Launchpad group can react to a change in context **or** send a message when its context is changed.

**Example 1**: An end user could link Finsemble components and Launchpads together. If the end user changes their symbol context in either Finsemble or Launchpad, the linked components in both environments will update accordingly. This cuts down on data duplication between applications and environments.

```C#
// Updates context when Finsemble sends new context
private static void BBG_UpdateContext(FinsembleEventArgs data)
{
    if (data.response != null)
    {
        List<string> groups = new List<string>();
        var response = data.response["data"];
        if (response.Type is JTokenType.String)
        {
            response = JObject.Parse(response.Value<string>());
        }
        var instrument = response["fdc3.instrument"];
        if (instrument != null)
        {
            var symbol = (string)instrument.SelectToken("id.ticker");
            if (instrument.SelectToken("id.coupon") != null)
            {
                var coupon = instrument.SelectToken("id.coupon");
                var maturityDate = instrument.SelectToken("id.maturityDate");
                var _symbol = symbol;
                symbol = _symbol + " " + coupon + " " + maturityDate + " Corp";
                globalSymbol = symbol;
            }
            else
            {
                globalSymbol = symbol + " Equity";
            }

            var BBG_groups = BlpTerminal.GetAllGroups();
            foreach (BlpGroup item in BBG_groups)
            {
                BlpTerminal.SetGroupContext(item.Name, symbol);
            }
        }

    }
}
// Updates context when Launchpad sends new context
private static void BlpTerminal_ComponentGroupEvent(object sender, BlpGroupEventArgs e)
{
    var type = e.GetType();
    if (type == typeof(BlpGroupContextChangedEventArgs))
    {
        BlpGroupContextChangedEventArgs context = (BlpGroupContextChangedEventArgs)e;
        var tickerChange = context.Group.Value;
        if (tickerChange.Contains("List"))
        {   // Context change that occurs from changing a component's group.
            // Doesn't contain any data that we would want to send across the wire
            return;
        }
        string[] splitter = { "US Equity" };
        var tickerChangeArray = tickerChange.Split(splitter, StringSplitOptions.RemoveEmptyEntries);
        var symbolToSend = tickerChangeArray[0];
        var _data = new
        {
            id = new
            {
                ticker = symbolToSend.Trim()
            }
        };
        var data = JsonConvert.SerializeObject(_data, Formatting.Indented);
        JObject fdc3_instrument = new JObject
        {
            { "dataType", "fdc3.instrument" },
            { "data", data }
        };
    }
}
```

**Example 2**: You can share Bloomberg Terminal search data with Finsemble. If an end user searches for a particular equity or bond in the Terminal, this integration can send that data back into one or more Finsemble components.

```C#
public static string SecurityLookup(string security)
{
    var secFinder = new SecurityLookup();
    secFinder.Init();
    secFinder.Run(security);
    string BLP_security = secFinder.GetSecurity();
    BLP_security = BLP_security.Replace('<', ' ').Replace('>', ' ');
    secFinder.Dispose();
    secFinder = null;
    return BLP_security;
}
```

### Data sharing with worksheets
A worksheet is a list of securities that may be referenced by various Bloomberg components in either a Launchpad or panel. Generally, a component that uses a Worksheet as its context will not need to be part of a Launchpad group.

In a Launchpad, a component might be set up to listen to a particular worksheet and react to changes to it. The same goes for other functions that are more commonly interacted with via the main panels, such as alerts.

The Bloomberg Terminal Connect integration allows you to create, retrieve, or append **@FPE: Append what?** to worksheets in the Bloomberg Terminal. Changes to a worksheet via the integration will trigger updates within any Launchpad components that are listening to the worksheet.

**Example**: **@FPE: What example code do we have of this?**

### Send commands from Finsemble to the Bloomberg Terminal

This integration can also facilitate work with the four main Bloomberg panels. Whereas Launchpads are used to set up groups of context-linked components that provide information about a single security, panels are used for more complex comparisons with multiple securities and use more interactive processes.

Integration with panels can create powerful workflows. For example, a particular command can be triggered automatically by a Finsemble component, allowing the end user to interact with the resulting display in the Bloomberg panel to complete the operation.

This functionality is unidirectional, i.e., commands are sent to a panel from Finsemble via Terminal Connect. Most Bloomberg commands can be used in this manner even if they don't have specific Terminal Connect support.

#### The anatomy of a Bloomberg command
Each Bloomberg command is made up of:
* Mnemonic: The specific command that would normally be entered into the Terminal (e.g., DES, YAS, VCON)
* Panel number to send it to
* Tail: Arguments specific to the mnemonic (optional) - See the help page in the Terminal for each mnemonic to discover what options it supports
* Security 1 (optional)
* Security 2 (optional)

**Example 1**: You can run a Bloomberg command when a chart in Finsemble displays an equity. When the ticker changes, the integration can send the updated ticker and a `DES` command to a panel of the Bloomberg Terminal.

```C#
private static void BBG_RunDESAndUpdateContext(FinsembleEventArgs data)
{
    // In this case, DES will run every time this function is called
    var response = data.response["data"];
    var instrument = response["fdc3.instrument"];
    var symbol = (string)instrument.SelectToken("id.ticker");
    symbol += " Equity";
    List<string> testList = new List<string>
            {
                symbol
            };
    if (response["groups"] == null)
    {
        BlpTerminal.RunFunction("DES", "1", testList, "1");
    }
    else
    {
        List<string> groups = new List<string>();
        for (int i = 0; i < response["groups"].Count(); i++)
        {
            groups.Add((string)response["groups"][i]);
        }
        var BBG_groups = BlpTerminal.GetAllGroups();
        List<string> list_BBG_groups = new List<string>();
        foreach (BlpGroup item in BBG_groups)
        {
            list_BBG_groups.Add(item.Name);
        }
        BlpTerminal.RunFunction("DES", "1", testList, "1");
        foreach (string group in groups)
        {
            if (list_BBG_groups.Contains(group))
            {
                BlpTerminal.SetGroupContext(group, symbol);
            }
        }
    }
}
```

**Example 2**: When a chart in Finsemble displays a bond, the integration can send this new bond with a `TOMS` command to a panel of the Bloomberg Terminal. This will allow a user to view and use the Trade Order Management System inside of Bloomberg.

```C#
private static void BBG_RunFunction(FinsembleEventArgs data)
{
    var response = data.response["data"];
    // response["mnemonic"] is "TOMS" in this case
    if (response["mnemonic"] != null && response["fdc3.instrument"] != null)
    {
        var BBG_mnemonic = response.Value<string>("mnemonic");
        var instrument = response["fdc3.instrument"];
        var symbol = (string)instrument.SelectToken("id.ticker");
        symbol += " Equity";
        List<string> securityList = new List<string>
                {
                    symbol
                };
        var tails = "1";
        var panel = "1";
        if (response["tails"] != null)
        {
            tails = response.Value<string>("tails");
        }
        if (response["panel"] != null)
        {
            panel = response.Value<string>("panel");
        }
        BlpTerminal.RunFunction(BBG_mnemonic, panel, securityList, tails);
    }
}
```

## How it works

This integration creates interoperability and data synchronization by utilizing both the Finsemble Router API and Terminal Connect API.

Terminal Connect allows you to link proprietary apps with the Terminal. This integration implements example Terminal Connect API calls where we saw useful and relevant use cases.

The Finsemble Router API is used to communicate with other Finsemble components. In this integration, we use separate Router channels as API endpoints. The Terminal Connect API interfaces with the Finsemble Router API to pass messages between Bloomberg Terminal panels/LaunchPad windows and Finsemble components.

**@FPE: Mark, I would add a diagram about the communication between BTC/theRouter/Finsemble here. In general, would you read over this section and expand it in the ways that you articulated to me at the whiteboard?**

The integration utilizes the Router's Query/Response model. In the source code of the main program there is a function called `BBG_CreateWorksheet`. This function name is also the channel name we declare in the Router. Any Router query calls to this channel will call the corresponding function in the integration. When these endpoints are queried, the integration handles the call and passes it onto the Terminal Connect API as appropriate. Sometimes this redirect is as simple as passing the data directly to a Terminal Connect API endpoint. Other times, it will involve data manipulation and transformation to conform to the Terminal Connect endpoint. (For additional information about this powerful API, please refer to the [Finsemble Router documentation](https://documentation.chartiq.com/finsemble/tutorial-TheRouter.html).)

By utilizing both Finsemble and Bloomberg, a user can have all the relevant data and components at their fingertips immediately.