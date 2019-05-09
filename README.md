# fpe-bloomberg

## 1st Iteration
* WPF component that sends free form commands to Terminal Connect API
* Has a box for Command, Security, and Panel
* Since the Terminal API expects a Panel number (1-4, can be identified by Bloomberg window), this raises the first workflow question: **What terminal (panel) should receive context?**

## 2nd Iteration
* Windowless .NET component that receives a `Symbol` from some other linked component
* This windowless component then translates the `Symbol` to a string that the Bloomberg Terminal would understand
    * For example Tesla's ticker is `TSLA` but BLP expects `TSLA US Equity` (case-sensitive)
* To simplify scope: We will limit the Terminal command to `DES`, securities to `US Equity`, and panel to 1.
* Ideal outcome:
    1. News component links to windowless component
    2. User selects some article which has a `Symbol`
    3. Windowless component converts `Symbol` to Bloomberg format
    4. Windowless component composes the appropriate Terminal command
    5. This terminal command is sent to Panel 1 only
* Follow up questions:
    * What's the translation spec going to look like?
    * How are we going to infer the commands needed for BLP Terminal?
    * How do we determine which Terminal receives which command on the fly?