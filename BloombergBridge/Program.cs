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

		private static bool shutdown = false;
		private static bool isRegistered = false;
		private static bool isLoggedIn = false;


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
		/// Function that attempts to conect to the bloomberg terminal and then monitor the connection
		/// until told to shutdown. Cycles once per second.
		/// </summary>
		private static void connectionMonitorThread()
		{
			while (!shutdown)
			{
				bool statusChange = false;
				bool _isRegistered = false;
				bool _isLoggedIn = false;

				try
				{
					_isRegistered = BlpApi.IsRegistered;
				}
				catch (Exception err)
				{
					FSBL.RPC("Logger.error", new List<JToken>
					{
						"Bloomberg API registration check failed"
					});
				}
				if (!_isRegistered)
				{
					try
					{
						//try to register
						BlpApi.Register();
						BlpApi.Disconnected += new System.EventHandler(BlpApi_Disconnected);
						_isRegistered = BlpApi.IsRegistered;
					}
					catch (Exception err)
					{
						_isRegistered = false;
						FSBL.RPC("Logger.warn", new List<JToken>
						{
							"Bloomberg API registration failed"
						});
					}
				}
				if (_isRegistered)
				{
					try
					{
						_isLoggedIn = BlpTerminal.IsLoggedIn();
					}
					catch (Exception err)
					{
						_isLoggedIn = false;
						FSBL.RPC("Logger.error", new List<JToken>
						{
							"Bloomberg API isLoggedIn call failed"
						});
					}
				} else
				{
					//can't be logged in if not connected to the BlpApi
					_isLoggedIn = false;
				}
				if (_isRegistered != isRegistered || _isLoggedIn != isLoggedIn)
				{
					//status change
					isRegistered = _isRegistered;
					isLoggedIn = _isLoggedIn;
					statusChange = true;
				}
				if (statusChange)
				{
					JObject connectionStatus = new JObject();
					connectionStatus.Add("registered", isRegistered);
					connectionStatus.Add("loggedIn", isLoggedIn);
					FSBL.RouterClient.Transmit("BBG_connection_status", connectionStatus);
					FSBL.RPC("Logger.log", new List<JToken> { "Bloomberg connection status changed: ", connectionStatus });
				}
				Thread.Sleep(1000);
			}
			FSBL.RPC("Logger.log", new List<JToken>
			{
				"Bloomberg API connection monitor exiting"
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
		private static void OnConnected(object sender, EventArgs e)
		{
			FSBL.RPC("Logger.log", new List<JToken> { "Bloomberg bridge connected to Finsemble." });

			//start up connection monitor thread
			Thread thread = new Thread(new ThreadStart(connectionMonitorThread));
			thread.Start();

			//setup Router endpoints
			addResponders();
		}

		/// <summary>
		/// Handler for when the Bloomberg Bridge process is terminated.
		/// </summary>
		/// <param name="sender">Object</param>
		/// <param name="e">EventArgs</param>
		// ! Should be client agnostic
		private static void CurrentDomain_ProcessExit(object sender, EventArgs e)
        {
			shutdown = true;
			removeResponders();
		}

		/// <summary>
		/// Handles Finsemble shutdown event
		/// </summary>
		/// <param name="sender"></param>
		/// <param name="e"></param>
		// ! Client agnostic function
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

		private static void addResponders()
		{
			FSBL.RPC("Logger.log", new List<JToken> { "Setting up query responders" });
			try
			{   // ! This is where all client specific functions are called so the FSBL router can set up the appropriate handlers
				FSBL.RouterClient.AddResponder("BBG_connection_status", (fsbl_sender, queryMessage) =>
				{
					BBG_connection_status(queryMessage);
				});

				FSBL.RouterClient.AddResponder("BBG_run_terminal_function", (fsbl_sender, queryMessage) =>
				{
					BBG_run_terminal_function(queryMessage);
				});
				



				/*
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
				*/
			}
			catch (Exception err)
			{
				Console.WriteLine(err);
				FSBL.RPC("Logger.error", new List<JToken> { "Error occurred while setting up query responders: ", err.Message });
			}
		}
		
		private static void removeResponders()
		{
			FSBL.RPC("Logger.log", new List<JToken> { "Removing query responders" });
			FSBL.RouterClient.RemoveResponder("BBG_connection_status", true);
			FSBL.RouterClient.RemoveResponder("BBG_run_terminal_function", true);
		}

		/// <summary>
		/// Query responder to check if we are connected to the terminal and whether the user is logged in
		/// </summary>
		/// <param name="queryMessage"></param>
		private static void BBG_connection_status(FinsembleQueryArgs queryMessage)
		{
			JObject connectionStatus = new JObject();
			connectionStatus.Add("registered", isRegistered);
			connectionStatus.Add("loggedIn", isLoggedIn);
			queryMessage.sendQueryMessage(connectionStatus);

			Console.WriteLine("Responded to BBG_connection_status query: " + connectionStatus.ToString());
			FSBL.RPC("Logger.log", new List<JToken> { "Responded to BBG_connection_status query: ", connectionStatus });
		}


		/// <summary>
		/// Function that fires when the Terminal Connect API disconnects.
		/// </summary>
		/// <param name="sender"></param>
		/// <param name="e"></param>
		private static void BlpApi_Disconnected(object sender, EventArgs e)
        {
			//status change
			isRegistered = false;
			isLoggedIn = false;
			JObject connectionStatus = new JObject();
			connectionStatus.Add("registered", isRegistered);
			connectionStatus.Add("loggedIn", isLoggedIn);
			FSBL.RouterClient.Transmit("BBG_connection_status", connectionStatus);
			Console.WriteLine("Transmitted connection status after disconnect: " + connectionStatus.ToString());
			FSBL.RPC("Logger.log", new List<JToken> { "Transmitted connection status after disconnect: ", connectionStatus });
		}

		

		/// <summary>
		/// Query handler function that runs a specified terminal connect command and responds.
		/// </summary>
		/// <param name="queryMessage"></param>
		private static void BBG_run_terminal_function(FinsembleQueryArgs queryMessage)
		{
			JObject queryResponse = new JObject();
			JToken queryData = null;
			if (isRegistered && isLoggedIn)
			{
				//do the thing
				queryData = queryMessage.response?["data"];
				if (queryData != null)
				{
					string requestedFunction = queryData.Value<string>("function");

					try {
						switch (requestedFunction)
						{
							case "RunFunction":
								if (validateQueryData(requestedFunction, queryData, new string[] { "mnemonic", "panel" }, null, queryResponse))
								{
									string BBG_mnemonic = queryData.Value<string>("mnemonic");
									string panel = queryData.Value<string>("panel");
									string tails = null;
									List<string> securitiesList = new List<string>();
									if (queryData["tails"] != null)
									{
										tails = queryData.Value<string>("tails");
									}

									if (queryData["securities"] != null)
									{

										foreach (string a in queryData["securities"])
										{
											securitiesList.Add(a);
										}
									}
									if (securitiesList.Count > 0)
									{
										BlpTerminal.RunFunction(BBG_mnemonic, panel, securitiesList, tails);
										queryResponse.Add("status", true);
									}
									else
									{
										BlpTerminal.RunFunction(BBG_mnemonic, panel, tails);
										queryResponse.Add("status", true);
									}
								}

								break;
							case "CreateWorksheet":
								if (validateQueryData(requestedFunction, queryData, new string[] { "securities", "name" }, null, queryResponse))
								{
									var _securities = new List<string>();
									foreach (string a in queryData["securities"])
									{
										_securities.Add(a);
									}
									BlpWorksheet worksheet = BlpTerminal.CreateWorksheet(queryData["name"].ToString(), _securities);
									queryResponse.Add("status", true);
									queryResponse.Add("worksheet", renderWorksheet(worksheet, true));
								}
								break;

							case "GetWorksheet":
								if (validateQueryData(requestedFunction, queryData, null, new string[] { "name", "id" }, queryResponse))
								{
									string worksheetId = resolveWorksheetId(queryData, queryResponse);
									if (worksheetId != null)
									{
										BlpWorksheet worksheet = BlpTerminal.GetWorksheet(worksheetId);
										if (worksheet != null)
										{
											queryResponse.Add("status", true);
											queryResponse.Add("worksheet", renderWorksheet(worksheet, true));
										}
										else
										{
											queryResponse.Add("status", false);
											queryResponse.Add("message", "Worksheet with id '" + worksheetId + "' not found");
										}
									}
								}

								break;

							case "ReplaceWorksheet":
								if (validateQueryData(requestedFunction, queryData, new string[] { "securities" }, new string[] { "name", "id" }, queryResponse))
								{
									List<string> securities = new List<string>();
									foreach (string a in queryData["securities"])
									{
										securities.Add(a);
									}

									string worksheetId = resolveWorksheetId(queryData, queryResponse);
									if (worksheetId != null)
									{
										BlpWorksheet worksheet = BlpTerminal.GetWorksheet(worksheetId);
										if (worksheet != null)
										{
											worksheet.ReplaceSecurities(securities);
											queryResponse.Add("status", true);
											queryResponse.Add("worksheet", renderWorksheet(worksheet, true));
										}
										else
										{
											queryResponse.Add("status", false);
											queryResponse.Add("message", "Worksheet with id '" + worksheetId + "' not found");
										}
									}
								}

								break;

							case "AppendToWorksheet":
								if (validateQueryData(requestedFunction, queryData, new string[] { "securities" }, new string[] { "name", "id" }, queryResponse))
								{
									List<string> securities = new List<string>();
									foreach (string a in queryData["securities"])
									{
										securities.Add(a);
									}

									string worksheetId = resolveWorksheetId(queryData, queryResponse);
									if (worksheetId != null)
									{
										BlpWorksheet worksheet = BlpTerminal.GetWorksheet(worksheetId);
										if (worksheet != null)
										{
											worksheet.AppendSecurities(securities);
											queryResponse.Add("status", true);
											queryResponse.Add("worksheet", renderWorksheet(worksheet, true));
										}
										else
										{
											queryResponse.Add("status", false);
											queryResponse.Add("message", "Worksheet with id '" + worksheetId + "' not found");
										}
									}
								}

								break;

							case "GetAllWorksheets":
								var allWorksheets = BlpTerminal.GetAllWorksheets();
								JArray worksheets = new JArray();
								foreach (BlpWorksheet sheet in allWorksheets)
								{
									worksheets.Add(renderWorksheet(sheet, false));
								}
								queryResponse.Add("status", true);
								queryResponse.Add("worksheets", worksheets);

								break;

							case "GetAllGroups":
								var allGroups = BlpTerminal.GetAllGroups();
								JArray groups = new JArray();
								foreach (BlpGroup group in allGroups)
								{
									groups.Add(renderGroup(group));
								}
								queryResponse.Add("status", true);
								queryResponse.Add("groups", groups);

								break;

							case "GetGroupContext":
								if (validateQueryData(requestedFunction, queryData, new string[] { "name" }, null, queryResponse))
								{
									BlpGroup group = BlpTerminal.GetGroupContext(queryData["name"].ToString());
									queryResponse.Add("status", true);
									queryResponse.Add("group", renderGroup(group));
								}

								break;
							
							case "SetGroupContext":
								if (validateQueryData(requestedFunction, queryData, new string[] { "name", "value" }, null, queryResponse))
								{
									if (queryData["cookie"] != null)
									{
										BlpTerminal.SetGroupContext(queryData["name"].ToString(), queryData["value"].ToString(), queryData["cookie"].ToString());
									} else
									{
										BlpTerminal.SetGroupContext(queryData["name"].ToString(), queryData["value"].ToString());
									}
									
									queryResponse.Add("status", true);
								}

								break;
							case "GroupEvent":
								queryResponse.Add("status", false);
								queryResponse.Add("message", "function '" + requestedFunction + "' not implemented yet");


								break;
							case "CreateComponent":
								queryResponse.Add("status", false);
								queryResponse.Add("message", "function '" + requestedFunction + "' not implemented yet");

								break;

							case "DestroyAllComponents":
								queryResponse.Add("status", false);
								queryResponse.Add("message", "function '" + requestedFunction + "' not implemented yet");


								break;
							case "GetAvailableComponents":
								queryResponse.Add("status", false);
								queryResponse.Add("message", "function '" + requestedFunction + "' not implemented yet");


								break;
							case "":
							case null:
								queryResponse.Add("status", false);
								queryResponse.Add("message", "No function specified to run");
								break;
							default:
								queryResponse.Add("status", false);
								queryResponse.Add("message", "Unknown function '" + requestedFunction + "' specified");
								break;
						}

					}
					catch (Exception err)
					{
						queryResponse.Add("status", false);
						queryResponse.Add("message", "Exception occurred while running '" + requestedFunction + "', message: " + err.Message);
					}
				}
				else
				{
					queryResponse.Add("status", false);
					queryResponse.Add("message", "Invalid request: no query data");
				}
			}
			else if (!isRegistered)
			{
				queryResponse.Add("status", false);
				queryResponse.Add("message", "Not registed with the Bloomberg BlpApi");
			} else if (!isLoggedIn)
			{
				queryResponse.Add("status", false);
				queryResponse.Add("message", "Not Logged into Bloomberg terminal");
			}

			//return the response
			queryMessage.sendQueryMessage(queryResponse);
			Console.WriteLine("Responded to BBG_run_terminal_function query: " + queryResponse.ToString());
			FSBL.RPC("Logger.log", new List<JToken> { "Responded to BBG_run_terminal_function query: ", queryData, "Response: ", queryResponse });
		}


		//-----------------------------------------------------------------------
		//Private Utility functions
		private static bool validateQueryData(string function, JToken queryData, string[] allRequiredArgs, string[] anyRequiredArgs, JObject queryResponse)
		{
			if (allRequiredArgs != null)
			{
				foreach (string s in allRequiredArgs)
				{
					if (queryData[s] == null)
					{
						queryResponse.Add("status", false);
						queryResponse.Add("message", "function '" + function + "' requires argument '" + s + "' whic was not set");
						return false;
					}
				}
			}
			if (anyRequiredArgs != null)
			{
				foreach (string s in anyRequiredArgs)
				{
					if (queryData[s] != null)
					{
						return true;
					}
				}
				queryResponse.Add("status", false);
				queryResponse.Add("message", "function '" + function + "' requires at least one  of (" + string.Join(", ", anyRequiredArgs) + ") none of which were set");
				return false;
			}
			return true;
		}

		private static string resolveWorksheetId(JToken queryData, JObject queryResponse)
		{
			string worksheetId = null;
			if (queryData["id"] == null)
			{
				var worksheetName = queryData.Value<string>("name");
				var allWorksheets = BlpTerminal.GetAllWorksheets();
				foreach (BlpWorksheet sheet in allWorksheets)
				{
					if (sheet.Name.Equals(worksheetName))
					{
						worksheetId = sheet.Id;
						break;
					}
				}
				if (worksheetId == null)
				{
					queryResponse.Add("status", false);
					queryResponse.Add("message", "Worksheet '" + worksheetName + "' not found");
				}
			}
			else
			{
				worksheetId = queryData.Value<string>("id");
			}
			return worksheetId;
		}

		private static JObject renderWorksheet(BlpWorksheet worksheet)
		{
			return renderWorksheet(worksheet, false);
		}

		private static JObject renderWorksheet(BlpWorksheet worksheet, bool includeSecurities)
		{
			JObject worksheetObj = new JObject {
				{ "name", worksheet.Name },
				{ "id", worksheet.Id },
				{ "isActive", worksheet.IsActive }
			};

			if (includeSecurities)
			{
				var securities = worksheet.GetSecurities();
				JArray securitiesArr = new JArray();
				JObject obj = new JObject();
				foreach (string a in securities)
				{
					securitiesArr.Add(a);
				}
				worksheetObj.Add("securities", securitiesArr);
			}
			return worksheetObj;
		}

		private static JObject renderGroup(BlpGroup group)
		{
			JObject groupObj = new JObject
			{
				{  "name", group.Name },
				{ "type", group.Type },
				{ "value", group.Value }
			};
	
			return groupObj;
		}



















		//----------------------------------------------------------------------------
		//Old stuff to integrate into new implementation

		/// <summary>
		/// Adds Finsemble handlers to BlpTerminal.GroupEvent
		/// </summary>
		// ! Client agnostic function for context sharing
		private static void UpdateFinsembleWithNewContext()
        {
            BlpTerminal.GroupEvent += BlpTerminal_ComponentGroupEvent;
        }

        /// <summary>
        /// Function to update context based on FDC3 instrument. Instrument may be a ticker or fixed income asset.
        /// </summary>
        /// <param name="data">JSON containing a FDC3 instrument</param>
        // ! Client specific function
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
        /// Updates linked Finsemble components when BBG context changes
        /// </summary>
        /// <param name="sender"></param>
        /// <param name="e"></param>
        // ! Client specific function for setting up context sharing
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
    }
}
