[finsemble-bloomberg](../README.md) › [Globals](../globals.md) › ["BloombergBridgeClient"](../modules/_bloombergbridgeclient_.md) › [BBGWorksheet](_bloombergbridgeclient_.bbgworksheet.md)

# Interface: BBGWorksheet

Interface representing a Bloomberg worksheet.

## Hierarchy

* **BBGWorksheet**

## Index

### Properties

* [id](_bloombergbridgeclient_.bbgworksheet.md#id)
* [isActive](_bloombergbridgeclient_.bbgworksheet.md#isactive)
* [name](_bloombergbridgeclient_.bbgworksheet.md#name)
* [securities](_bloombergbridgeclient_.bbgworksheet.md#securities)

## Properties

###  id

• **id**: *string*

*Defined in [src/clients/BloombergBridgeClient/BloombergBridgeClient.ts:53](https://github.com/ChartIQ/finsemble-bloomberg/blob/310ed1f/src/clients/BloombergBridgeClient/BloombergBridgeClient.ts#L53)*

The name of the worksheet (non-unique).

___

###  isActive

• **isActive**: *boolean*

*Defined in [src/clients/BloombergBridgeClient/BloombergBridgeClient.ts:57](https://github.com/ChartIQ/finsemble-bloomberg/blob/310ed1f/src/clients/BloombergBridgeClient/BloombergBridgeClient.ts#L57)*

A flag indicating the Worksheet's IsActive status.

___

###  name

• **name**: *string*

*Defined in [src/clients/BloombergBridgeClient/BloombergBridgeClient.ts:55](https://github.com/ChartIQ/finsemble-bloomberg/blob/310ed1f/src/clients/BloombergBridgeClient/BloombergBridgeClient.ts#L55)*

The name of the worksheet assigned by the Bloomberg terminal and globally unique.

___

###  securities

• **securities**: *string[]*

*Defined in [src/clients/BloombergBridgeClient/BloombergBridgeClient.ts:59](https://github.com/ChartIQ/finsemble-bloomberg/blob/310ed1f/src/clients/BloombergBridgeClient/BloombergBridgeClient.ts#L59)*

The list of securities appearing in the worksheet.
