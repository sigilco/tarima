import type { RemoteAuthFlow } from "./remote-auth.js";
import type { RemoteAuthCompletion, RemoteConnectionController } from "./remote-connection.js";
import type { SetupFlowRenderer } from "./setup-flow.js";
/** Offers consented deployment access repair after a remote startup challenge. */
export declare function prepareRemoteTuiAccess(input: {
    connection: RemoteConnectionController;
    renderer: SetupFlowRenderer;
    signal?: AbortSignal;
    runAuthFlow?: RemoteAuthFlow;
}): Promise<RemoteAuthCompletion | undefined>;
