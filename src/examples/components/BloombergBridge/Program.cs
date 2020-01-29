using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using Bloomberglp.Blpapi;
using Bloomberglp.TerminalApiEx;
using ChartIQ.Finsemble;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace BloombergBridge
{
    /// <summary>
    /// Class that represents the Bloomberg and Finsemble integration
    /// </summary>
    public class Program
    {
        private static readonly AutoResetEvent autoEvent = new AutoResetEvent(false);
        private static readonly object lockObj = new object();
        private static Finsemble FSBL = null;
        private static List<string> securities = null;
        private static string globalSymbol;

        /// <summary>
        /// Main runner for Finsemble and Bloomberg integration
        /// </summary>
        /// <param name="args">Arguments used to initialize Finsemble</param>
        // ! Should be client agnostic
        public static void Main(string[] args)
        {
#if DEBUG
            System.Diagnostics.Debugger.Launch();
#endif
            lock (lockObj)
            {
                AppDomain.CurrentDomain.ProcessExit += new System.EventHandler(CurrentDomain_ProcessExit);
            }

            // Initialize Finsemble
            try
            {
                FSBL = new Finsemble(args, null);
                FSBL.Connected += OnConnected;
                FSBL.Disconnected += OnShutdown;
                FSBL.Connect();
            }
            catch (Exception err)
            {
                FSBL.RPC("Logger.error", new List<JToken>
               {
                   "Exception thrown: ", err.Message
               });
            }
            // Block main thread until worker is finished.
            autoEvent.WaitOne();

        }
        /// <summary>
        /// Handler for when the Bloomberg Bridge process is terminated.
        /// </summary>
        /// <param name="sender">Object</param>
        /// <param name="e">EventArgs</param>
        // ! Should be client agnostic
        public static void CurrentDomain_ProcessExit(object sender, EventArgs e)
        {
            FSBL.RouterClient.RemoveResponder("BBG_ready");
            FSBL.RouterClient.Transmit("BBG_ready", false);
            FSBL.RouterClient.RemoveListener("BBG_symbol_list", (fsbl_sender, response) =>
            {
                Console.WriteLine(response);
            });
            FSBL.RouterClient.RemoveListener("BBG_des_symbol", (fsbl_sender, response) =>
            {
                Console.WriteLine(response);
            });
        }


        /// <summary>
        /// Function that fires when the Bloomberg Bridge successfully connects to Finsemble.
        /// </summary>
        /// <remarks>
        /// In our case, we want to check if the Bloomberg Terminal Connect API is available to be used.
        /// </remarks>
        /// <param name="sender"></param>
        /// <param name="e"></param>
        // ! Client agnostic function
        public static void OnConnected(object sender, EventArgs e)
        {
            FSBL.RPC("Logger.log", new List<JToken> { "Bloomberg bridge connected to Finsemble." });

            bool isBloombergConnected = false;
            while (!isBloombergConnected)
            {
                try
                {
                    // Note for overhead of polling
                    BlpApi.Register();
                    BlpApi.Disconnected += new System.EventHandler(BlpApi_Disconnected);
                    isBloombergConnected = true;
                    FSBL.RouterClient.Transmit("BBG_ready", true);
                }
                catch (Exception err)
                {

                    FSBL.RouterClient.Transmit("BBG_ready", false);
                    FSBL.RPC("Logger.log", new List<JToken>
                    {
                        "Do you have your Bloomberg Terminal running and are you signed in? Trying again in 10 seconds"
                    });
                    Thread.Sleep(10000);
                }
            }
            try
            {
                FSBL.RouterClient.RemoveResponder("BBG_ready", true);
                FSBL.RouterClient.AddResponder("BBG_ready", (fsbl_sender, queryMessage) =>
                {
                    Console.WriteLine("Responded to BBG_ready query");
                    queryMessage.sendQueryMessage(true);
                });

            }
            catch (Exception err)
            {
                FSBL.RPC("Logger.error", new List<JToken>
                {
                    "Exception thrown: " + err.Message
                });
            }
            try
            {   // ! This is where all client specific functions are called so the FSBL router can set up the appropriate handlers
                FSBL.RouterClient.AddListener("BBG_symbol_list", (fsbl_sender, data) =>
                {
                    BBG_SymbolList(data);
                });

                FSBL.RouterClient.AddListener("BBG_run_function", (fsbl_sender, data) =>
                {
                    BBG_RunFunction(data);
                });

                FSBL.RouterClient.AddResponder("BBG_get_worksheets_of_user", (fsbl_sender, queryMessage) =>
                {
                    BBG_GetUserWorksheets(queryMessage);
                });

                FSBL.RouterClient.AddResponder("BBG_Get_Securities_From_Worksheet", (fsbl_sender, queryMessage) =>
                {
                    BBG_GetSecuritiesFromWorksheet(queryMessage);
                });

                FSBL.RouterClient.AddListener("BBG_create_worksheet", (fsbl_sender, data) =>
                {
                    BBG_CreateWorksheet(data);
                });
                FSBL.RouterClient.AddListener("BBG_run_DES_and_update_context", (fsbl_sender, data) =>
                {
                    BBG_RunDESAndUpdateContext(data);
                });
                FSBL.RouterClient.AddListener("BBG_update_context", (fsbl_sender, data) =>
                {
                    BBG_UpdateContext(data);
                });
                UpdateFinsembleWithNewContext();
            }
            catch (Exception err)
            {
                Console.WriteLine(err);
            }

        }

        /// <summary>
        /// Handles Finsemble shutdown event
        /// </summary>
        /// <param name="sender"></param>
        /// <param name="e"></param>
        // ! Client agnostic function
        public static void OnShutdown(object sender, EventArgs e)
        {
            if (FSBL != null)
            {
                lock (lockObj)
                {
                    if (FSBL != null)
                    {
                        try
                        {
                            Process[] processes = Process.GetProcessesByName("BloombergBridge");
                            if (processes.Length > 0)
                            {
                                for (int i = 0; i < processes.Length; i++)
                                {
                                    processes[i].Kill();
                                }
                            }
                            // Dispose of Finsemble.
                            FSBL.Dispose();
                        }
                        catch { }
                        finally
                        {
                            FSBL = null;
                            Environment.Exit(0);
                        }
                    }

                }
            }
            // Release main thread so application can exit.
            autoEvent.Set();

        }

        /// <summary>
        /// Function that fires when the Terminal Connect API disconnects.
        /// </summary>
        /// <remarks>This block should contain error handling code</remarks>
        /// <param name="sender"></param>
        /// <param name="e"></param>
        // ! Client agnostic function
        public static void BlpApi_Disconnected(object sender, EventArgs e)
        {
            // TODO: Add logic to wait for new BBG terminal instance to come online
            // ? should we just call OnConnected again?
            FSBL.RouterClient.Transmit("BBG_ready", false);
        }

        /// <summary>
        /// Adds Finsemble handlers to BlpTerminal.GroupEvent
        /// </summary>
        // ! Client agnostic function for context sharing
        public static void UpdateFinsembleWithNewContext()
        {
            BlpTerminal.GroupEvent += BlpTerminal_ComponentGroupEvent;
        }

        /// <summary>
        /// Function to update context based on FDC3 instrument. Instrument may be a ticker or fixed income asset.
        /// </summary>
        /// <param name="data">JSON containing a FDC3 instrument</param>
        // ! Client specific function
        public static void BBG_UpdateContext(FinsembleEventArgs data)
        {
            if (data.response != null)
            {
                List<string> groups = new List<string>();
                var response = data.response["data"];
                if (response.Type is JTokenType.String)
                {
                    response = JObject.Parse(response.Value<String>());
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
        /// <summary>
        /// Runs a DES command and updates BBG group context
        /// </summary>
        /// <remarks>This is an ag-grid specific function</remarks>
        /// <param name="data"></param>
        // ! Client specific and component specific function
        public static void BBG_RunDESAndUpdateContext(FinsembleEventArgs data)
        {
            // Specific AG-grid implementation on double-click
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

        /// <summary>
        /// Replaces securities on a given worksheet with given securities
        /// </summary>
        /// <param name="args">JSON object with a list of securities and a worksheet name</param>
        // ! Client specific function
        public static void BBG_SymbolList(FinsembleEventArgs args)
        {
            var response = args.response["data"];
            securities = new List<string>();
            if (response["securities"] != null)
            {
                foreach (string a in response["securities"])
                {
                    securities.Add(a + " Equity");
                }
                if (response["worksheet"] != null)
                {
                    // worksheet name should always be valid
                    var worksheetCast = response["worksheet"].ToString();
                    ReplaceSecuritiesOnWorksheet(securities, worksheetCast);
                }
                else
                {
                    // Finsemble sales demo default worksheet 
                    ReplaceSecuritiesOnWorksheet(securities, "Demo sheet");
                }
            }
        }

        /// <summary>
        /// Creates a BBG worksheet with the specified securities
        /// </summary>
        /// <param name="data"></param>
        // ! Client specific function
        public static void BBG_CreateWorksheet(FinsembleEventArgs data)
        {
            var response = data.response["data"];
            if (response != null)
            {
                var _securities = new List<string>();
                if (response["securities"] != null)
                {
                    foreach (string a in response["securities"])
                    {
                        _securities.Add(a + " Equity");
                    }
                    if (response["worksheet"] != null)
                    {
                        // worksheet name should always be valid
                        var worksheetCast = response["worksheet"].ToString();
                        BlpTerminal.CreateWorksheet(worksheetCast, _securities);
                    }
                }
            }
        }

        /// <summary>
        /// Transmits a list of securities from a specified worksheet on the "BBG_Get_Securities_From_Worksheet" channel
        /// </summary>
        /// <param name="queryMessage">Object that contains a field for "worksheet"</param>
        // ! Client specific function
        public static void BBG_GetSecuritiesFromWorksheet(FinsembleQueryArgs queryMessage)
        {
            var response = queryMessage.response["data"];
            var requestedWorksheet = response.Value<string>("worksheet");
            var allWorksheets = BlpTerminal.GetAllWorksheets();
            foreach (BlpWorksheet sheet in allWorksheets)
            {
                if (sheet.Name.Equals(requestedWorksheet))
                {
                    requestedWorksheet = sheet.Id;
                    break;
                }
            }
            var securities = BlpTerminal.GetWorksheet(requestedWorksheet).GetSecurities();
            JArray securitiesResponse = new JArray();
            JObject obj = new JObject();
            foreach (string a in securities)
            {
                securitiesResponse.Add(a);
            }
            obj.Add("securities", securitiesResponse);
            queryMessage.sendQueryMessage(obj);
        }

        /// <summary>
        /// Transmits a list of worksheets for the active Bloomberg user on the "BBG_get_worksheets_of_user" channel
        /// </summary>
        /// <param name="queryMessage"></param>
        // ! Client specific function
        public static void BBG_GetUserWorksheets(FinsembleQueryArgs queryMessage)
        {
            Console.WriteLine("Responded to BBG_get_worksheets_of_user query");
            var worksheets = BlpTerminal.GetAllWorksheets();
            JArray worksheetsResponse = new JArray();
            foreach (BlpWorksheet sheet in worksheets)
            {
                worksheetsResponse.Add(sheet.Name);
            }

            queryMessage.sendQueryMessage(worksheetsResponse);
        }

        /// <summary>
        /// Runs an arbitrary Bloomberg function
        /// </summary>
        /// <param name="data">
        /// Data that must have fields of: 
        /// mnemonic, symbol.
        /// Optional fields of:
        /// tails, panel
        /// </param>
        // ! Client specific function in regards to the default values
        public static void BBG_RunFunction(FinsembleEventArgs data)
        {
            var response = data.response["data"];
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
        /// <summary>
        /// Replaces securities on a BBG worksheet
        /// </summary>
        /// <param name="securities">List of securities</param>
        /// <param name="worksheetName">BBG worksheet name</param>
        // ! Client specific function
        public static void ReplaceSecuritiesOnWorksheet(IList<string> securities, string worksheetName)
        {
            var worksheets = BlpTerminal.GetAllWorksheets();
            foreach (BlpWorksheet sheet in worksheets)
            {
                if (sheet.Name == worksheetName)
                {
                    sheet.ReplaceSecurities(securities);
                    return;
                }
            }
        }

        /// <summary>
        /// Updates linked Finsemble components when BBG context changes
        /// </summary>
        /// <param name="sender"></param>
        /// <param name="e"></param>
        // ! Client specific function for setting up context sharing
        public static void BlpTerminal_ComponentGroupEvent(object sender, BlpGroupEventArgs e)
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
    }
}
