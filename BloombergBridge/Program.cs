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
using Newtonsoft.Json.Linq;

namespace BloombergBridge
{
    class Program
    {
        private static readonly AutoResetEvent autoEvent = new AutoResetEvent(false);
        private static readonly object lockObj = new object();
        private static string _symbol = "";
        private static SecurityLookup secFinder = null;

        private static Finsemble FSBL = null;
        private static List<string> securities = null;

        static bool exitSystem = false;

        [DllImport("Kernel32")]
        private static extern bool SetConsoleCtrlHandler(EventHandler handler, bool add);
        private delegate bool EventHandler(CtrlType sig);
        static EventHandler _handler;

        enum CtrlType
        {
            CTRL_C_EVENT = 0,
            CTRL_BREAK_EVENT = 1,
            CTRL_CLOSE_EVENT = 2,
            CTRL_LOGOFF_EVENT = 5,
            CTRL_SHUTDOWN_EVENT = 6
        }
        private static bool Handler(CtrlType sig)
        {
            FSBL.RouterClient.RemoveResponder("BBG_ready");
            FSBL.RouterClient.RemoveListener("BBG_symbol", (fsbl_sender, response) =>
            {
                Console.WriteLine(response);
            });
            FSBL.RouterClient.RemoveListener("BBG_des_symbol", (fsbl_sender, response) =>
            {
                Console.WriteLine(response);
            });

            //allow main to run off
            exitSystem = true;

            //shutdown right away so there are no lingering threads
            Environment.Exit(-1);

            return true;
        }


        static void Main(string[] args)
        {
#if DEBUG
            System.Diagnostics.Debugger.Launch();
#endif
            lock (lockObj)
            {
                _handler += new EventHandler(Handler);
                AppDomain.CurrentDomain.ProcessExit += new System.EventHandler(CurrentDomain_ProcessExit);
                Process[] processes = Process.GetProcessesByName("BloombergBridge");
                if (processes.Length > 1)
                {
                    processes[0].Close();
                    //processes[0].Kill();
                }
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
        /// Handles when the middleware exits.
        /// </summary>
        /// <param name="sender"></param>
        /// <param name="e"></param>
        private static void CurrentDomain_ProcessExit(object sender, EventArgs e)
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
        /// Function that fires when this component successfully connects to Finsemble.
        /// In our case, we want to check if the Bloomberg Terminal Connect API is available to be used
        /// </summary>
        /// <param name="sender"></param>
        /// <param name="e"></param>
        private static void OnConnected(object sender, EventArgs e)
        {
            FSBL.RPC("Logger.log", new List<JToken> { "Windowless example connected to Finsemble." });

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
            {   
                FSBL.RouterClient.AddListener("BBG_symbol_list", (fsbl_sender, data) =>
                {
                    var response = data.response["data"];

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
                            ReplaceSecuritiesOnWorksheet(securities,worksheetCast);
                        }
                        else
                        {
                            // Finsemble sales demo default worksheet 
                            ReplaceSecuritiesOnWorksheet(securities, "Demo sheet");
                        }
                    }
                });
                /// <summary>
                /// Runs an arbitrary Bloomberg function
                /// </summary>
                /// <param name="fsbl_sender"></param>
                /// <param name="data">
                /// Data that must have fields of: 
                /// mnemonic, symbol
                /// Optional fields of:
                /// tails, panel
                /// </param>
                FSBL.RouterClient.AddListener("BBG_run_function", (fsbl_sender, data) =>
                {
                    var response = data.response["data"];
                    if (response["mnemonic"] != null && response["symbol"] != null)
                    {
                        var BBG_mnemonic = response.Value<string>("mnemonic");
                        var symbol = response.Value<string>("symbol");
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
                });
                // Populates worksheet selection modal
                // Returns worksheet name
                // TODO: Update channel name cause semantics
                // Get_Worksheets_of_user or something
                FSBL.RouterClient.AddResponder("BBG_worksheets", (fsbl_sender, queryMessage) =>
                {
                    Console.WriteLine("Responded to BBG_worksheets query");
                    var worksheets = BlpTerminal.GetAllWorksheets();
                    JArray worksheetsResponse = new JArray();
                    foreach (BlpWorksheet sheet in worksheets)
                    {
                        worksheetsResponse.Add(sheet.Name);
                    }
                    
                    queryMessage.sendQueryMessage(worksheetsResponse);
                });
                // TODO: Update name of channel to more semantic meaning
                // Get_Securities_From_BBG_Worksheet or something
                FSBL.RouterClient.AddResponder("BBG_worksheet_request", (fsbl_sender, queryMessage) =>
                {
                    var response = queryMessage.response["data"];
                    var requestedWorksheet = response.Value<string>("worksheet");
                    var allWorksheets = BlpTerminal.GetAllWorksheets();
                    foreach(BlpWorksheet sheet in allWorksheets)
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
                    foreach(string a in securities)
                    {
                        securitiesResponse.Add(a);
                    }
                    obj.Add("securities", securitiesResponse);
                    queryMessage.sendQueryMessage(obj);
                });
                // TODO: Update channel name cause semantics
                // Create_BBG_Worksheet ?
                FSBL.RouterClient.AddListener("BBG_create_worksheet", (fsbl_sender, data) =>
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
                });
                // TODO: update channel name
                // Execute_DES_and_update_context ?
                FSBL.RouterClient.AddListener("BBG_des_symbol", (fsbl_sender, data) =>
                {
                    // Specific AG-grid implementation on double-click
                    var response = data.response["data"];
                    var symbol = response.Value<string>("symbol");
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
                });
                UpdateFinsembleWithNewContext();
            }
            catch (Exception err)
            {
                Console.WriteLine(err);
            }

        }
        /// <summary>
        /// Function that fires when the Terminal Connect API disconnects.
        /// </summary>
        /// <remarks>This block should contain error handling code</remarks>
        /// <param name="sender"></param>
        /// <param name="e"></param>
        private static void BlpApi_Disconnected(object sender, EventArgs e)
        {
            FSBL.RouterClient.Transmit("BBG_ready", false);
        }

