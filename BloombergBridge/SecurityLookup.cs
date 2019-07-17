using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Service = Bloomberglp.Blpapi.Service;
using Session = Bloomberglp.Blpapi.Session;
using Name = Bloomberglp.Blpapi.Name;
using Event = Bloomberglp.Blpapi.Event;
using Message = Bloomberglp.Blpapi.Message;
using Identity = Bloomberglp.Blpapi.Identity;
using Request = Bloomberglp.Blpapi.Request;
using Element = Bloomberglp.Blpapi.Element;
using EventHandler = Bloomberglp.Blpapi.EventHandler;
using SessionOptions = Bloomberglp.Blpapi.SessionOptions;
using CorrrelationID = Bloomberglp.Blpapi.CorrelationID;
using EventQueue = Bloomberglp.Blpapi.EventQueue;
using Bloomberglp.Blpapi;

namespace BloombergBridge
{
    internal class SecurityLookup
    {
        private static readonly Name SESSION_TERMINATED = Name.GetName("SessionTerminated");
        private static readonly Name SESSION_FAILURE = Name.GetName("SessionStartupFailure");
        private static readonly Name DESCRIPTION_ELEMENT = Name.GetName("description");
        private static readonly Name QUERY_ELEMENT = Name.GetName("query");
        private static readonly Name RESULTS_ELEMENT = Name.GetName("results");
        private static readonly Name MAX_RESULTS_ELEMENT = Name.GetName("maxResults");
        private static readonly Name SECURITY_ELEMENT = Name.GetName("security");

        private static readonly Name ERROR_RESPONSE = Name.GetName("ErrorResponse");
        private static readonly Name INSTRUMENT_LIST_RESPONSE =
            Name.GetName("InstrumentListResponse");
        private static readonly Name CURVE_LIST_RESPONSE = Name.GetName("CurveListResponse");
        private static readonly Name GOVT_LIST_RESPONSE = Name.GetName("GovtListResponse");

        private static readonly Name INSTRUMENT_LIST_REQUEST =
            Name.GetName("instrumentListRequest");
        private static readonly Name CURVE_LIST_REQUEST = Name.GetName("curveListRequest");
        private static readonly Name GOVT_LIST_REQUEST = Name.GetName("govtListRequest");

        private static readonly string INSTRUMENT_SERVICE = "//blp/instruments";
        private static readonly string DEFAULT_HOST = "localhost";
        private static readonly int DEFAULT_PORT = 8194;
        private static readonly string DEFAULT_QUERY_STRING = "IBM";
        private static readonly int DEFAULT_MAX_RESULTS = 10;

        private static readonly Name AUTHORIZATION_SUCCESS = Name.GetName("AuthorizationSuccess");
        private static readonly Name TOKEN_SUCCESS = Name.GetName("TokenGenerationSuccess");
        private static readonly Name TOKEN_ELEMENT = Name.GetName("token");

        private static readonly string AUTH_USER = "AuthenticationType=OS_LOGON";
        private static readonly string AUTH_APP_PREFIX =
                "AuthenticationMode=APPLICATION_ONLY;"
                + "ApplicationAuthenticationType=APPNAME_AND_KEY;ApplicationName=";
        private static readonly string AUTH_USER_APP_PREFIX =
                "AuthenticationMode=USER_AND_APPLICATION;AuthenticationType=OS_LOGON;"
                + "ApplicationAuthenticationType=APPNAME_AND_KEY;ApplicationName=";
        private static readonly string AUTH_DIR_PREFIX =
                "AuthenticationType=DIRECTORY_SERVICE;DirSvcPropertyName=";

        private static readonly string AUTH_OPTION_NONE = "none";
        private static readonly string AUTH_OPTION_USER = "user";
        private static readonly string AUTH_OPTION_APP = "app=";
        private static readonly string AUTH_OPTION_USER_APP = "userapp=";
        private static readonly string AUTH_OPTION_DIR = "dir=";
        private static readonly string AUTH_SERVICE = "//blp/apiauth";

        private static readonly TimeSpan WAIT_TIME = TimeSpan.FromSeconds(10);

        private static readonly string[] FILTERS_INSTRUMENTS = {
            "yellowKeyFilter",
            "languageOverride"
        };

        private static readonly string[] FILTERS_GOVT = {
            "ticker",
            "partialMatch"
        };

        private static readonly string[] FILTERS_CURVE = {
            "countryCode",
            "currencyCode",
            "type",
            "subtype",
            "curveid",
            "bbgid"
        };

