# How to think about this integration when starting an implementation
## Appropriate use cases
Only you know what you want to do with a Bloomberg and *x* integration.
However, we do have some sample use cases to spark inspiration:
* Running arbitrary commands in Bloomberg with arbitrary tails on arbitrary panels, using data from Finsemble components.
    * E.g. A chart in Finsemble displays an equity. 
    When the ticker changes, this Bloomberg integration can send the updated ticker and a DES command to a panel of the Bloomberg Terminal.
    * E.g. A chart in Finsemble displays a bond.
     When a user updates this bond, this Bloomberg integration can send this new bond with a TOMS command to a panel of the Bloomberg Terminal.
     This will allow a user to view and use the Trade Order Management System inside of Bloomberg.
    * E.g. A worksheet in Finsemble displays multiple bonds.
      A user select a bond from this worksheet and sends it to Bloomberg through this integration.
      The integration then sends a DES, YAS, QMGR, and TOMS command to each of the Bloomberg Terminal panels and/or LaunchPad components.
      Additionally, the integration could send separate tails on each of the previous Bloomberg functions to deliver the exact information a user needs. 
* Two way data sync between Bloomberg LaunchPad components/groups and Finsemble components/groups.
    * E.g. A user has multiple charts and other components in Finsemble linked on the same color channel. Additionally, the user has multiple charts and other components in their LaunchPad environment.
    If the user changes their symbol/ticker context in either Finsemble or LaunchPad, the linked components in both environment will update accordingly.
    This cuts down on data duplication between applications and environments.
* Pulling data from Bloomberg using the BLPAPI (not Terminal Connect API) into Finsemble components.
    * E.g. A user can use the BLPAPI to search for a particular equity or bond, then this integration can send that data back into one or more Finsemble components.

