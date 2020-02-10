# How to deliver this integration to your users

One approach is to host the completed integration on a server accessible to all your users.
Finsemble can be configured to launch this integration. As a consideration, each user would need their own Bloomberg Terminal license on the same machine as Finsemble.

1. Open *manifest-local.json*.
2. In this file, look for the `"finsemble"` key.
3. You will need to add two lines, one under the `"finsemble"` key and one under the `"importConfig"` key.
4. Under `"finsemble"` add:
```javascript
`"fpe-bloombergRoot": "the server address for the completed integration"`
```
5. Then under `"importConfig"` add:
```javascript
`"$fpe-bloombergRoot/config-examples.json"`
```

Your manifest after adding these lines should look something like the following:

```json
    ...
    ...
    ...
    "finsemble": {
        "applicationRoot": "http://localhost:3375",
        "moduleRoot": "$applicationRoot/finsemble",
        "servicesRoot": "$applicationRoot/finsemble/services",
        "notificationURL": "$applicationRoot/components/notification/notification.html",
        "fpe-bloombergRoot": "https://some-server/place-where-the-integration-is-hosted/",
        "importConfig": [
            "$applicationRoot/configs/application/config.json",
            "$fpe-bloombergRoot/config-examples.json"
        ],
        "IAC": {
            "serverAddress": "ws://127.0.0.1:3376"
        }
    ...
    ...
    ...
    }
```

These two lines will allow Finsemble to pull in the Finsemble-Bloomberg integration to your users' app launcher.

After updating the configuration, an administrator will need to package and release a new version of your smart desktop to your users. The Finsemble Seed Project has a NPM script for creating a Finsemble installer to hand off to users.
[Read more about creating installers and deploying your smart desktop here.](https://documentation.chartiq.com/finsemble/tutorial-deployingYourSmartDesktop.html)

**Note:** Alternatively, the Terminal Connect API supports remote authentication so theoretically a single desktop that has both Finsemble and Bloomberg could be used by multiple users. **@FPE: Not sure what this means or why it's important to call out here.**