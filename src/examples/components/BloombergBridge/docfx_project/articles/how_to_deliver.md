# How to deliver this integration to your users

One approach is to host the completed integration on a server accessible to all your users.
Then each instance of Finsemble can be configured to pull this integration into Finsemble automatically.
Additionally, each user would need their own Bloomberg Terminal license on the same machine as Finsemble.
However, the Terminal Connect API supports remote authentication so theoretically a single desktop that has both Finsemble and Bloomberg could be used by multiple users.

## Implementation details of delivering this integration to your users

The first approach, hosting a completed integration on a server accessible to all users, requires configuring the users' Finsemble to pull in this new integration.
In the `finsemble-seed`, you will need to modify the `manifest-local.json`.
In this file, look for the `"finsemble"` key.
You will need to add two lines, one under the `"finsemble"` key and one under the `"importConfig"` key.
Under `"finsemble"` add: `"fpe-bloombergRoot": "the server address for the completed integration"`.
Then under `"importConfig"` add: `"$fpe-bloombergRoot/config-examples.json"`.
These two lines will allow Finsemble to pull in the Bloomberg integration to your users' apps menu.

After updating the configuration, an administrator will need to package and release a new version of Finsemble to use.
The `finsemble-seed` a NPM script for creating a Finsemble installer to hand off to users.
This script is `npm run makeInstaller:prod`.
The installers also take advantage of Electron's updating functionality, where an administrator can push new versions of an application and users can choose when they want to update.
Some other applications that use this update functionality are Slack, Spotify, and VS Code.
To update this update feed location:

* Navigate to `finsemble-seed/configs/other/server-environment-startup.json`
* Change the `"updateUrl"` to the URL where an administrator would host the artifacts created by `npm run makeInstaller:prod`
