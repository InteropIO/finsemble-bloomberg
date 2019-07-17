using RestSharp;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BloombergBridge
{
    class OpenFIGIService
    {
        public static void Run(string[] args)
        {
            System.Net.ServicePointManager.SecurityProtocol = System.Net.SecurityProtocolType.Tls12;
            var client = new RestClient("https://api.openfigi.com/v2/search");
            var request = new RestRequest(Method.POST);
            request.RequestFormat = DataFormat.Json;
            request.AddHeader("X-OPENFIGI-APIKEY", "");
            request.AddHeader("Content-Type", "text/json");
            var searchQuery = new OpenFIGIRequest("MSFT");

            request.RequestFormat = DataFormat.Json;
            request.AddJsonBody(searchQuery);

            var response = client.Post<List<OpenFIGIArrayResponse>>(request);
            foreach(var dataInstrument in response.Data)
            {
                if(dataInstrument.Data != null && dataInstrument.Data.Any())
                {
                    foreach(var instrument in dataInstrument.Data)
                    {
                        Console.WriteLine(instrument.SecurityDescription);
                    }
                }
            }
        }
    }
}
