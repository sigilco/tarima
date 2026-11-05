declare const _default: import("eve/tools").ToolDefinition<{
    request: {
        action: "type";
        text: string;
        typingDelayMs?: number | undefined;
        typingStyle?: "natural" | undefined;
    } | {
        action: "screenshot";
        path?: string | undefined;
    } | {
        action: "click";
        x: number;
        y: number;
        button: "back" | "forward" | "left" | "middle" | "right" | "wheel";
        keys?: string[] | undefined;
        durationMs?: number | undefined;
        movementStyle?: "natural" | "precision" | undefined;
    } | {
        action: "double_click";
        x: number;
        y: number;
        button: "back" | "forward" | "left" | "middle" | "right" | "wheel";
        keys?: string[] | undefined;
        durationMs?: number | undefined;
        movementStyle?: "natural" | "precision" | undefined;
    } | {
        action: "triple_click";
        x: number;
        y: number;
        button: "back" | "forward" | "left" | "middle" | "right" | "wheel";
        keys?: string[] | undefined;
        durationMs?: number | undefined;
        movementStyle?: "natural" | "precision" | undefined;
    } | {
        action: "drag";
        path: {
            x: number;
            y: number;
        }[];
        keys?: string[] | undefined;
        movementStyle?: "precision" | undefined;
        durationMs?: number | undefined;
    } | {
        action: "keypress";
        keys: string[];
    } | {
        action: "move";
        x: number;
        y: number;
        keys?: string[] | undefined;
        durationMs?: number | undefined;
        movementStyle?: "natural" | "precision" | undefined;
    } | {
        action: "scroll";
        x: number;
        y: number;
        scroll_x: number;
        scroll_y: number;
        keys?: string[] | undefined;
    } | {
        action: "clipboard_read";
        selection: "clipboard" | "primary";
    } | {
        action: "clipboard_write";
        selection: "clipboard" | "primary";
        text: string;
    } | {
        action: "wait";
        durationMs: number;
    } | {
        action: "record_start";
        path?: string | undefined;
    } | {
        action: "record_stop";
    } | {
        action: "sequence";
        actions: ({
            action: "type";
            text: string;
            typingDelayMs?: number | undefined;
            typingStyle?: "natural" | undefined;
        } | {
            action: "arrange_windows";
            windows: {
                selector: {
                    app: "firefox";
                } | {
                    app: "xterm";
                    instance: "primary" | "secondary";
                };
                region: {
                    x: number;
                    y: number;
                    width: number;
                    height: number;
                };
            }[];
            waitForMs: number;
        } | {
            action: "click";
            x: number;
            y: number;
            button: "back" | "forward" | "left" | "middle" | "right" | "wheel";
            durationMs?: number | undefined;
            movementStyle?: "natural" | "precision" | undefined;
        } | {
            action: "double_click";
            x: number;
            y: number;
            button: "back" | "forward" | "left" | "middle" | "right" | "wheel";
            durationMs?: number | undefined;
            movementStyle?: "natural" | "precision" | undefined;
        } | {
            action: "triple_click";
            x: number;
            y: number;
            button: "back" | "forward" | "left" | "middle" | "right" | "wheel";
            durationMs?: number | undefined;
            movementStyle?: "natural" | "precision" | undefined;
        } | {
            action: "drag";
            path: {
                x: number;
                y: number;
            }[];
            movementStyle?: "precision" | undefined;
            durationMs?: number | undefined;
        } | {
            action: "keypress";
            keys: string[];
        } | {
            action: "move";
            x: number;
            y: number;
            durationMs?: number | undefined;
            movementStyle?: "natural" | "precision" | undefined;
        } | {
            action: "wait";
            durationMs: number;
        } | {
            action: "record_start";
            path: string;
        } | {
            action: "record_stop";
        })[];
    } | {
        action: "arrange_windows";
        windows: {
            selector: {
                app: "firefox";
            } | {
                app: "xterm";
                instance: "primary" | "secondary";
            };
            region: {
                x: number;
                y: number;
                width: number;
                height: number;
            };
        }[];
        waitForMs: number;
    } | {
        action: "set_desktop_size";
        size: "full_hd" | "large_16_9" | "social_16_9";
    } | {
        action: "launch";
        app: "xterm";
        instance: "primary" | "secondary";
    } | {
        action: "focus";
        app: "firefox";
    } | {
        action: "focus";
        app: "xterm";
        instance: "primary" | "secondary";
    } | {
        action: "arrange_pair";
        pair: "terminal_browser" | "terminal_terminal";
        waitForMs: number;
    } | {
        action: "window_layout";
        app: "desktop";
        layout: "left" | "maximized" | "right";
    } | {
        action: "launch";
        app: "firefox";
        url?: string | undefined;
    };
}, {
    action: "arrange_pair" | "arrange_windows" | "click" | "clipboard_read" | "clipboard_write" | "double_click" | "drag" | "focus" | "keypress" | "launch" | "move" | "record_start" | "record_stop" | "screenshot" | "scroll" | "sequence" | "set_desktop_size" | "triple_click" | "type" | "wait" | "window_layout";
    result?: unknown;
    backend: "cua-driver";
    timings?: unknown;
    path: string | null;
    screenshot: string;
    state: string;
    version: "0.12.5";
}> & {
    execute(input: {
        request: {
            action: "type";
            text: string;
            typingDelayMs?: number | undefined;
            typingStyle?: "natural" | undefined;
        } | {
            action: "screenshot";
            path?: string | undefined;
        } | {
            action: "click";
            x: number;
            y: number;
            button: "back" | "forward" | "left" | "middle" | "right" | "wheel";
            keys?: string[] | undefined;
            durationMs?: number | undefined;
            movementStyle?: "natural" | "precision" | undefined;
        } | {
            action: "double_click";
            x: number;
            y: number;
            button: "back" | "forward" | "left" | "middle" | "right" | "wheel";
            keys?: string[] | undefined;
            durationMs?: number | undefined;
            movementStyle?: "natural" | "precision" | undefined;
        } | {
            action: "triple_click";
            x: number;
            y: number;
            button: "back" | "forward" | "left" | "middle" | "right" | "wheel";
            keys?: string[] | undefined;
            durationMs?: number | undefined;
            movementStyle?: "natural" | "precision" | undefined;
        } | {
            action: "drag";
            path: {
                x: number;
                y: number;
            }[];
            keys?: string[] | undefined;
            movementStyle?: "precision" | undefined;
            durationMs?: number | undefined;
        } | {
            action: "keypress";
            keys: string[];
        } | {
            action: "move";
            x: number;
            y: number;
            keys?: string[] | undefined;
            durationMs?: number | undefined;
            movementStyle?: "natural" | "precision" | undefined;
        } | {
            action: "scroll";
            x: number;
            y: number;
            scroll_x: number;
            scroll_y: number;
            keys?: string[] | undefined;
        } | {
            action: "clipboard_read";
            selection: "clipboard" | "primary";
        } | {
            action: "clipboard_write";
            selection: "clipboard" | "primary";
            text: string;
        } | {
            action: "wait";
            durationMs: number;
        } | {
            action: "record_start";
            path?: string | undefined;
        } | {
            action: "record_stop";
        } | {
            action: "sequence";
            actions: ({
                action: "type";
                text: string;
                typingDelayMs?: number | undefined;
                typingStyle?: "natural" | undefined;
            } | {
                action: "arrange_windows";
                windows: {
                    selector: {
                        app: "firefox";
                    } | {
                        app: "xterm";
                        instance: "primary" | "secondary";
                    };
                    region: {
                        x: number;
                        y: number;
                        width: number;
                        height: number;
                    };
                }[];
                waitForMs: number;
            } | {
                action: "click";
                x: number;
                y: number;
                button: "back" | "forward" | "left" | "middle" | "right" | "wheel";
                durationMs?: number | undefined;
                movementStyle?: "natural" | "precision" | undefined;
            } | {
                action: "double_click";
                x: number;
                y: number;
                button: "back" | "forward" | "left" | "middle" | "right" | "wheel";
                durationMs?: number | undefined;
                movementStyle?: "natural" | "precision" | undefined;
            } | {
                action: "triple_click";
                x: number;
                y: number;
                button: "back" | "forward" | "left" | "middle" | "right" | "wheel";
                durationMs?: number | undefined;
                movementStyle?: "natural" | "precision" | undefined;
            } | {
                action: "drag";
                path: {
                    x: number;
                    y: number;
                }[];
                movementStyle?: "precision" | undefined;
                durationMs?: number | undefined;
            } | {
                action: "keypress";
                keys: string[];
            } | {
                action: "move";
                x: number;
                y: number;
                durationMs?: number | undefined;
                movementStyle?: "natural" | "precision" | undefined;
            } | {
                action: "wait";
                durationMs: number;
            } | {
                action: "record_start";
                path: string;
            } | {
                action: "record_stop";
            })[];
        } | {
            action: "arrange_windows";
            windows: {
                selector: {
                    app: "firefox";
                } | {
                    app: "xterm";
                    instance: "primary" | "secondary";
                };
                region: {
                    x: number;
                    y: number;
                    width: number;
                    height: number;
                };
            }[];
            waitForMs: number;
        } | {
            action: "set_desktop_size";
            size: "full_hd" | "large_16_9" | "social_16_9";
        } | {
            action: "launch";
            app: "xterm";
            instance: "primary" | "secondary";
        } | {
            action: "focus";
            app: "firefox";
        } | {
            action: "focus";
            app: "xterm";
            instance: "primary" | "secondary";
        } | {
            action: "arrange_pair";
            pair: "terminal_browser" | "terminal_terminal";
            waitForMs: number;
        } | {
            action: "window_layout";
            app: "desktop";
            layout: "left" | "maximized" | "right";
        } | {
            action: "launch";
            app: "firefox";
            url?: string | undefined;
        };
    }, ctx: import("eve/tools").ToolContext): Promise<{
        action: "arrange_pair" | "arrange_windows" | "click" | "clipboard_read" | "clipboard_write" | "double_click" | "drag" | "focus" | "keypress" | "launch" | "move" | "record_start" | "record_stop" | "screenshot" | "scroll" | "sequence" | "set_desktop_size" | "triple_click" | "type" | "wait" | "window_layout";
        result?: unknown;
        backend: "cua-driver";
        timings?: unknown;
        path: string | null;
        screenshot: string;
        state: string;
        version: "0.12.5";
    }>;
};
export default _default;
