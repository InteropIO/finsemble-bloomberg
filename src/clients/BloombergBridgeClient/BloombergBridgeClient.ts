import { IRouterClient, RouterMessage } from '@chartiq/finsemble/dist/types/clients/IRouterClient';
import { ILogger } from '@chartiq/finsemble/dist/types/clients/ILogger';

const CONNECTION_CHECK_TIMEOUT: number = 1000;
// tslint:disable:no-console

interface BBGConnectionEventListener {
    (
        err: (string | Error),
        response: RouterMessage<{ registered: boolean, loggedIn: boolean }>,
    ): void;
}


interface BBGGroupEventListener {
    (
        err: (string | Error),
        response: RouterMessage<{ group: BBGGroup, groups: BBGGroup[] }>,
    ): void;
}

/**
 * Interface representing a Bloomberg worksheet.
 * @param id The name of the worksheet (non-unique).
 * @param name The name of the worksheet assigned by the Bloomberg terminal and globally unique.
 * @param isActive the Worksheet's IsActive status.
 */
interface BBGWorksheet {
    id: string;
    name: string;
    isActive: boolean;
}

/**
 * @param {string} type The type of the group: security or monitor.
 * @param {string} name The name of the group assigned by the Bloomberg terminal, usually takes =
 * the form 'Group-A'.
 * @param {string} value the current value of the group.
 */
interface BBGGroup {
    type: string;
    name: string;
    value: string;
}

/**
 * Client class for communicating with the Finsemble Bloomberg Bridge over the the Finsemble Router.
 */
export default class BloombergBridgeClient {
    private connectionEventListener: BBGConnectionEventListener = null;
    private groupEventListener: BBGGroupEventListener = null;
    private routerClient: IRouterClient = null;
    private logger: ILogger = null;

    /**
     * BloombergBridgeClient constructor.
     * @param routerClient An instance of the Finsemble router client to be used for all =
     * communication. If not passed it will be retrieved from FSBL.Clients.RouterClient or
     * an exception.
     * @param logger An instance of the Finsemble Logger to be used log messages. If not
     * passed it will be retrieved from FSBL.Clients.Logger or an exception.
     */
    constructor(routerClient?: IRouterClient, logger?: ILogger) {
        if (routerClient) {
            this.routerClient = routerClient;
        } else if (FSBL){
            this.routerClient = FSBL.Clients.RouterClient;
        } else {
            throw new Error('No RouterClient was passed to the constructor and FSBL.Clients.RouterClient was not found!');
        }
        if (logger) {
            this.logger = logger;
        } else if (FSBL){
            this.logger = FSBL.Clients.Logger;
        } else {
            throw new Error('No Finsemble Logger client was passed to the constructor and FSBL.Clients.Logger was not found!');
        }
    }

    /**
     * Set a handler function for connection events.
     *
     * Note that only one handler function is permitted, hence calling
     * this multiple times will simply replace the existing handler.
     *
     * @param cb Callback
     */
    setConnectionEventListener(cb: BBGConnectionEventListener) {
        if (this.connectionEventListener) {
            this.removeConnectionEventListener();
        }

        console.log('Set new Listener for Bloomberg connection events...');
        this.connectionEventListener = (err, response) => {
            console.log('Received connection event... Response: ', response);
            if (err) {
                console.error('Received Bloomberg connection error: ', err);
            } else {
                console.log('Received Bloomberg connection event: ', response);
            }
            cb(err, response);
        };
        this.routerClient.addListener('BBG_connection_status', this.connectionEventListener);
    }

    /**
     * Remove the current connection event handler.
     */
    removeConnectionEventListener() {
        if (this.connectionEventListener) {
            this.routerClient.removeListener('BBG_connection_status', this.connectionEventListener);
            console.log('Removed connection event listener');
        } else {
            console.warn('Tried to remove non-existent connection event listener');
        }
    }


