using Bloomberglp.TerminalApiEx;
using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using ChartIQ.Finsemble;

namespace BloombergBridge
{   /// <summary>
    /// Represents some helpful snippets when implementing a Bloomberg integration
    /// </summary>
    public class Snippets
    {
        /// <summary>
        /// Example function for testing if a worksheet exists and creating it, if it does not exist
        /// </summary>
        /// <param name="securities">A list of securities to be passed into the newly created worksheet</param>
        public static void CreateBLPWorksheet(IList<string> securities)
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
        /// Example function to update a Bloomberg group's context
        /// </summary>
        /// <param name="groupName">The Bloomberg Group identifier ("Group-A")</param>
        /// <param name="security">A string representing an equity. E.g. "TSLA Equity"</param>
        public static void ChangeGroupSecurity(string groupName, string security)
        {
            BlpTerminal.SetGroupContext(groupName, security);
        }

        /// <summary>
        /// Example function to grab a list of securities from a preset worksheet
        /// </summary>
        public static void GrabTestSecurities()
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
        public static void GrabWorksheetSecurities(BlpWorksheet worksheet)
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
        /// <param name="worksheet">Bloomberg Worksheet object</param>
        /// <param name="securities">A list of securities</param>
        public static void AddSecurityToWorksheet(BlpWorksheet worksheet, IList<string> securities)
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
        /// <summary>
        /// Example function for running a DES command on a preset panel
        /// </summary>
        /// <param name="security">A security that DES will run against</param>
        public static void DefaultCommandMockEquity(string security)
        {
            string command = "DES";
            string panel = "1";
            security += " US Equity";
            var enumSecurity = new string[1] { security };
            BlpTerminal.RunFunction(command, panel, enumSecurity);
        }
        /// <summary>
        /// Example function for using the SECF functionality of a Bloomberg Terminal
        /// </summary>
        /// <param name="security">A security to search for</param>
        public static void DefaultCommandWithSecurityLookup(string security)
        {
            string BLP_security = SecurityLookup(security);
            string command = "DES";
            string panel = "1";
            var enumSecurity = new string[1] { security };
            BlpTerminal.RunFunction(command, panel, enumSecurity);
        }
        /// <summary>
        /// Helper function to parse the results of running the SECF API call
        /// </summary>
        /// <param name="security">A security to search for</param>
        /// <returns></returns>
        public static string SecurityLookup(string security)
        {
            var secFinder = new SecurityLookup();
            secFinder.Init();
            secFinder.Run(security);
            string BLP_security = secFinder.getSecurity();
            BLP_security = BLP_security.Replace('<', ' ').Replace('>', ' ');
            secFinder.Dispose();
            secFinder = null;
            return BLP_security;
        }
        /// <summary>
        /// Example function for replacing securities on a worksheet
        /// </summary>
        public static void ReplaceSecuritiesOnWorksheet()
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
        /// <summary>
        /// Example function for running some Bloomberg Terminal command with tails
        /// </summary>
        /// <param name="security">A security to run DES against</param>
        public static void DefaultCommandWithTails(string security)
        {
            string command = "DES";
            string panel = "2";
            security += " US Equity";
            var enumSecurity = new string[1] { security };
            BlpTerminal.RunFunction(command, panel, enumSecurity, "4");
        }
        /// <summary>
        /// Example function that shows a breadth of Bloomberg commands available for use
        /// </summary>
        /// <param name="response">A JSON object containing a security to be used for interal function calls</param>
        public static void RunBLPCommand(JToken response)
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
                //FSBL.RPC("Logger.error", new List<JToken>
                //{
                //    "Exception thrown: ", e.Message
                //});
            }

        }

    }
}
