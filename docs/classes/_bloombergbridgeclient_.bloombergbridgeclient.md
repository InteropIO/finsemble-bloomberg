[fpe-bloomberg](../README.md) › [Globals](../globals.md) › ["BloombergBridgeClient"](../modules/_bloombergbridgeclient_.md) › [BloombergBridgeClient](_bloombergbridgeclient_.bloombergbridgeclient.md)

# Class: BloombergBridgeClient

Client class for communicating with the Finsemble Bloomberg Bridge over the the Finsemble Router,
which in turn communicates with the Bloomberg Terminal via the Terminal Connect and BLP APIs.

This Class may either be imported into code and initialized by passing in an instance
of the Finsemble RouterClient and Logger (e.g. in Finsemble Custom Desktop Service) or
used as a preload to be applied to a component, where it will be automatically initialized
via instances of the RouterClient and Logger referenced from `FSBL.Clients`.

## Hierarchy

* **BloombergBridgeClient**

## Index

### Constructors

* [constructor](_bloombergbridgeclient_.bloombergbridgeclient.md#constructor)

### Properties

* [connectionEventListener](_bloombergbridgeclient_.bloombergbridgeclient.md#private-connectioneventlistener)
* [groupEventListener](_bloombergbridgeclient_.bloombergbridgeclient.md#private-groupeventlistener)
* [logger](_bloombergbridgeclient_.bloombergbridgeclient.md#private-logger)
* [routerClient](_bloombergbridgeclient_.bloombergbridgeclient.md#private-routerclient)

### Methods

* [apiResponseHandler](_bloombergbridgeclient_.bloombergbridgeclient.md#private-apiresponsehandler)
* [checkConnection](_bloombergbridgeclient_.bloombergbridgeclient.md#checkconnection)
* [queryBloombergBridge](_bloombergbridgeclient_.bloombergbridgeclient.md#private-querybloombergbridge)
* [removeConnectionEventListener](_bloombergbridgeclient_.bloombergbridgeclient.md#removeconnectioneventlistener)
* [removeGroupEventListener](_bloombergbridgeclient_.bloombergbridgeclient.md#removegroupeventlistener)
* [runBBGCommand](_bloombergbridgeclient_.bloombergbridgeclient.md#runbbgcommand)
* [runCreateWorksheet](_bloombergbridgeclient_.bloombergbridgeclient.md#runcreateworksheet)
* [runGetAllGroups](_bloombergbridgeclient_.bloombergbridgeclient.md#rungetallgroups)
* [runGetAllWorksheets](_bloombergbridgeclient_.bloombergbridgeclient.md#rungetallworksheets)
* [runGetGroupContext](_bloombergbridgeclient_.bloombergbridgeclient.md#rungetgroupcontext)
* [runGetWorksheet](_bloombergbridgeclient_.bloombergbridgeclient.md#rungetworksheet)
* [runReplaceWorksheet](_bloombergbridgeclient_.bloombergbridgeclient.md#runreplaceworksheet)
* [runSecurityLookup](_bloombergbridgeclient_.bloombergbridgeclient.md#runsecuritylookup)
* [runSetGroupContext](_bloombergbridgeclient_.bloombergbridgeclient.md#runsetgroupcontext)
* [setConnectionEventListener](_bloombergbridgeclient_.bloombergbridgeclient.md#setconnectioneventlistener)
* [setGroupEventListener](_bloombergbridgeclient_.bloombergbridgeclient.md#setgroupeventlistener)

## Constructors

###  constructor

\+ **new BloombergBridgeClient**(`routerClient?`: IRouterClient, `logger?`: ILogger): *[BloombergBridgeClient](_bloombergbridgeclient_.bloombergbridgeclient.md)*

*Defined in [BloombergBridgeClient.ts:80](https://github.com/ChartIQ/fpe-bloomberg/blob/8a46e97/src/clients/BloombergBridgeClient/BloombergBridgeClient.ts#L80)*

BloombergBridgeClient constructor.

**`example`** Instantiating the client in a Finsemble component:
```Javascript
let bbg = new BloombergBridgeClient(FSBL.Clients.RouterClient, FSBL.Clients.Logger);
```

Instantiating the client in a Finsemble service:
```Javascript
const Finsemble = require("@chartiq/finsemble");
Finsemble.Clients.Logger.start();
Finsemble.Clients.Logger.log("test Service starting up");
let bbg = new BloombergBridgeClient(Finsemble.Clients.RouterClient, Finsemble.Clients.Logger);
```

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`routerClient?` | IRouterClient | An instance of the Finsemble router client to be used for all = communication. If not passed it will be retrieved from FSBL.Clients.RouterClient or an exception. |
`logger?` | ILogger | An instance of the Finsemble Logger to be used log messages. If not passed it will be retrieved from FSBL.Clients.Logger or an exception. |

**Returns:** *[BloombergBridgeClient](_bloombergbridgeclient_.bloombergbridgeclient.md)*

## Properties

### `Private` connectionEventListener

• **connectionEventListener**: *[BBGConnectionEventListener](../interfaces/_bloombergbridgeclient_.bbgconnectioneventlistener.md)* = null

*Defined in [BloombergBridgeClient.ts:77](https://github.com/ChartIQ/fpe-bloomberg/blob/8a46e97/src/clients/BloombergBridgeClient/BloombergBridgeClient.ts#L77)*

___

### `Private` groupEventListener

• **groupEventListener**: *[BBGGroupEventListener](../interfaces/_bloombergbridgeclient_.bbggroupeventlistener.md)* = null

*Defined in [BloombergBridgeClient.ts:78](https://github.com/ChartIQ/fpe-bloomberg/blob/8a46e97/src/clients/BloombergBridgeClient/BloombergBridgeClient.ts#L78)*

___

### `Private` logger

• **logger**: *ILogger* = null

*Defined in [BloombergBridgeClient.ts:80](https://github.com/ChartIQ/fpe-bloomberg/blob/8a46e97/src/clients/BloombergBridgeClient/BloombergBridgeClient.ts#L80)*

___

### `Private` routerClient

• **routerClient**: *IRouterClient* = null

*Defined in [BloombergBridgeClient.ts:79](https://github.com/ChartIQ/fpe-bloomberg/blob/8a46e97/src/clients/BloombergBridgeClient/BloombergBridgeClient.ts#L79)*

## Methods

### `Private` apiResponseHandler

▸ **apiResponseHandler**(`cb`: function): *(Anonymous function)*

*Defined in [BloombergBridgeClient.ts:294](https://github.com/ChartIQ/fpe-bloomberg/blob/8a46e97/src/clients/BloombergBridgeClient/BloombergBridgeClient.ts#L294)*

Internal function used to return a call back that will wrap the supplied callback and log all
responses
from the Bloomberg Bridge to aid debugging.

**Parameters:**

▪ **cb**: *function*

Callback

▸ (`err`: string | Error, `response`: object): *void*

**Parameters:**

▪ **err**: *string | Error*

▪ **response**: *object*

Name | Type |
------ | ------ |
`status` | boolean |

**Returns:** *(Anonymous function)*

___

###  checkConnection

▸ **checkConnection**(`cb`: function): *void*

*Defined in [BloombergBridgeClient.ts:243](https://github.com/ChartIQ/fpe-bloomberg/blob/8a46e97/src/clients/BloombergBridgeClient/BloombergBridgeClient.ts#L243)*

Check that Bloomberg bridge is connected to the Bloomberg Terminal and that a user is
logged in.

**`example`** 
```Javascript
let checkConnectionHandler = (err, loggedIn) => {
    if (!err && loggedIn) {
        showConnectedIcon();
    } else {
        showDisconnectedIcon();
    }
};
bbg.checkConnection(checkConnectionHandler);
```

**Parameters:**

▪ **cb**: *function*

Callback for connection response that will return response as true if we are
connected and logged in.

▸ (`err`: string | CallbackError | Error, `response`: boolean): *void*

**Parameters:**

Name | Type |
------ | ------ |
`err` | string &#124; CallbackError &#124; Error |
`response` | boolean |

**Returns:** *void*

___

### `Private` queryBloombergBridge

▸ **queryBloombergBridge**(`message`: object, `cb`: function): *void*

*Defined in [BloombergBridgeClient.ts:278](https://github.com/ChartIQ/fpe-bloomberg/blob/8a46e97/src/clients/BloombergBridgeClient/BloombergBridgeClient.ts#L278)*

Internal function used to send a Query to the BBG_run_terminal_function responder of
BloombergBridge,
which implements the majority functions for the BloombergBridgeClient.

**Parameters:**

▪ **message**: *object*

The query data to pass.

Name | Type | Description |
------ | ------ | ------ |
`function` | string | Required field that determines which function to run. |

▪ **cb**: *function*

Callback

▸ (`err`: string | Error, `response`: object): *void*

**Parameters:**

Name | Type |
------ | ------ |
`err` | string &#124; Error |
`response` | object |

**Returns:** *void*

___

###  removeConnectionEventListener

▸ **removeConnectionEventListener**(): *void*

*Defined in [BloombergBridgeClient.ts:162](https://github.com/ChartIQ/fpe-bloomberg/blob/8a46e97/src/clients/BloombergBridgeClient/BloombergBridgeClient.ts#L162)*

Remove the current connection event handler.

**`example`** 
```Javascript
bbg.removeConnectionEventListener();
```

**Returns:** *void*

___

###  removeGroupEventListener

▸ **removeGroupEventListener**(): *void*

*Defined in [BloombergBridgeClient.ts:217](https://github.com/ChartIQ/fpe-bloomberg/blob/8a46e97/src/clients/BloombergBridgeClient/BloombergBridgeClient.ts#L217)*

Remove the current group context changed event handler.

**`example`** 
```Javascript
bbg.removeGroupEventListener();
```

**Returns:** *void*

___

###  runBBGCommand

▸ **runBBGCommand**(`mnemonic`: string, `securities`: string[], `panel`: string, `tails`: string, `cb`: function): *void*

*Defined in [BloombergBridgeClient.ts:340](https://github.com/ChartIQ/fpe-bloomberg/blob/8a46e97/src/clients/BloombergBridgeClient/BloombergBridgeClient.ts#L340)*

Run a function in one of the 4 Bloomberg panel windows.

**`example`** 
```Javascript
let mnemonic = "DES";
let securities = ["MSFT US Equity"];
let panel = 3;
let tails = null;
bbg.runBBGCommand(mnemonic, securities, panel, tails, (err, response) => {
    if (!err) {
        console.log(`Ran command "${mnemonic}" on panel ${panel}`);
    } else {
        console.error("Error returned from runBBGCommand", err);
    }
});
```

**Parameters:**

▪ **mnemonic**: *string*

The mnemonic of the Bloomberg command to run on a panel

▪ **securities**: *string[]*

(optional) An array of strings representing one or more securities
to pass to the function.

▪ **panel**: *string*

Panel number to run the command on (accepts values "1", "2", "3" or
"4")

▪ **tails**: *string*

(optional) parameters passed to the function

▪ **cb**: *function*

Callback

▸ (`err`: string | Error, `response`: object): *void*

**Parameters:**

▪ **err**: *string | Error*

▪ **response**: *object*

Name | Type |
------ | ------ |
`status` | boolean |

**Returns:** *void*

___

###  runCreateWorksheet

▸ **runCreateWorksheet**(`worksheetName`: string, `securities`: string[], `cb`: function): *void*

*Defined in [BloombergBridgeClient.ts:382](https://github.com/ChartIQ/fpe-bloomberg/blob/8a46e97/src/clients/BloombergBridgeClient/BloombergBridgeClient.ts#L382)*

Create a new worksheet with the specified securities and name.

**`example`** 
```Javascript
let securities = ["TSLA US Equity", "AMZN US Equity"];
bbg.runCreateWorksheet(worksheetName, securities, (err, response) => {
    if (!err) {
        if (response && response.worksheet) {
            //Id assigned to the worksheet
            let worksheetId = response.worksheet.id;
            //List of securities resolved by Bloomberg from the input list, unresolvable securities will be removed
            let workSheetSecurities = response.worksheet.securities;
        } else {
            console.error("invalid response from runCreateWorksheet", response);
        }
    } else {
        console.error("Error returned from runCreateWorksheet", err);
    }
});
```

**Parameters:**

▪ **worksheetName**: *string*

Name for the worksheet.

▪ **securities**: *string[]*

An array of strings representing one or more securities.

▪ **cb**: *function*

Callback

▸ (`err`: string | Error, `response`: object): *void*

**Parameters:**

▪ **err**: *string | Error*

▪ **response**: *object*

Name | Type |
------ | ------ |
`status` | boolean |
`worksheet` | [BBGWorksheet](../interfaces/_bloombergbridgeclient_.bbgworksheet.md) |

**Returns:** *void*

___

###  runGetAllGroups

▸ **runGetAllGroups**(`cb`: function): *void*

*Defined in [BloombergBridgeClient.ts:528](https://github.com/ChartIQ/fpe-bloomberg/blob/8a46e97/src/clients/BloombergBridgeClient/BloombergBridgeClient.ts#L528)*

Gets a list of all available Launchpad component groups.

**`example`** 
```Javascript
bbg.runGetAllGroups((err, response) => {
    if (!err) {
        if (response && response.groups && Array.isArray(response.groups)) {
            //do something with the returned data
            response.groups.forEach(group => {
                let groupName = group.name;
                let groupType = group.type;
                let groupCurrentValue = group.value;
                ...
            });
        } else {
            console.error("Invalid response returned from runGetAllGroups", response);
        }
    } else {
        console.error("Error returned from runGetAllGroups", err);
    }
});
```

**Parameters:**

▪ **cb**: *function*

Callback

▸ (`err`: string | Error, `response`: object): *void*

**Parameters:**

▪ **err**: *string | Error*

▪ **response**: *object*

Name | Type |
------ | ------ |
`groups` | [BBGGroup](../interfaces/_bloombergbridgeclient_.bbggroup.md)[] |
`status` | boolean |

**Returns:** *void*

___

###  runGetAllWorksheets

▸ **runGetAllWorksheets**(`cb`: function): *void*

*Defined in [BloombergBridgeClient.ts:419](https://github.com/ChartIQ/fpe-bloomberg/blob/8a46e97/src/clients/BloombergBridgeClient/BloombergBridgeClient.ts#L419)*

Retrieve all worksheets for the user.

**`example`** 
```Javascript
bbg.runGetAllWorksheets((err, response) => {
    if (!err) {
        if (response && response.worksheets && Array.isArray(response.worksheets)) {
            response.worksheets.forEach(worksheet => {
                let worksheetName = worksheet.name;
                let worksheetId = worksheet.id;
                ...
            });
        } else {
            console.error("invalid response from runGetAllWorksheets", response);
        }
    } else {
        console.error("Error returned from runGetAllWorksheets", err);
    }
});
```

**Parameters:**

▪ **cb**: *function*

Callback

▸ (`err`: string | Error, `response`: object): *void*

**Parameters:**

▪ **err**: *string | Error*

▪ **response**: *object*

Name | Type |
------ | ------ |
`status` | boolean |
`worksheets` | [BBGWorksheet](../interfaces/_bloombergbridgeclient_.bbgworksheet.md)[] |

**Returns:** *void*

___

###  runGetGroupContext

▸ **runGetGroupContext**(`groupName`: string, `cb`: function): *void*

*Defined in [BloombergBridgeClient.ts:560](https://github.com/ChartIQ/fpe-bloomberg/blob/8a46e97/src/clients/BloombergBridgeClient/BloombergBridgeClient.ts#L560)*

Returns details of a Launchpad component group by name.

**`example`** 
```Javascript
bbg.runGetGroupContext(groupName, (err, response) => {
    if (!err) {
        if (response && response.group) {
            let groupName = response.group.name;
            let groupType = group.type;
            let groupCurrentValue = group.value;
            ...
        } else {
            console.error("Invalid response returned from runGetGroupContext", response);
        }
    } else {
        console.error("Error returned from runGetGroupContext", err);
    }
});
```

**Parameters:**

▪ **groupName**: *string*

The name of the component group to retrieve.

▪ **cb**: *function*

Callback

▸ (`err`: string | Error, `response`: object): *void*

**Parameters:**

▪ **err**: *string | Error*

▪ **response**: *object*

Name | Type |
------ | ------ |
`group` | [BBGGroup](../interfaces/_bloombergbridgeclient_.bbggroup.md) |
`status` | boolean |

**Returns:** *void*

___

###  runGetWorksheet

▸ **runGetWorksheet**(`worksheetId`: string, `cb`: function): *void*

*Defined in [BloombergBridgeClient.ts:454](https://github.com/ChartIQ/fpe-bloomberg/blob/8a46e97/src/clients/BloombergBridgeClient/BloombergBridgeClient.ts#L454)*

Retrieve a specific worksheet by id.

**`example`** 
```Javascript
bbg.runGetWorksheet(worksheetId, (err, response) => {
    if (!err) {
        if (response && response.worksheet && Array.isArray(response.worksheet.securities)) {
            let worksheetName = response.worksheet.name;
            let worksheetId = response.worksheet.id;
            let workSheetSecurities = response.worksheet.securities;
            ...
        } else {
            console.error("invalid response from runGetWorksheet");
        }
    } else {
        console.error("Error returned from runGetWorksheet", err);
    }
});
```

**Parameters:**

▪ **worksheetId**: *string*

Worksheet ID to retrieve.

▪ **cb**: *function*

Callback

▸ (`err`: string | Error, `response`: object): *void*

**Parameters:**

▪ **err**: *string | Error*

▪ **response**: *object*

Name | Type |
------ | ------ |
`status` | boolean |
`worksheet` | [BBGWorksheet](../interfaces/_bloombergbridgeclient_.bbgworksheet.md) |

**Returns:** *void*

___

###  runReplaceWorksheet

▸ **runReplaceWorksheet**(`worksheetId`: string, `securities`: string[], `cb`: function): *void*

*Defined in [BloombergBridgeClient.ts:490](https://github.com/ChartIQ/fpe-bloomberg/blob/8a46e97/src/clients/BloombergBridgeClient/BloombergBridgeClient.ts#L490)*

Replaces a specific worksheet by ID with a new list of securities.

**Parameters:**

▪ **worksheetId**: *string*

Worksheet ID to replace.

▪ **securities**: *string[]*

An array of strings representing one or more securities.

▪ **cb**: *function*

Callback
```Javascript
let securities = ["TSLA US Equity", "AMZN US Equity"];
bbg.runReplaceWorksheet(worksheetId, securities, (err, response) => {
    if (!err) {
        if (response && response.worksheet) {
            //Details of the updated worksheet will be returned
            let worksheetName = response.worksheet.name;
            //List of securities resolved by Bloomberg from the input list, unresolvable securities will be removed
            let workSheetSecurities = response.worksheet.securities;
            ...
        } else {
            console.error("invalid response from runReplaceWorksheet", response);
        }
    } else {
        console.error("Error returned from runReplaceWorksheet", err);
    }
});
```

▸ (`err`: string | Error, `response`: object): *void*

**Parameters:**

▪ **err**: *string | Error*

▪ **response**: *object*

Name | Type |
------ | ------ |
`status` | boolean |
`worksheet` | [BBGWorksheet](../interfaces/_bloombergbridgeclient_.bbgworksheet.md) |

**Returns:** *void*

___

###  runSecurityLookup

▸ **runSecurityLookup**(`security`: string, `cb`: function): *void*

*Defined in [BloombergBridgeClient.ts:638](https://github.com/ChartIQ/fpe-bloomberg/blob/8a46e97/src/clients/BloombergBridgeClient/BloombergBridgeClient.ts#L638)*

Search for Bloomberg securities via the Bloomberg Bridge and BLP API, which will return
results in around ~120-150ms and maybe used, for example, to power an autocomplete or
typeahead search.

**`example`** 
```Javascript
bbg.runSecurityLookup(security, (err, response) => {
    if (!err) {
	       if (response && response.results) {
            //do something with the results
            response.results.forEach(result => {
                console.log(result.name + " " + result.type);
                ...
            });
	       } else {
            console.error("invalid response from runSecurityLookup", response);
	       }
    } else {
	       console.error("Error returned from runSecurityLookup", err);
    }
});
```

**Parameters:**

▪ **security**: *string*

The string to lookup a security for

▪ **cb**: *function*

Callback

▸ (`err`: string | Error, `response`: object): *void*

**Parameters:**

▪ **err**: *string | Error*

▪ **response**: *object*

Name | Type |
------ | ------ |
`results` | [object] |
`status` | boolean |

**Returns:** *void*

___

###  runSetGroupContext

▸ **runSetGroupContext**(`groupName`: string, `value`: string, `cookie`: string | null, `cb`: function): *void*

*Defined in [BloombergBridgeClient.ts:594](https://github.com/ChartIQ/fpe-bloomberg/blob/8a46e97/src/clients/BloombergBridgeClient/BloombergBridgeClient.ts#L594)*

Set the context value of a Launchpad group by name.

**`example`** 
```Javascript
bbg.runSetGroupContext(groupName, newValue, null, (err, response) => {
    if (!err) {
	       // You may wish to retrieve the current state of Launchpad group here as Bloomberg
        // will resolve any security your set and may therefore its value may differ from
        // what you sent.
        bbg.runGetGroupContext(groupName, (err2, response2) => { ... });
    } else {
        console.error("Error returned from runSetGroupContext", err);
    }
});
```

**Parameters:**

▪ **groupName**: *string*

The name of the component group to set the value of.

▪ **value**: *string*

The value to set for hte group, this will usually be a string
representing a security.

▪ **cookie**: *string | null*

(optional) Cookie value identifying a particular component within
a group to set the context of. Pass null if not required.

▪ **cb**: *function*

Callback

▸ (`err`: string | Error, `response`: object): *void*

**Parameters:**

▪ **err**: *string | Error*

▪ **response**: *object*

Name | Type |
------ | ------ |
`status` | boolean |

**Returns:** *void*

___

###  setConnectionEventListener

▸ **setConnectionEventListener**(`cb`: [BBGConnectionEventListener](../interfaces/_bloombergbridgeclient_.bbgconnectioneventlistener.md)): *void*

*Defined in [BloombergBridgeClient.ts:138](https://github.com/ChartIQ/fpe-bloomberg/blob/8a46e97/src/clients/BloombergBridgeClient/BloombergBridgeClient.ts#L138)*

Set a handler function for connection events.

Note that only one handler function is permitted, hence calling
this multiple times will simply replace the existing handler.

**`example`** 
```Javascript
let connectionEventHandler = (err, resp) => {
    if (!err && resp && resp.loggedIn) {
        showConnectedIcon();
    } else {
        showDisconnectedIcon();
    }
};
bbg.setConnectionEventListener(connectionEventHandler);
```

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`cb` | [BBGConnectionEventListener](../interfaces/_bloombergbridgeclient_.bbgconnectioneventlistener.md) | Callback |

**Returns:** *void*

___

###  setGroupEventListener

▸ **setGroupEventListener**(`cb`: [BBGGroupEventListener](../interfaces/_bloombergbridgeclient_.bbggroupeventlistener.md)): *void*

*Defined in [BloombergBridgeClient.ts:194](https://github.com/ChartIQ/fpe-bloomberg/blob/8a46e97/src/clients/BloombergBridgeClient/BloombergBridgeClient.ts#L194)*

Set a handler function for Launchpad group context changed events, which
are fired when a group's context changes or a new group is created.

Note that only one handler function is permitted, hence calling
this multiple times will simply replace the existing handler.

**`example`** 
```Javascript
bbg.setGroupEventListener((err, response) => {
    if (!err) {
        if (response.data.group && response.data.group.type == "monitor") {
            console.log("Monitor event:\n" + JSON.stringify(response.data, null, 2));
        } else {
            console.log("Security event:\n" + JSON.stringify(response.data, null, 2));
        }
    } else {
            console.error("Error returned from setGroupEventListener", err);
    }
});
```

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`cb` | [BBGGroupEventListener](../interfaces/_bloombergbridgeclient_.bbggroupeventlistener.md) | Handler function to call on group context change events |

**Returns:** *void*