    /**
     * Set a handler function for Launchpad group context changed events.
     *
     * Note that only one handler function is permitted, hence calling
     * this multiple times will simply replace the existing handler.
     * @param cb Handler function to call on group context change events
     */
    setGroupEventListener(cb: BBGGroupEventListener) {
        if (this.groupEventListener) {
            this.removeGroupEventListener();
        }
        console.log('Set new listener for Bloomberg group context events...');
        this.groupEventListener = (err, response) => {
            if (err) {
                console.error('Received Bloomberg group context error: ', err);
            } else {
                console.log('Received Bloomberg group context event: ', response);
            }
            cb(err, response);
        };
        this.routerClient.addListener('BBG_group_context_events', this.groupEventListener);
    }

    /**
     * Remove the current group context changed event handler.
     */
    removeGroupEventListener() {
        if (this.groupEventListener) {
            this.routerClient.removeListener('BBG_group_context_events', this.groupEventListener);
            console.log('Removed group context event listener');
        } else {
            console.warn('Tried to remove non-existent group context event listener');
        }
    }

    /**
     * Check that Bloomberg bridge is connected to the Bloomberg Terminal and that a user is
     * logged in.
     * @param cb Callback for connection response that will return response as true if we are
     * connected and logged in.
     */
    checkConnection(cb: (err: string | CallbackError | Error, response: boolean) => void) {
        console.log('Checking connection status...');

        // if we don't get a response something is wrong
        const timeout = setTimeout(() => {
            console.log('BBG_connection_status check timed-out', null);
            cb('Connection check timeout', null);
        }, CONNECTION_CHECK_TIMEOUT);

        this.routerClient.query('BBG_connection_status', {}, (err: string | CallbackError | Error, resp: { data?: {loggedIn: boolean}}) => {
            clearTimeout(timeout);
            if (err) {
                console.warn('Received error when checking connection status: ', err);
                cb(err, false);
            } else {
                if (resp && resp.data && resp.data['loggedIn']) {
                    console.log('Received connection status: ', resp.data);
                    cb(null, true);
                } else {
                    console.log('Received negative or empty response when checking connection status: ', resp);
                    cb('Received negative or empty response when checking connection status', null);
                }
            }
        });
    }

    /**
     * Internal function used to send a Query to the BBG_run_terminal_function responder of
     * BloombergBridge,
     * which implements the majority functions for the BloombergBridgeClient.
     * @param message The query data to pass.
     * @param message.function Required field that determines which function to run.
     * @param cb Callback
     */
    queryBloombergBridge(
        message: { function: string },
        cb: (err: string | Error, response: { }) => void,
    ) {
        console.log('BBG_run_terminal_function query:', message);
        this.logger.log('BBG_run_terminal_function query:', message);
        this.routerClient.query('BBG_run_terminal_function', message, this.apiResponseHandler(cb));
    }

    /**
     * Internal function used to return a call back that will wrap the supplied callback and log all
     * responses
     * from the Bloomberg Bridge to aid debugging.
     * @param cb Callback
     */
    apiResponseHandler(cb: (err: string | Error, response: { status: boolean }) => void) {
        return (err: string | Error, response: { data: { status: boolean } }) => {
            if (err) {
                const errMsg = 'Error returned by BBG_run_terminal_function: ';
                console.error(errMsg, err);
                this.logger.error(errMsg, err);
                cb(err, null);
            } else if (!response || !response.data || !response.data.status) {
                const errMsg = 'Negative status returned by BBG_run_terminal_function: ';
                console.error(errMsg, response);
                this.logger.error(errMsg, response);
                cb('Command returned negative status', null);
            } else {
                const msg = 'BBG_run_terminal_function successful, response: ';
                // tslint:disable-next-line:no-magic-numbers
                console.log(msg + JSON.stringify(response.data, null, 2));
                this.logger.log(msg, response);
                cb(null, response.data);
            }
        };
    }

    /**
     * Run a function in one of the 4 Bloomberg panel windows.
     * @param mnemonic The mnemonic of the Bloomberg command to run on a panel
     * @param securities (optional) An array of strings representing one or more securities
     * to pass to the function.
     * @param panel Panel number to run the command on (accepts values "1", "2", "3" or
     * "4")
     * @param tails (optional) parameters passed to the function
     * @param cb Callback
     */
    runBBGCommand(
        mnemonic: string,
        securities: string[],
        panel: string,
        tails: string,
        cb: (err: string | Error, response: { status: boolean }) => void,
    ) {
        const message = {
            function: 'RunFunction',
            mnemonic,
            securities,
            tails,
            panel,
        };

        this.queryBloombergBridge(message, cb);
    }

