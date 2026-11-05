import type { SandboxSession } from "eve/sandbox";
type PathSandbox = Pick<SandboxSession, "resolvePath">;
export declare function computerUsePaths(sandbox: PathSandbox): {
    root: string;
    driverRoot: string;
    driverSocket: string;
    latestScreenshot: string;
    managedBrowserRoot: string;
};
type LaunchAction = {
    action: "launch";
    app: "xterm";
    instance?: "primary" | "secondary";
} | {
    action: "launch";
    app: "firefox";
    url?: string;
};
type DriverAction = {
    action: string;
} & Record<string, unknown>;
interface ComputerUseDriverRequest {
    action: DriverAction;
    screenshotPath: string;
}
export declare function screenshotPath(sandbox: PathSandbox, path?: string): string;
export declare function recordingPath(sandbox: PathSandbox, path?: string): string;
export declare function computerUseDriverRequest(action: DriverAction, screenshot: string): ComputerUseDriverRequest;
export declare function computerUseDriverCommand(sandbox: PathSandbox): string;
export declare function computerUseDriverStartCommand(sandbox: PathSandbox): string;
/** Exit 0 only when the display, window manager, and driver are all live. */
export declare function computerUseReadyCommand(sandbox: PathSandbox): string;
export declare function computerUseDisplayCommand(sandbox: PathSandbox): string;
export declare function computerUseDesktopSizeCommand(sandbox: PathSandbox, size: "full_hd" | "large_16_9" | "social_16_9"): string;
export declare function computerUseLaunchCommand(sandbox: PathSandbox, action: LaunchAction): string;
export declare function computerUseFocusCommand(sandbox: PathSandbox, app: "firefox" | "xterm", instance?: "primary" | "secondary"): string;
export declare function computerUseWindowLayoutCommand(sandbox: PathSandbox, layout: "maximized" | "left" | "right", window?: string): string;
export {};