        private static void CreateBLPWorksheet(IList<string> securities)
        {
            var allWorksheets = BlpTerminal.GetAllWorksheets();
            foreach (BlpWorksheet sheet in allWorksheets)
            {
                if (sheet.Name == "TestSheet1")
                {
                    Console.WriteLine("Sheet already exists, not creating");
                    return;
                }
            }
            var worksheet = BlpTerminal.CreateWorksheet("TestSheet1", securities);

        }
        /// <summary>
        /// Helper function to update Bloomberg group(s) context
        /// </summary>
        /// <param name="groupName">The Bloomberg Group identifier ("Group-A")</param>
        /// <param name="security">Example: "TSLA Equity"</param>
        private static void ChangeGroupSecurity(string groupName, string security)
        {
            BlpTerminal.SetGroupContext(groupName, security);
        }
        /// <summary>
        /// Helper function to grab a list of securities from a preset worksheet
        /// </summary>
        private static void GrabTestSecurities()
        {
            var allWorksheets = BlpTerminal.GetAllWorksheets();
            BlpWorksheet test;
            foreach (BlpWorksheet sheet in allWorksheets)
            {
                if (sheet.Name == "Test Sheet 2")
                {
                    test = sheet;
                    var securities = test.GetSecurities();
                    Console.WriteLine("Securities in Test Sheet 2");
                    foreach (string security in securities)
                    {
                        Console.WriteLine(security);
                    }
                    Console.WriteLine("End of Test Sheet 2 securities");
                }
            }
        }
        /// <summary>
        /// Writes out a list of securities based on the worksheet parameter
        /// </summary>
        /// <param name="worksheet">Bloomberg Worksheet object</param>
        private static void GrabWorksheetSecurities(BlpWorksheet worksheet)
        {
            var securityList = worksheet.GetSecurities();
            Console.WriteLine("Securities in Worksheet: " + worksheet.Name);
            foreach (string security in securityList)
            {
                Console.WriteLine(security);
            }
            Console.WriteLine("End of worksheet: " + worksheet.Name);
        }
        /// <summary>
        /// Appends a list of securities to the parameter worksheet
        /// </summary>
        /// <param name="worksheet"></param>
        /// <param name="securities"></param>
        private static void AddSecurityToWorksheet(BlpWorksheet worksheet, IList<string> securities)
        {
            var sheetSecurities = worksheet.GetSecurities();
            foreach (string sec in securities)
            {
                if (!sheetSecurities.Contains(sec))
                {
                    worksheet.AppendSecurities(securities);
                }
            }
        }

        private static void DefaultCommandMockEquity(string security)
        {
            string command = "DES";
            string panel = "1";
            security += " US Equity";
            var enumSecurity = new string[1] { security };
            BlpTerminal.RunFunction(command, panel, enumSecurity);
        }

        private static void DefaultCommandWithSecurityLookup(string security)
        {
            string BLP_security = SecurityLookup(security);
            string command = "DES";
            string panel = "1";
            var enumSecurity = new string[1] { security };
            BlpTerminal.RunFunction(command, panel, enumSecurity);
        }

