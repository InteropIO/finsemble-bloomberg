# How to think about this integration when starting an implementation

## Sample use cases

You know your users and your use case better than anybody, and your implementation of the Finsemble-Bloomberg Integration will reflect this expertise. However, we do have some sample use cases to spark inspiration:

- You can run arbitrary commands in Bloomberg with arbitrary tails (additional parameters that are passed with a command that control the output of that command) on arbitrary panels while using data from Finsemble components. For example:
  - A chart in Finsemble displays an equity.
    When the ticker changes, the Bloomberg integration can send the updated ticker and a `DES` command to a panel of the Bloomberg Terminal.

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

  - A chart in Finsemble displays a bond.
  When an end user updates this bond, the Bloomberg integration can send this new bond with a `TOMS` command to a panel of the Bloomberg Terminal.
  This will allow a user to view and use the Trade Order Management System inside of Bloomberg.

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

  - A worksheet in Finsemble displays multiple bonds.
  An end user selects a bond from this worksheet and sends it to Bloomberg through this integration.
  The integration then sends a `DES`, `YAS`, `QMGR`, and `TOMS` command to each of the Bloomberg Terminal panels or LaunchPad components.
  Additionally, the integration could send separate tails on each of the previous Bloomberg functions to deliver the exact information a user needs.

  ```C#
        private static void BBG_RunWorkflow(FinsembleEventArgs data)
        {
            var response = data.response["data"];
            var firstCommand = 'DES';
            var secondCommand = 'YAS';
            var thirdCommand = 'QMGR';
            var fourthCommand = 'TOMS';
            string[] commandArray = {firstCommand, secondCommand, thirdCommand, fourthCommand};
            if (response["fdc3.instrument"] != null)
            {
                var instrument = response["fdc3.instrument"];
                var symbol = (string)instrument.SelectToken("id.ticker");
                symbol += " Equity";
                List<string> securityList = new List<string>
                        {
                            symbol
                        };
                var tails = "1";
                if (response["tails"] != null)
                {
                    tails = response.Value<string>("tails");
                }
                for (var i = 1; i < 5; i++) {
                  BlpTerminal.RunFunction(commandArray[i-1], i, securityList, tails);
                }
            }
        }
  ```

- You can create two-way data synchronization between Bloomberg LaunchPad components and Finsemble components. For example:
  - A user has multiple charts and other components in Finsemble linked on the same channel.
    Additionally, the user has multiple charts and other components in their LaunchPad environment.
    If the user changes their symbol/ticker context in either Finsemble or LaunchPad, the linked components in both environments will update accordingly.
    This cuts down on data duplication between applications and environments.

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

- You can pull data from Bloomberg using the BLP API (not Terminal Connect API) into Finsemble components. For example:
  - A user can use the BLP API to search for a particular equity or bond, then this integration can send that data back into one or more Finsemble components.

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

## Implementation Details

The main method of achieving interoperability and data synchronization in this integration is utilizing both the Finsemble Router API and Terminal Connect API.

### Finsemble and the Router

Finsemble has a powerful API that utilizes the Finsemble Router to communicate with other Finsemble components. In this integration, we use separate Router channels as API endpoints.
However, this is not the only way to set up communication with the Router.

For additional information, please refer to the [Finsemble Router documentation](https://documentation.chartiq.com/finsemble/tutorial-TheRouter.html).

In the source code of the main Program we have a function called `BBG_CreateWorksheet`. This function name is also the channel name we declare in the Router, so that any Router query calls to this channel will call the corresponding function in the integration. When these endpoints are queried, the Bloomberg integration handles the call and redirects as appropriate. Sometimes this redirect is as simple as passing the data directly to a Terminal Connect API endpoint. Other times, it will involve data manipulation and transformation to conform to the Terminal Connect endpoint. This is possible due to the [Query/Response](https://documentation.chartiq.com/finsemble/tutorial-TheRouter.html#query-response-example) model of communication in the Finsemble Router.

Another style of communication is using [Pub/Sub](https://documentation.chartiq.com/finsemble/tutorial-TheRouter.html). Using this model gives a developer the ability to check every publish request and subscription request that comes across the wire. This allows for a centralized location to aggregate and spread data to the appropriate parties.
A benefit of this approach is that publishers and subscribers no longer have to be aware of each other.

### Terminal Connect and the Bloomberg Terminal

Once you have a subscription to the Bloomberg Terminal, you gain access to the Terminal Connect API. [The instructions for obtaining the Terminal Connect DLL](intro.md) are available in the "Introduction" article. The Terminal Connect API comes with its own documentation to showcase what the API is capable of. In this integration, we did not implement all possible Terminal Connect API calls. However, we did implement the ones where we saw useful and relevant use cases.

In order to utilize the Terminal Connect API, it is useful to understand the relevant parts of the Bloomberg Terminal. The Bloomberg Terminal consists of four panels and zero or more LaunchPad windows. The four panels are the traditional Bloomberg experience, allowing users to select securities and then run commands (`DES`, `YAS`, `GP`, etc.) using these securities.
Each panel is a separate window and are not interconnected.

The Bloomberg LaunchPad product is the newer Bloomberg experience. A user can have one or more LaunchPad windows and connect them visually and logically. Each LaunchPad window can run a Bloomberg command and update if the connected context changes. LaunchPad allows a user to fine tune their visual layout, as well as have more than four commands running at the same time.

By utilizing both Finsemble and Bloomberg, a user can have all the relevant data and components at their fingertips immediately.