    /**
     * Create a new worksheet with the specified securities and name.
     * @param worksheetName Name for the worksheet.
     * @param securities An array of strings representing one or more securities.
     * @param cb Callback
     */
    runCreateWorksheet(
        worksheetName: string,
        securities: string[],
        cb: (err: string | Error, response: { status: boolean, worksheet: BBGWorksheet }) => void,
    ) {
        const message = {
            function: 'CreateWorksheet',
            name: worksheetName,
            securities,
        };

        this.queryBloombergBridge(message, cb);
    }


    /**
     * Retrieve all worksheets for the user.
     * @param cb Callback
     */
    runGetAllWorksheets(
        cb: (
            err: string | Error,
            response: { status: boolean, worksheets: BBGWorksheet[] },
        ) => void,
    ) {
        const message = {
            function: 'GetAllWorksheets',
        };

        this.queryBloombergBridge(message, cb);
    }

    /**
     * Retrieve a specific worksheet by id.
     * @param worksheetId Worksheet ID to retrieve.
     * @param cb Callback
     */
    runGetWorksheet(
        worksheetId: string,
        cb: (err: string | Error, response: { status: boolean, worksheet: BBGWorksheet }) => void,
    ) {
        const message = {
            function: 'GetWorksheet',
            id: worksheetId,
        };

        this.queryBloombergBridge(message, cb);
    }

    /**
     * Replaces a specific worksheet by ID with a new list of securities.
     * @param worksheetId  Worksheet ID to replace.
     * @param securities An array of strings representing one or more securities.
     * @param cb Callback
     */
    runReplaceWorksheet(
        worksheetId: string,
        securities: string[],
        cb: (err: string | Error, response: { status: boolean, worksheet: BBGWorksheet }) => void,
    ) {
        const message = {
            function: 'ReplaceWorksheet',
            id: worksheetId,
            securities,
        };

        this.queryBloombergBridge(message, cb);
    }

    /**
     * Gets a list of all available Launchpad component groups.
     * @param cb Callback
     */
    runGetAllGroups(
        cb: (err: string | Error, response: { status: boolean, groups: BBGGroup[] }) => void,
    ) {
        const message = {
            function: 'GetAllGroups',
        };

        this.queryBloombergBridge(message, cb);
    }

    /**
     * Returns details of a Launchpad component group by name.
     * @param groupName The name of the component group to retrieve.
     * @param cb Callback
     */
    runGetGroupContext(
        groupName: string,
        cb: (err: string | Error, response: { status: boolean, group: BBGGroup }) => void,
    ) {
        const message = {
            function: 'GetGroupContext',
            name: groupName,
        };

        this.queryBloombergBridge(message, cb);
    }

    /**
     * Set the context value of a Launchpad group by name.
     * @param groupName The name of the component group to set the value of.
     * @param value The value to set for hte group, this will usually be a string
     * representing a security.
     * @param cookie (optional) Cookie value identifying a particular component within
     * a group to set the context of. Pass null if not required.
     * @param cb Callback
     */
    runSetGroupContext(
        groupName: string,
        value: string,
        cookie: string | null,
        cb: (err: string | Error, response: { status: boolean}) => void,
    ) {
        const message: {function: string, name: string, value: string, cookie?: string} = {
            function: 'SetGroupContext',
            name: groupName,
            value,
        };

        if (cookie) {
            message.cookie = cookie;
        }

        this.queryBloombergBridge(message, cb);
    }

    /**
     * 
     * @param security The string to lookup a security for
     * @param cb Callback
     */
    runSecurityLookup(
        security: string,
        cb: (err: string | Error,
            response: { status: boolean, results: [{name: string, type: string}] }) => void,
    ) {
        const message: { function: string, security: string } = {
            function: 'SecurityLookup',
            security,
        };

        this.queryBloombergBridge(message, cb);
    }
}
