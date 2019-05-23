using Newtonsoft.Json;
using System.Collections.Generic;

namespace WindowlessCommander
{
    internal class OpenFIGIArrayResponse
    {
        [JsonProperty("data")]
        public List<OpenFIGIInstrument> Data { get; set; }
        [JsonProperty("error")]
        public string Error { get; set; }
    }
}