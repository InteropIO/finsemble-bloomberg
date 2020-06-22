[fpe-bloomberg](../README.md) › [Globals](../globals.md) › ["BloombergBridgeClient"](../modules/_bloombergbridgeclient_.md) › [BloombergBridgeClient](_bloombergbridgeclient_.bloombergbridgeclient.md)

# Class: BloombergBridgeClient

Client class for communicating with the Finsemble Bloomberg Bridge over the the Finsemble Router.

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

* [apiResponseHandler](_bloombergbridgeclient_.bloombergbridgeclient.md#apiresponsehandler)
* [checkConnection](_bloombergbridgeclient_.bloombergbridgeclient.md#checkconnection)
* [queryBloombergBridge](_bloombergbridgeclient_.bloombergbridgeclient.md#querybloombergbridge)
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

*Defined in [BloombergBridgeClient.ts:54](https://github.com/ChartIQ/fpe-bloomberg/blob/c322ffe/src/clients/BloombergBridgeClient/BloombergBridgeClient.ts#L54)*

BloombergBridgeClient constructor.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`routerClient?` | IRouterClient | An instance of the Finsemble router client to be used for all = communication. If not passed it will be retrieved from FSBL.Clients.RouterClient or an exception. |
`logger?` | ILogger | An instance of the Finsemble Logger to be used log messages. If not passed it will be retrieved from FSBL.Clients.Logger or an exception.  |

**Returns:** *[BloombergBridgeClient](_bloombergbridgeclient_.bloombergbridgeclient.md)*

## Properties

### `Private` connectionEventListener

• **connectionEventListener**: *[BBGConnectionEventListener](../interfaces/_bloombergbridgeclient_.bbgconnectioneventlistener.md)* = null

*Defined in [BloombergBridgeClient.ts:51](https://github.com/ChartIQ/fpe-bloomberg/blob/c322ffe/src/clients/BloombergBridgeClient/BloombergBridgeClient.ts#L51)*

___

### `Private` groupEventListener

• **groupEventListener**: *[BBGGroupEventListener](../interfaces/_bloombergbridgeclient_.bbggroupeventlistener.md)* = null

*Defined in [BloombergBridgeClient.ts:52](https://github.com/ChartIQ/fpe-bloomberg/blob/c322ffe/src/clients/BloombergBridgeClient/BloombergBridgeClient.ts#L52)*

___

### `Private` logger

• **logger**: *ILogger* = null

*Defined in [BloombergBridgeClient.ts:54](https://github.com/ChartIQ/fpe-bloomberg/blob/c322ffe/src/clients/BloombergBridgeClient/BloombergBridgeClient.ts#L54)*

___

### `Private` routerClient

• **routerClient**: *IRouterClient* = null

*Defined in [BloombergBridgeClient.ts:53](https://github.com/ChartIQ/fpe-bloomberg/blob/c322ffe/src/clients/BloombergBridgeClient/BloombergBridgeClient.ts#L53)*

## Methods

###  apiResponseHandler

▸ **apiResponseHandler**(`cb`: function): *(Anonymous function)*

*Defined in [BloombergBridgeClient.ts:210](https://github.com/ChartIQ/fpe-bloomberg/blob/c322ffe/src/clients/BloombergBridgeClient/BloombergBridgeClient.ts#L210)*

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

*Defined in [BloombergBridgeClient.ts:161](https://github.com/ChartIQ/fpe-bloomberg/blob/c322ffe/src/clients/BloombergBridgeClient/BloombergBridgeClient.ts#L161)*

Check that Bloomberg bridge is connected to the Bloomberg Terminal and that a user is
logged in.

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

###  queryBloombergBridge

▸ **queryBloombergBridge**(`message`: object, `cb`: function): *void*

*Defined in [BloombergBridgeClient.ts:195](https://github.com/ChartIQ/fpe-bloomberg/blob/c322ffe/src/clients/BloombergBridgeClient/BloombergBridgeClient.ts#L195)*

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

*Defined in [BloombergBridgeClient.ts:110](https://github.com/ChartIQ/fpe-bloomberg/blob/c322ffe/src/clients/BloombergBridgeClient/BloombergBridgeClient.ts#L110)*

Remove the current connection event handler.

**Returns:** *void*

___

###  removeGroupEventListener

▸ **removeGroupEventListener**(): *void*

*Defined in [BloombergBridgeClient.ts:146](https://github.com/ChartIQ/fpe-bloomberg/blob/c322ffe/src/clients/BloombergBridgeClient/BloombergBridgeClient.ts#L146)*

Remove the current group context changed event handler.

**Returns:** *void*

___

###  runBBGCommand

▸ **runBBGCommand**(`mnemonic`: string, `securities`: string[], `panel`: string, `tails`: string, `cb`: function): *void*

*Defined in [BloombergBridgeClient.ts:242](https://github.com/ChartIQ/fpe-bloomberg/blob/c322ffe/src/clients/BloombergBridgeClient/BloombergBridgeClient.ts#L242)*

Run a function in one of the 4 Bloomberg panel windows.

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

*Defined in [BloombergBridgeClient.ts:266](https://github.com/ChartIQ/fpe-bloomberg/blob/c322ffe/src/clients/BloombergBridgeClient/BloombergBridgeClient.ts#L266)*

Create a new worksheet with the specified securities and name.

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

*Defined in [BloombergBridgeClient.ts:339](https://github.com/ChartIQ/fpe-bloomberg/blob/c322ffe/src/clients/BloombergBridgeClient/BloombergBridgeClient.ts#L339)*

Gets a list of all available Launchpad component groups.

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

*Defined in [BloombergBridgeClient.ts:285](https://github.com/ChartIQ/fpe-bloomberg/blob/c322ffe/src/clients/BloombergBridgeClient/BloombergBridgeClient.ts#L285)*

Retrieve all worksheets for the user.

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

*Defined in [BloombergBridgeClient.ts:354](https://github.com/ChartIQ/fpe-bloomberg/blob/c322ffe/src/clients/BloombergBridgeClient/BloombergBridgeClient.ts#L354)*

Returns details of a Launchpad component group by name.

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

*Defined in [BloombergBridgeClient.ts:303](https://github.com/ChartIQ/fpe-bloomberg/blob/c322ffe/src/clients/BloombergBridgeClient/BloombergBridgeClient.ts#L303)*

Retrieve a specific worksheet by id.

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

*Defined in [BloombergBridgeClient.ts:321](https://github.com/ChartIQ/fpe-bloomberg/blob/c322ffe/src/clients/BloombergBridgeClient/BloombergBridgeClient.ts#L321)*

Replaces a specific worksheet by ID with a new list of securities.

**Parameters:**

▪ **worksheetId**: *string*

Worksheet ID to replace.

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

###  runSecurityLookup

▸ **runSecurityLookup**(`security`: string, `cb`: function): *void*

*Defined in [BloombergBridgeClient.ts:399](https://github.com/ChartIQ/fpe-bloomberg/blob/c322ffe/src/clients/BloombergBridgeClient/BloombergBridgeClient.ts#L399)*

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

*Defined in [BloombergBridgeClient.ts:375](https://github.com/ChartIQ/fpe-bloomberg/blob/c322ffe/src/clients/BloombergBridgeClient/BloombergBridgeClient.ts#L375)*

Set the context value of a Launchpad group by name.

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

*Defined in [BloombergBridgeClient.ts:89](https://github.com/ChartIQ/fpe-bloomberg/blob/c322ffe/src/clients/BloombergBridgeClient/BloombergBridgeClient.ts#L89)*

Set a handler function for connection events.

Note that only one handler function is permitted, hence calling
this multiple times will simply replace the existing handler.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`cb` | [BBGConnectionEventListener](../interfaces/_bloombergbridgeclient_.bbgconnectioneventlistener.md) | Callback  |

**Returns:** *void*

___

###  setGroupEventListener

▸ **setGroupEventListener**(`cb`: [BBGGroupEventListener](../interfaces/_bloombergbridgeclient_.bbggroupeventlistener.md)): *void*

*Defined in [BloombergBridgeClient.ts:127](https://github.com/ChartIQ/fpe-bloomberg/blob/c322ffe/src/clients/BloombergBridgeClient/BloombergBridgeClient.ts#L127)*

Set a handler function for Launchpad group context changed events.

Note that only one handler function is permitted, hence calling
this multiple times will simply replace the existing handler.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`cb` | [BBGGroupEventListener](../interfaces/_bloombergbridgeclient_.bbggroupeventlistener.md) | Handler function to call on group context change events  |

**Returns:** *void*
