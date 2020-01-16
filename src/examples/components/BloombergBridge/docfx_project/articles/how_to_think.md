# How to think about this integration when starting an implementation
## Appropriate use cases
Only you know what you want to do with a Bloomberg and *x* integration.
However, we do have some sample use cases to spark visions:
* Running arbitrary commands in Bloomberg with arbitrary tails on arbitrary panels, using data from Finsemble components.
    * E.g. A chart in Finsemble displays a US equity. 
    When the ticker changes, this Bloomberg integration can send the updated ticker and a DES command to a panel of the Bloomberg Terminal.
    * E.g. A chart in Finsemble displays a US bond.
     When a user updates this bond, this Bloomberg integration can send this new bond with a TOMS command to a panel of the Bloomberg Terminal.
     This will allow a user to view the Trade Order Management System inside of Bloomberg.
* Two way data sync between Bloomberg LaunchPad components/groups and Finsemble components/groups.
    * E.g. A user has multiple charts and other components in Finsemble linked on the same color channel. Additionally, the user has multiple charts and other components in their LaunchPad environment.
    If the user changes their symbol/ticker context in either Finsemble or LaunchPad, the linked components in both environment will update accordingly.
    This cuts down on data duplication between applications and environments.
* Pulling data from Bloomberg using the BLPAPI (not Terminal Connect API) into Finsemble components.
    * E.g. A user can use the BLPAPI to search for a particular equity or bond, then this integration can send that data back into one or more Finsemble components.

