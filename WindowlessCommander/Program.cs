using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using Bloomberglp.Blpapi;
using Bloomberglp.TerminalApiEx;
using ChartIQ.Finsemble;
using Newtonsoft.Json.Linq;

namespace WindowlessCommander
{
    class Program
    {
        private static readonly AutoResetEvent autoEvent = new AutoResetEvent(false);
        private static readonly object lockObj = new object();
        private static string _symbol = "";
        private static SecurityLookup secFinder = null;

        private static Finsemble FSBL = null;
        static void Main(string[] args)
        {
#if DEBUG
            System.Diagnostics.Debugger.Launch();
#endif
            // Initialize Finsemble
            try
            {
                FSBL = new Finsemble(args, null);
                FSBL.Connected += OnConnected;
                FSBL.Disconnected += OnShutdown;
                FSBL.Connect();
            } catch (Exception err)
            {
                FSBL.RPC("Logger.error", new List<JToken>
               {
                   "Exception thrown: ", err.Message
               });
            }
            // Block main thread until worker is finished.
            autoEvent.WaitOne();
        }

        private static void OnConnected(object sender, EventArgs e)
        {
            
            FSBL.RPC("Logger.log", new List<JToken> { "Windowless example connected to Finsemble." });
            try
            {
                BlpApi.Register();
            } catch (Exception err)
            {
                FSBL.RPC("Logger.error", new List<JToken>
                {
                    "Exception thrown: ", err.Message
                });
                FSBL.RPC("Logger.error", new List<JToken>
                {
                    "Do you have your Bloomberg Terminal running and are you signed in?"
                });
            }
            try
            {
                UpdateFinsembleWithNewContext();
                /* TODO: Uncomment this when Bloomberg specific wiring is set up.
                    Currently there are no widgets that publish "BBG_symbol" so the following block will never execute.
                */

                //FSBL.RouterClient.AddListener("BBG_symbol", (fsbl_sender, data) =>
                //{
                //    string symbol = (string)data.response["data"];
                //    if (!_symbol.Equals(symbol))
                //    {
                //        RunBLPCommand(symbol);
                //        _symbol = symbol;
                //    }
                //});

                // These linker client methods are a workaround because the standard widgets don't publish to "symbol" via the Router
                // This will need to be adjusted in every Bloomberg component integration unfortunately.

                FSBL.LinkerClient.LinkToChannel("group1", null, (s, a) => { });
                FSBL.LinkerClient.Subscribe("symbol", (fsbl_sender, data) =>
                {
                    FSBL.RouterClient.Transmit("symbol", data.response["data"]);
                });

                FSBL.RouterClient.AddListener("symbol", (fsbl_sender, data) =>
                {

                    string symbol = (string)data.response["data"];
                    symbol = symbol.Trim();
                    if (!_symbol.Equals(symbol))
                    {
                        
                        FSBL.RPC("Logger.log", new List<JToken>
                        {
                            "Sending BLP command with symbol: ", symbol
                        });
                        RunBLPCommand(symbol);
                        _symbol = symbol;
                    } else
                    {
                        return;
                    }
                });
            } catch (Exception err)
            {
                Console.WriteLine(err);
            }

        }


        private static void CreateBLPWorksheet(IList<string> securities)
        {
            var allWorksheets = BlpTerminal.GetAllWorksheets();
            foreach(BlpWorksheet sheet in allWorksheets)
            {
                if (sheet.Name == "TestSheet1")
                {
                    Console.WriteLine("Sheet already exists, not creating");
                    return;
                }
            }
            var worksheet = BlpTerminal.CreateWorksheet("TestSheet1", securities);
            
        }

        private static void ChangeGroupSecurity(string groupName, string security)
        {
            BlpTerminal.SetGroupContext(groupName, security);
        }
        private static void GrabTestSecurities()
        {
            var allWorksheets = BlpTerminal.GetAllWorksheets();
            BlpWorksheet test;
            foreach(BlpWorksheet sheet in allWorksheets)
            {
                if (sheet.Name == "Test Sheet 2")
                {
                    test = sheet;
                    var securities = test.GetSecurities();
                    Console.WriteLine("Securities in Test Sheet 2");
                    foreach(string security in securities)
                    {
                        Console.WriteLine(security);
                    }
                    Console.WriteLine("End of Test Sheet 2 securities");
                }
            }
        }

        private static void GrabWorksheetSecurities(BlpWorksheet worksheet)
        {
            var securityList = worksheet.GetSecurities();
            Console.WriteLine("Securities in Worksheet: " + worksheet.Name);
            foreach(string security in securityList)
            {
                Console.WriteLine(security);
            }
            Console.WriteLine("End of worksheet: " + worksheet.Name);
        }

        private static void AddSecurityToWorksheet(BlpWorksheet worksheet, IList<string> securities)
        {
            var sheetSecurities = worksheet.GetSecurities();
            foreach(string sec in securities)
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
            string panel = "2";
            var enumSecurity = new string[1] { security };
            BlpTerminal.RunFunction(command, panel, enumSecurity);
        }

        private static void ReplaceSecuritiesOnWorksheet()
        {
            var worksheets = BlpTerminal.GetAllWorksheets();
            BlpWorksheet testSheet = null;
            BlpWorksheet replaceSheet = null;
            foreach(BlpWorksheet sheet in worksheets)
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
            {   // Just in case things went awry
                return;
            }
            GrabWorksheetSecurities(replaceSheet);
            var replaceSecurities = replaceSheet.GetSecurities();
            testSheet.ReplaceSecurities(replaceSecurities);

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

            foreach(BlpWorksheet sheet in allWorksheets)
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
                DefaultCommandMockEquity(security);

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
                    ChangeGroupSecurity(groups[0].Name, security);
                }

                /*
                 * Pass a security, create new worksheet (if it doesn't exist) with that security or securities
                 */
                CreateBLPWorksheet(enumSecurity);

                /*
                 * Replace worksheet securities with other securities
                 */
                ReplaceSecuritiesOnWorksheet();

                /*
                 * Grab test securities from "Test Sheet 2" for debugging purposes
                 */
                GrabTestSecurities();

                /*
                 * Add searched security to test worksheet
                 */
                AddSecurityToWorksheet(testWorksheet, enumSecurity);

                /*
                 * Run hardcoded command with preset tail
                 */
                DefaultCommandWithTails(security);

                /*
                 * Change Finsemble context based on launch pad context change
                 */
                //UpdateFinsembleWithNewContext();

            } catch (Exception e)
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
                Console.WriteLine("Component group event:" + context.GetType().FullName);
                string[] splitter = { "US Equity" };
                var tickerChangeArray = tickerChange.Split(splitter, StringSplitOptions.RemoveEmptyEntries);
                foreach(string a in tickerChangeArray)
                {
                    Console.WriteLine("BLP context changed to " + a);
                }
                var symbolToSend = tickerChangeArray[0];
                if (!_symbol.Equals(symbolToSend))
                {
                    _symbol = symbolToSend;
                    //FSBL.RouterClient.Transmit("symbol", _symbol);
                    JObject test = new JObject();
                    test.Add("dataType", "symbol");
                    test.Add("data", _symbol);
                    FSBL.LinkerClient.Publish(test);
                }

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