        private static readonly Name CURVE_ELEMENT = Name.GetName("curve");
        private static readonly Name[] CURVE_RESPONSE_ELEMENTS = {
            Name.GetName("country"),
            Name.GetName("currency"),
            Name.GetName("curveid"),
            Name.GetName("type"),
            Name.GetName("subtype"),
            Name.GetName("publisher"),
            Name.GetName("bbgid")
        };

        private static readonly Name PARSEKY_ELEMENT = Name.GetName("parseky");
        private static readonly Name NAME_ELEMENT = Name.GetName("name");
        private static readonly Name TICKER_ELEMENT = Name.GetName("ticker");

        private string d_queryString = DEFAULT_QUERY_STRING;
        private string d_host = DEFAULT_HOST;
        private Name d_requestType = INSTRUMENT_LIST_REQUEST;
        private int d_port = DEFAULT_PORT;
        private int d_maxResults = DEFAULT_MAX_RESULTS;
        private Dictionary<string, string> d_filters = new Dictionary<string, string>();
        private string d_authOptions;
        private string BLP_ticker;

        private Session session;
        private Identity identity;

        // Authorize should be called before any requests are sent.
        public static void Authorize(out Identity identity, Session session)
        {
            identity = session.CreateIdentity();
            if (!session.OpenService(AUTH_SERVICE))
            {
                throw new Exception(
                    string.Format("Failed to open auth service: {0}",
                    AUTH_SERVICE));
            }
            Service authService = session.GetService(AUTH_SERVICE);

            EventQueue tokenEventQueue = new EventQueue();
            session.GenerateToken(new CorrelationID(tokenEventQueue), tokenEventQueue);
            string token = null;
            // Generate token responses will come on the dedicated queue. There would be no other
            // messages on that queue.
            Event eventObj = tokenEventQueue.NextEvent(
                Convert.ToInt32(WAIT_TIME.TotalMilliseconds));

            if (eventObj.Type == Event.EventType.TOKEN_STATUS ||
                eventObj.Type == Event.EventType.REQUEST_STATUS)
            {
                foreach (Message msg in eventObj)
                {
                    System.Console.WriteLine(msg);
                    if (msg.MessageType == TOKEN_SUCCESS)
                    {
                        token = msg.GetElementAsString(TOKEN_ELEMENT);
                    }
                }
            }
            if (token == null)
            {
                throw new Exception("Failed to get token");
            }

            Request authRequest = authService.CreateAuthorizationRequest();
            authRequest.Set(TOKEN_ELEMENT, token);

            session.SendAuthorizationRequest(authRequest, identity, null);

            TimeSpan ts = WAIT_TIME;
            for (DateTime startTime = DateTime.UtcNow;
                ts.TotalMilliseconds > 0;
                ts = ts - (DateTime.UtcNow - startTime))
            {
                eventObj = session.NextEvent(Convert.ToInt32(ts.TotalMilliseconds));
                // Since no other requests were sent using the session queue, the response can
                // only be for the Authorization request
                if (eventObj.Type != Event.EventType.RESPONSE
                    && eventObj.Type != Event.EventType.PARTIAL_RESPONSE
                    && eventObj.Type != Event.EventType.REQUEST_STATUS)
                {
                    continue;
                }

                foreach (Message msg in eventObj)
                {
                    System.Console.WriteLine(msg);
                    if (msg.MessageType != AUTHORIZATION_SUCCESS)
                    {
                        throw new Exception("Authorization Failed");
                    }
                }
                return;
            }
            throw new Exception("Authorization Failed");
        }

        private void ProcessInstrumentListResponse(Message msg)
        {
            Element results = msg.GetElement(RESULTS_ELEMENT);
            BLP_ticker = results.GetValueAsElement(0).GetElementAsString(SECURITY_ELEMENT);
        }

        private void ProcessCurveListResponse(Message msg)
        {
            Element results = msg.GetElement(RESULTS_ELEMENT);
            int numResults = results.NumValues;
            Console.WriteLine("Processing " + numResults + " results:");
            for (int i = 0; i < numResults; ++i)
            {
                Element result = results.GetValueAsElement(i);
                StringBuilder sb = new StringBuilder();
                foreach (Name n in CURVE_RESPONSE_ELEMENTS)
                {
                    if (sb.Length != 0)
                    {
                        sb.Append(" ");
                    }
                    sb.Append(n).Append("=").Append(result.GetElementAsString(n));
                }
                Console.WriteLine(
                        "\t{0} {1} - {2} '{3}'",
                        i + 1,
                        result.GetElementAsString(CURVE_ELEMENT),
                        result.GetElementAsString(DESCRIPTION_ELEMENT),
                        sb.ToString());
            }
        }

