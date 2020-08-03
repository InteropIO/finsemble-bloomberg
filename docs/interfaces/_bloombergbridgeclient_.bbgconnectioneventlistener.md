[finsemble-bloomberg](../README.md) › [Globals](../globals.md) › ["BloombergBridgeClient"](../modules/_bloombergbridgeclient_.md) › [BBGConnectionEventListener](_bloombergbridgeclient_.bbgconnectioneventlistener.md)

# Interface: BBGConnectionEventListener

Interface representing an event handler for connection events, which are fired
when the BloombergBridge connects or disconnects from the terminal.

## Hierarchy

* **BBGConnectionEventListener**

## Callable

▸ (`err`: string | Error, `response`: RouterMessage‹object›): *void*

*Defined in [BloombergBridgeClient.ts:13](https://github.com/ChartIQ/finsemble-bloomberg/blob/a77c7be/src/clients/BloombergBridgeClient/BloombergBridgeClient.ts#L13)*

Interface representing an event handler for connection events, which are fired
when the BloombergBridge connects or disconnects from the terminal.

**Parameters:**

Name | Type |
------ | ------ |
`err` | string &#124; Error |
`response` | RouterMessage‹object› |

**Returns:** *void*
