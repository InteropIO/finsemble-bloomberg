# Sample use cases

You know your users and your use case better than anybody, and your implementation of the Bloomberg Terminal Connect integration will reflect this expertise. However, we do have some sample use cases to spark inspiration. For example:

- You can run commands in Bloomberg with tails (additional parameters that are passed with a command that control the output of that command) on panels while using data from Finsemble components.
- You can create two-way data synchronization between Bloomberg LaunchPad components and Finsemble components.
- You can pull data from Bloomberg using the BLP API into Finsemble components.

## Example code snippets

### Run a Bloomberg function when a chart in Finsemble displays an equity
When the ticker changes, the integration can send the updated ticker and a `DES` command to a panel of the Bloomberg Terminal.

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

### Run a Bloomberg function when a chart in Finsemble displays a bond
When a chart in Finsemble displays a bond, the integration can send this new bond with a `TOMS` command to a panel of the Bloomberg Terminal. This will allow a user to view and use the Trade Order Management System inside of Bloomberg.

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

## Send a bond from a Finsemble worksheet to Bloomberg
An end user can select a bond from a worksheet in Finsemble and send it to Bloomberg through this integration. The integration then sends a `DES`, `YAS`, `QMGR`, and `TOMS` command to each of the Bloomberg Terminal panels or LaunchPad components. Additionally, the integration could send separate tails on each of the previous Bloomberg functions to deliver the exact information an end user needs.

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

### Link Finsemble components with Bloomberg panels
An end user can link Finsemble components and LaunchPads together. If the end user changes their symbol/ticker context in either Finsemble or LaunchPad, the linked components in both environments will update accordingly. This cuts down on data duplication between applications and environments.

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

### Share Bloomberg Terminal search data with Finsemble
A user can use the BLP API to search for a particular equity or bond. Then, this integration can send that data back into one or more Finsemble components.

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