        private void ProcessGovtListResponse(Message msg)
        {
            Element results = msg.GetElement(RESULTS_ELEMENT);
            int numResults = results.NumValues;
            Console.WriteLine("Processing " + numResults + " results:");
            for (int i = 0; i < numResults; ++i)
            {
                Element result = results.GetValueAsElement(i);
                Console.WriteLine(
                        "\t{0} {1}, {2} - {3}",
                        i + 1,
                        result.GetElementAsString(PARSEKY_ELEMENT),
                        result.GetElementAsString(NAME_ELEMENT),
                        result.GetElementAsString(TICKER_ELEMENT));
            }
        }

        private void ProcessResponseEvent(Event eventObj)
        {
            foreach (Message msg in eventObj)
            {
                if (msg.MessageType == ERROR_RESPONSE)
                {
                    String description = msg.GetElementAsString(DESCRIPTION_ELEMENT);
                    Console.WriteLine("Received error: " + description);
                }
                else if (msg.MessageType == INSTRUMENT_LIST_RESPONSE)
                {
                    ProcessInstrumentListResponse(msg);
                }
                else if (msg.MessageType == CURVE_LIST_RESPONSE)
                {
                    ProcessCurveListResponse(msg);
                }
                else if (msg.MessageType == GOVT_LIST_RESPONSE)
                {
                    ProcessGovtListResponse(msg);
                }
                else
                {
                    Console.Error.WriteLine("Unknown MessageType received");
                }
            }
        }

        private void EventLoop(Session session)
        {
            bool done = false;
            while (!done)
            {
                Event eventObj = session.NextEvent();
                if (eventObj.Type == Event.EventType.PARTIAL_RESPONSE)
                {
                    System.Console.WriteLine("Processing Partial Response");
                    ProcessResponseEvent(eventObj);
                }
                else if (eventObj.Type == Event.EventType.RESPONSE)
                {
                    System.Console.WriteLine("Processing Response");
                    ProcessResponseEvent(eventObj);
                    done = true;
                }
                else
                {
                    foreach (Message msg in eventObj)
                    {
                        System.Console.WriteLine(msg);
                        if (eventObj.Type == Event.EventType.SESSION_STATUS)
                        {
                            if (msg.MessageType.Equals(SESSION_TERMINATED)
                                    || msg.MessageType.Equals(SESSION_FAILURE))
                            {
                                done = true;
                            }
                        }
                    }
                }
            }
        }

        private void SendRequest(Session session, Identity identity)
        {
            Console.WriteLine("Sending Request: {0}", d_requestType.ToString());
            Service instrumentService = session.GetService(INSTRUMENT_SERVICE);
            Request request;
            try
            {
                request = instrumentService.CreateRequest(d_requestType.ToString());
            }
            catch (NotFoundException e)
            {
                throw new Exception(
                    string.Format("Request Type not found: {0}", d_requestType),
                    e);
            }
            request.Set(QUERY_ELEMENT, d_queryString);
            request.Set(MAX_RESULTS_ELEMENT, d_maxResults);

            foreach (KeyValuePair<string, string> entry in d_filters)
            {
                try
                {
                    request.Set(entry.Key, entry.Value);
                }
                catch (NotFoundException e)
                {
                    throw new Exception(string.Format("Filter not found: {0}", entry.Key), e);
                }
                catch (InvalidConversionException e)
                {
                    throw new Exception(
                        string.Format(
                            "Invalid value: {0} for filter: {1}",
                            entry.Value,
                            entry.Key),
                        e);
                }
            }
            request.Print(Console.Out);
            Console.WriteLine();
            session.SendRequest(request, identity, null);
        }

        public void Run(string ticker)
        {
            d_queryString = ticker;
            SendRequest(session, identity);
            EventLoop(session);
        }
        public string getSecurity()
        {
            return BLP_ticker;
        }
        public void Init()
        {
            try
            {
                SessionOptions sessionOptions = new SessionOptions();
                sessionOptions.ServerHost = d_host;
                sessionOptions.ServerPort = d_port;
                sessionOptions.AuthenticationOptions = d_authOptions;
                Console.WriteLine("Connecting to {0}:{1}", d_host, d_port);
                session = new Session(sessionOptions);
                if (!session.Start())
                {
                    throw new Exception("Failed to start session");
                }
                identity = null;
                if (d_authOptions != null)
                {
                    Authorize(out identity, session);
                }
                if (!session.OpenService(INSTRUMENT_SERVICE))
                {
                    throw new Exception(
                        string.Format("Failed to open: {0}", INSTRUMENT_SERVICE));
                }
            }
            catch (Exception e)
            {
                Console.WriteLine(string.Format("Exception: {0}", e.Message));
                Console.WriteLine();
            }
        }
        public void Dispose()
        {
            session.Stop();
            session = null;
        }

    }
}
