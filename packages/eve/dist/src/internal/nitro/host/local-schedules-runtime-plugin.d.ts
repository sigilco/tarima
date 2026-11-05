export default function installLocalSchedulesRuntimePlugin(nitroApp: {
    readonly hooks: {
        hook(name: "close", handler: () => void): unknown;
    };
}): void;
