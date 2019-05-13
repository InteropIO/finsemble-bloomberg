using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
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
                FSBL.RPC("Logger.log", new List<JToken>
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
                FSBL.RPC("Logger.log", new List<JToken>
                {
                    "Exception thrown: ", err.Message
                });
                FSBL.RPC("Logger.log", new List<JToken>
                {
                    "Do you have your Bloomberg Terminal running and are you signed in to them?"
                });
            }
            try
            {   /* TODO: Uncomment this when Bloomberg specific wiring is set up.
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

        private static void RunBLPCommand(JToken response)
        {
            JTokenReader reader = new JTokenReader(response);
            string security = (string)response;
            security += " US Equity";
            var enumSecurity = new string[1] { security };
            string command = "DES";
            string panel = "1";
            FSBL.RPC("Logger.log", new List<JToken>
                {
                    "Here's the command:", command, panel, security
                });
            try
            {
                BlpTerminal.BeginRunFunction(command, panel, enumSecurity, null, OnRunFunctionComplete, null);
            } catch (Exception e)
            {
                Console.WriteLine(e);
            }

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
