# Documentation for the Finsemble-Bloomberg integration

**Open Questions @FPE**
* Why do the methods declare that they're "Example functions"? Are we only offering examples?
* From a business perspective, who has the Finsemble-Bloomberg integration? Is it free? Is it only available for uses of a particular package?
* To me, it feels as if there's an open question about where this documentation should live. If we could i-frame the API documentation, there's no reason it couldn't live on the documentation site as "real" documentation. ((Caveat: I don't know how to do that.)) At the very least, we should be able to link to this documentation from the main doc site. In this case, I'd need more familiarity with how docFX lays things out so I can tinker with things. In general, I'd like to reduce some sections and expand others.


**Notes to self**
* Need glossary of terms for Terminal Connect (TC), BLP API, Finsemble.dll
* Need explanation for what expected behavior of the integration is
* Make everything on one page (?)

The Finsemble Bloomberg integration utilizes the .NET API exposed by Bloomberg Terminal Connect, enabling data synchronicity between the Bloomberg Terminal and applications running in Finsemble.
* For more information on Terminal Connect, run `TMCT<GO>` in your terminal.
* For a brief video demonstration of the types of context sharing that are possible between Finsemble and Bloomberg, [check out our video on Wistia.](https://chartiq.wistia.com/medias/z77u5v8x2q)
* For additional support, please contact your ChartIQ Client Support specialist at <a href="mailto:support@finsemble.com">support@finsemble.com</a>.

## Quick Start Notes

1. Make sure you have the latest version of the [`fpe-bloomberg`](https://github.com/ChartIQ/fpe-bloomberg) integration
1. Make sure you have the Terminal Connect API SDK
    * Run `TMCT <GO>` in your Bloomberg Terminal for more information about this
1. Make sure your Finsemble environment is up to date
1. Refer to [Articles](articles/intro.md) or [API Documentation](xref:BloombergBridge)
