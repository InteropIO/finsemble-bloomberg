using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using Newtonsoft.Json;
using System.Threading.Tasks;
using Newtonsoft.Json.Linq;

namespace BloombergBridge
{
    internal class AGGridRequest
    {
        public AGGridRequest(JToken args)
        {
            for (int i = 0; i < args.Count(); i++)
            {
                var test = args[i];
                Console.WriteLine(test["security"]);
                Securities.Add((string)args[i]["security"]);
            }
        }  
        public List<string> Securities { get; set; }
    }
}