        private static void ReplaceSecuritiesOnWorksheet()
        {
            var worksheets = BlpTerminal.GetAllWorksheets();
            BlpWorksheet testSheet = null;
            BlpWorksheet replaceSheet = null;
            foreach (BlpWorksheet sheet in worksheets)
            {
                if (sheet.Name == "TestSheet1")
                {
                    testSheet = sheet;
                }
                if (sheet.Name == "Basic Last, Net")
                {
                    replaceSheet = sheet;
                }
            }
            if (testSheet == null || replaceSheet == null)
            {
                return;
            }
            //GrabWorksheetSecurities(replaceSheet);
            var replaceSecurities = replaceSheet.GetSecurities();
            testSheet.ReplaceSecurities(replaceSecurities);

        }
        private static void ReplaceSecuritiesOnWorksheet(IList<string> securities, string worksheetName)
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

        private static void DefaultCommandWithTails(string security)
        {
            string command = "DES";
            string panel = "2";
            security += " US Equity";
            var enumSecurity = new string[1] { security };
            BlpTerminal.RunFunction(command, panel, enumSecurity, "4");
        }

        private static void RunBLPCommand(JToken response)
        {
            JTokenReader reader = new JTokenReader(response);
            string security = (string)response;
            var testSecurity = security + " US Equity";
            var enumSecurity = new string[1] { testSecurity };
            var allWorksheets = BlpTerminal.GetAllWorksheets();
            BlpWorksheet testWorksheet = null;

            foreach (BlpWorksheet sheet in allWorksheets)
            {
                if (sheet.Name == "Test Sheet 2")
                {
                    testWorksheet = sheet;
                }
            }

            try
            {
                /*
                 * Send (hardcoded equity) command to terminal from finsemble component 
                 */
                //DefaultCommandMockEquity(security);

                /*
                 * Send (hardcoded) command to terminal from finsemble component but use
                 * BLP security lookup to get the correct format 
                 * (as opposed to us appending the instrument type)
                 */
                //DefaultCommandWithSecurityLookup(security);

                var groups = BlpTerminal.GetAllGroups();
                if (groups.Count > 0)
                {
                    /*
                     * Communicate with Launchpad groups (and linked components in those groups)
                     * and change linked security
                     */
                    //ChangeGroupSecurity(groups[0].Name, security);
                }

                /*
                 * Pass a security, create new worksheet (if it doesn't exist) with that security or securities
                 */
                //CreateBLPWorksheet(enumSecurity);

                /*
                 * Replace worksheet securities with other securities
                 */
                //ReplaceSecuritiesOnWorksheet();

                /*
                 * Grab test securities from "Test Sheet 2" for debugging purposes
                 */
                //GrabTestSecurities();

                /*
                 * Add searched security to test worksheet
                 */
                //AddSecurityToWorksheet(testWorksheet, enumSecurity);

                /*
                 * Run hardcoded command with preset tail
                 */
                //DefaultCommandWithTails(security);

                /*
                 * Change Finsemble context based on launch pad context change
                 */
                //UpdateFinsembleWithNewContext();

            }
            catch (Exception e)
            {
                Console.WriteLine(e);
                FSBL.RPC("Logger.error", new List<JToken>
                {
                    "Exception thrown: ", e.Message
                });
            }

        }

        private static void UpdateFinsembleWithNewContext()
        {
            BlpTerminal.GroupEvent += BlpTerminal_ComponentGroupEvent;
        }
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

                //FSBL.RouterClient.Transmit("symbol", symbolToSend.Trim());
                JObject test = new JObject
                {
                    { "dataType", "symbol" },
                    { "data", symbolToSend.Trim() }
                };
                FSBL.LinkerClient.PublishToChannel(context.Group.Name, test);
                //if (!_symbol.Equals(symbolToSend))
                //{
                //    //_symbol = symbolToSend;

                //    JObject test = new JObject();
                //    test.Add("dataType", "symbol");
                //    test.Add("data", _symbol);

                //    //FSBL.LinkerClient.Publish(test);
                //}

            }

        }

        private static string SecurityLookup(string security)
        {
            if (secFinder == null)
            {
                secFinder = new SecurityLookup();
                secFinder.Init();
            }
            secFinder.Run(security);
            string BLP_security = secFinder.getSecurity();
            BLP_security = BLP_security.Replace('<', ' ').Replace('>', ' ');
            secFinder.Dispose();
            secFinder = null;
            return BLP_security;
        }

        private static void OnRunFunctionComplete(IAsyncResult ar)
        {
            BlpTerminal.EndRunFunction(ar);
        }

        private static void OnShutdown(object sender, EventArgs e)
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


    }

}
