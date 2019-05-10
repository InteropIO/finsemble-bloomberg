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
            FSBL = new Finsemble(args, null);
            FSBL.Connected += OnConnected;
            FSBL.Disconnected += OnShutdown;
            FSBL.Connect();

            // Block main thread until worker is finished.
            autoEvent.WaitOne();
        }

        private static void OnConnected(object sender, EventArgs e)
        {
            
            FSBL.RPC("Logger.log", new List<JToken> { "Windowless example connected to Finsemble." });
            // Subscribe to Finsemble Linker Channels
            FSBL.LinkerClient.LinkToChannel("group1", null, (s, a) => { });
            BlpApi.Register();
            //FSBL.RPC("LinkerClient.subscribe", new List<JToken>(), (error, response) =>
            //{
            //    FSBL.RPC("Logger.log", new List<JToken>
            //    {
            //        "Here's the response", response
            //    });

            //    RunBLPCommand(response);
            //});
            try
            {
                FSBL.LinkerClient.Subscribe("symbol", (fsbl_sender, data) =>
                {
                    string symbol = (string)data.response["data"];
                    if (!_symbol.Equals(symbol))
                    {
                        RunBLPCommand(symbol);
                        _symbol = symbol;
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
            //string security = (string)response["data"];
            security += " US Equity";
            var enumSecurity = new string[1] { security };
            //List<string> test = security.Split(' ').ToList();
            string command = "DES";
            string panel = "1";
            FSBL.RPC("Logger.log", new List<JToken>
                {
                    "Here's the command:", command, panel, security
                });
            try
            {
                //BlpTerminal.RunFunction(command, panel, enumSecurity, null);
                BlpTerminal.BeginRunFunction(command, panel, enumSecurity, null, OnRunFunctionComplete, null);
            } catch (Exception e)
            {
                Console.WriteLine(e);
            }

            //throw new NotImplementedException();
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
                        }
                    }

                }
            }

            // Release main thread so application can exit.
            autoEvent.Set();
        }
    }
}

/*
 * 
            
 */
