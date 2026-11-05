import { computed, onScopeDispose, shallowRef } from "vue";
import { z } from "#compiled/zod/index.js";
import "ai";
import { Validator } from "#compiled/@cfworker/json-schema/index.js";

// src/client/abort-signal.ts
function throwIfAborted(signal) {
	if (signal === void 0) return;
	const nativeThrowIfAborted = signal.throwIfAborted;
	if (typeof nativeThrowIfAborted === "function") {
		nativeThrowIfAborted.call(signal);
		return;
	}
	if (!signal.aborted) return;
	if (signal.reason !== void 0) throw signal.reason;
	const error = /* @__PURE__ */ new Error("The operation was aborted.");
	error.name = "AbortError";
	throw error;
}

// src/protocol/routes.ts
const EVE_ROUTE_PREFIX = "/eve/v1";
const EVE_HEALTH_ROUTE_PATH = `${EVE_ROUTE_PREFIX}/health`;
const EVE_INFO_ROUTE_PATH = `${EVE_ROUTE_PREFIX}/info`;
const EVE_SESSION_ROUTE_PATH = `${EVE_ROUTE_PREFIX}/session`;
function createEveDescendantStreamRoutePath(sessionId) {
	return `${EVE_SESSION_ROUTE_PATH}/${encodeURIComponent(sessionId)}/descendants/stream`;
}
function createEveSessionRoutePath(sessionId) {
	return `${EVE_SESSION_ROUTE_PATH}/${encodeURIComponent(sessionId)}`;
}
function createEveSessionCancelRoutePath(sessionId) {
	return `${EVE_SESSION_ROUTE_PATH}/${encodeURIComponent(sessionId)}/cancel`;
}
function createEveSessionCompactRoutePath(sessionId) {
	return `${EVE_SESSION_ROUTE_PATH}/${encodeURIComponent(sessionId)}/compact`;
}
function createEveSessionClearRoutePath(sessionId) {
	return `${EVE_SESSION_ROUTE_PATH}/${encodeURIComponent(sessionId)}/clear`;
}
function createEveSessionEndRoutePath(sessionId) {
	return `${EVE_SESSION_ROUTE_PATH}/${encodeURIComponent(sessionId)}/end`;
}
function createEveSessionStreamRoutePath(sessionId) {
	return `${EVE_SESSION_ROUTE_PATH}/${encodeURIComponent(sessionId)}/stream`;
}

// src/shared/eve-error.ts
const LINEAGE = Symbol.for("eve.error.lineage");
var EveError = class EveError extends Error {
	static errorName = "EveError";
	code;
	constructor(code, message, options) {
		super(message, options);
		if (new.target !== EveError && !Object.hasOwn(new.target, "errorName")) throw new TypeError(`${new.target.name} must declare its own static errorName.`);
		this.name = new.target.errorName;
		this.code = code;
		const lineage = [new.target.errorName];
		for (let type = new.target; type !== EveError;) {
			type = Object.getPrototypeOf(type);
			lineage.push(type.errorName);
		}
		Object.defineProperty(this, LINEAGE, { value: Object.freeze(lineage) });
	}
	static is(error) {
		if (typeof error !== "object" || error === null) return false;
		const lineage = Reflect.get(error, LINEAGE);
		return Array.isArray(lineage) && lineage.includes(this.errorName);
	}
};

// src/client/agent-info-error.ts
var AgentInfoResponseError = class extends EveError {
	static errorName = "AgentInfoResponseError";
	issues;
	constructor(issues = []) {
		const detail = issues.length === 0 ? "" : ` (${issues.join("; ")})`;
		super("invalid_agent_info_response", `The server returned an unrecognized response from the eve agent info route.${detail}`);
		this.issues = issues;
	}
};

// src/client/health-response-error.ts
var HealthResponseError = class extends EveError {
	static errorName = "HealthResponseError";
	issues;
	constructor(issues = []) {
		const detail = issues.length === 0 ? "" : ` (${issues.join("; ")})`;
		super("invalid_health_response", `The server returned an unrecognized eve health response.${detail}`);
		this.issues = issues;
	}
};

// src/client/health-schema.ts
const HealthResultSchema = z.object({
	ok: z.literal(true),
	status: z.literal("ready"),
	workflowId: z.string().min(1)
}).strict();

// src/internal/http/basic-auth.ts
function encodeBasicCredentials(username, password) {
	const bytes = new TextEncoder().encode(`${username}:${password}`);
	const binaryString = Array.from(bytes, (byte) => String.fromCodePoint(byte)).join("");
	return btoa(binaryString);
}

// src/shared/extension-mount.ts
const mountIdSchema = z.string().min(1);

// src/client/agent-info-schema.ts
const AGENT_INFO_VERSION = 5;
function openEnum(values) {
	return z.union([z.enum(values), z.string().transform(() => "unrecognized")]);
}
const owner = z.discriminatedUnion("kind", [
	z.object({ kind: z.literal("application") }),
	z.object({
		feature: z.string(),
		kind: z.literal("framework")
	}),
	z.object({
		kind: z.literal("extension"),
		mountId: mountIdSchema.optional(),
		namespace: z.string(),
		packageName: z.string()
	})
]);
const moduleBacking = z.discriminatedUnion("kind", [z.object({
	externalDependencies: z.array(z.string()),
	extensionScope: z.object({
		namespace: z.string(),
		sourceRoot: z.string()
	}).optional(),
	kind: z.literal("filesystem"),
	mountId: z.string().optional(),
	sourcePath: z.string()
}), z.object({
	kind: z.literal("programmatic"),
	mountId: z.string().optional(),
	moduleId: z.string(),
	registryId: z.string(),
	revision: z.string(),
	semanticRevision: z.string().optional()
})]);
const binding = z.object({
	backing: moduleBacking,
	logicalPath: z.string(),
	owner
});
const source = z.object({
	binding: binding.optional(),
	exportName: z.string().optional(),
	logicalPath: z.string(),
	owner,
	sourceId: z.string(),
	sourceKind: openEnum([
		"markdown",
		"module",
		"skill-package"
	])
});
const entry = source.extend({ name: z.string() });
const dynamicResolver = source.extend({ slug: z.string() });
const modelRouting = z.discriminatedUnion("kind", [z.object({
	kind: z.literal("gateway"),
	target: z.string(),
	byok: z.string().optional()
}), z.object({
	kind: z.literal("external"),
	provider: z.string()
})]);
const modelEndpoint = z.union([
	z.object({
		kind: z.literal("external"),
		provider: z.string()
	}),
	z.object({
		kind: z.literal("chatgpt"),
		state: openEnum([
			"checking",
			"ready",
			"signed-out",
			"reauth-required",
			"unavailable"
		]),
		accountLabel: z.string().optional()
	}),
	z.object({
		kind: z.literal("gateway"),
		connected: z.literal(true),
		credential: openEnum([
			"api-key",
			"oidc",
			"oauth"
		]),
		team: z.optional(z.string())
	}),
	z.object({
		kind: z.literal("gateway"),
		connected: z.literal(false)
	})
]);
const modelBaseFields = {
	contextWindowTokens: z.number().optional(),
	providerOptions: z.unknown().optional(),
	reasoning: z.enum([
		"provider-default",
		"none",
		"minimal",
		"low",
		"medium",
		"high",
		"xhigh"
	]).optional().catch(void 0),
	source: source.optional()
};
const agentModel = z.union([z.object({
	...modelBaseFields,
	endpoint: modelEndpoint.optional(),
	id: z.string(),
	routing: modelRouting
}), z.object({
	...modelBaseFields,
	endpoint: z.never().optional(),
	id: z.never().optional(),
	routing: z.object({
		kind: z.literal("dynamic"),
		resolver: dynamicResolver
	})
})]);
const tool = entry.extend({
	description: z.string(),
	hasAuth: z.boolean(),
	hasExecute: z.boolean(),
	hasModelOutputProjection: z.boolean(),
	hasOutputSchema: z.boolean(),
	inputSchema: z.unknown(),
	outputSchema: z.unknown().optional(),
	requiresApproval: z.boolean()
});
const skill = entry.extend({
	description: z.string(),
	license: z.string().optional(),
	markdown: z.string(),
	metadata: z.record(z.string(), z.string()).optional()
});
const instructions = entry.extend({
	content: z.string(),
	role: openEnum(["system", "user"])
});
const schedule = entry.extend({
	cron: z.string(),
	hasRun: z.boolean(),
	markdown: z.string().optional()
});
const channelMethod = openEnum([
	"GET",
	"HEAD",
	"POST",
	"PUT",
	"PATCH",
	"DELETE",
	"OPTIONS",
	"WEBSOCKET"
]);
const channelRoute = entry.extend({
	adapterKind: z.string().optional(),
	method: channelMethod,
	urlPath: z.string()
});
const sourceDescriptor = z.object({
	backing: z.union([moduleBacking, z.object({
		kind: z.literal("resource"),
		sourcePath: z.string()
	})]),
	form: openEnum(["derived", "direct"]),
	layer: openEnum([
		"framework-default",
		"extension-package",
		"extension-override",
		"application"
	]),
	logicalPath: z.string(),
	owner,
	sourceId: z.string()
});
const shadowedChannelRoute = z.object({
	method: channelMethod,
	source: sourceDescriptor,
	urlPath: z.string(),
	winnerSourceId: z.string()
});
const connection = source.extend({
	connectionName: z.string(),
	description: z.string(),
	hasApproval: z.boolean(),
	hasAuthorization: z.boolean(),
	hasHeaders: z.boolean(),
	protocol: z.string(),
	toolFilter: z.unknown().optional(),
	url: z.string()
});
const hook = source.extend({
	eventNames: z.array(z.string()),
	slug: z.string()
});
const memory = source.extend({
	description: z.string().optional(),
	slot: z.string()
});
const sandbox = source.extend({
	provider: z.string().optional(),
	environmentExportName: z.string().optional(),
	revisionHash: z.string()
});
const subagent = entry.extend({
	configResolver: dynamicResolver.optional(),
	description: z.string().optional(),
	entryPath: z.string(),
	nodeId: z.string(),
	parentNodeId: z.string(),
	rootPath: z.string(),
	summary: z.object({
		channels: z.number(),
		connections: z.number(),
		hooks: z.number(),
		instructions: z.number(),
		memories: z.number(),
		schedules: z.number(),
		skills: z.number(),
		tools: z.number()
	})
});
const remoteAgent = entry.extend({
	description: z.string(),
	nodeId: z.string(),
	parentNodeId: z.string(),
	url: z.string().optional()
});
const kernelEffect = z.object({
	action: openEnum(["subagent-call", "workflow-tool-call"]).optional(),
	audience: z.array(openEnum(["root-session"])),
	kind: openEnum(["dispatch", "provider-tool"]),
	sourceId: z.string()
});
const compositionDiagnostic = z.object({
	kind: openEnum(["disabled", "shadowed"]),
	logicalPath: z.string(),
	owner,
	sourceId: z.string(),
	winnerSourceId: z.string().optional()
});
const AgentInfoResultSchema = z.object({
	agent: z.object({
		agentRoot: z.string(),
		appRoot: z.string(),
		config: source.extend({ binding }),
		description: z.string().optional(),
		model: agentModel,
		name: z.string(),
		nodeId: z.string(),
		outputSchema: z.unknown().optional()
	}),
	capabilities: z.object({ devRoutes: z.boolean() }),
	channels: z.object({
		routes: z.array(channelRoute),
		shadowed: z.array(shadowedChannelRoute)
	}),
	composition: z.object({
		disabled: z.array(compositionDiagnostic),
		shadowed: z.array(compositionDiagnostic)
	}),
	connections: z.array(connection),
	diagnostics: z.object({
		discoveryErrors: z.number(),
		discoveryWarnings: z.number()
	}),
	hooks: z.array(hook),
	instructions: z.object({
		dynamic: z.array(dynamicResolver),
		static: z.array(instructions)
	}),
	instrumentation: source.optional(),
	kernelEffects: z.array(kernelEffect),
	kind: z.literal("eve-agent-info"),
	memories: z.array(memory),
	mode: openEnum(["development", "production"]),
	remoteAgents: z.object({
		entries: z.array(remoteAgent),
		total: z.number()
	}),
	sandbox,
	schedules: z.array(schedule),
	skills: z.object({
		dynamic: z.array(dynamicResolver),
		static: z.array(skill)
	}),
	subagents: z.object({
		local: z.array(subagent),
		total: z.number()
	}),
	tools: z.object({
		dynamic: z.array(dynamicResolver),
		static: z.array(tool)
	}),
	version: z.literal(5),
	workspace: z.object({
		resourceRoot: z.unknown(),
		rootEntries: z.array(z.string())
	})
}).superRefine((value, context) => {
	const assertUnique = (entries, identity, path) => {
		const seen = /* @__PURE__ */ new Set();
		entries.forEach((entry, index) => {
			const key = identity(entry);
			if (key === void 0) return;
			if (seen.has(key)) context.addIssue({
				code: "custom",
				message: `Duplicate public identity "${key}".`,
				path: [...path, index]
			});
			seen.add(key);
		});
	};
	const assertTotal = (total, entries, path) => {
		if (!Number.isSafeInteger(total) || total < 0 || total !== entries.length) context.addIssue({
			code: "custom",
			message: `Expected total ${entries.length}, received ${total}.`,
			path: [...path]
		});
	};
	assertUnique(value.tools.static, (entry) => entry.name, ["tools", "static"]);
	assertUnique(value.tools.dynamic, (entry) => entry.slug, ["tools", "dynamic"]);
	assertUnique(value.skills.static, (entry) => entry.name, ["skills", "static"]);
	assertUnique(value.skills.dynamic, (entry) => entry.slug, ["skills", "dynamic"]);
	assertUnique(value.instructions.static, (entry) => entry.name, ["instructions", "static"]);
	assertUnique(value.instructions.dynamic, (entry) => entry.slug, ["instructions", "dynamic"]);
	assertUnique(value.schedules, (entry) => entry.name, ["schedules"]);
	assertUnique(value.connections, (entry) => entry.connectionName, ["connections"]);
	assertUnique(value.hooks, (entry) => entry.slug, ["hooks"]);
	assertUnique(value.memories, (entry) => entry.slot, ["memories"]);
	assertUnique(value.channels.routes, (entry) => entry.method === "unrecognized" ? void 0 : `${entry.method} ${normalizeRoutePattern(entry.urlPath)}`, ["channels", "routes"]);
	assertUnique(value.subagents.local, (entry) => entry.nodeId, ["subagents", "local"]);
	assertUnique(value.remoteAgents.entries, (entry) => entry.nodeId, ["remoteAgents", "entries"]);
	assertTotal(value.subagents.total, value.subagents.local, ["subagents", "total"]);
	assertTotal(value.remoteAgents.total, value.remoteAgents.entries, ["remoteAgents", "total"]);
	const boundSources = [
		[value.agent.config, ["agent", "config"]],
		...value.agent.model.source === void 0 ? [] : [[value.agent.model.source, [
			"agent",
			"model",
			"source"
		]]],
		...value.agent.model.routing.kind === "dynamic" ? [[value.agent.model.routing.resolver, [
			"agent",
			"model",
			"routing",
			"resolver"
		]]] : [],
		...value.channels.routes.map((entry, index) => [entry, [
			"channels",
			"routes",
			index
		]]),
		...value.connections.map((entry, index) => [entry, ["connections", index]]),
		...value.hooks.map((entry, index) => [entry, ["hooks", index]]),
		...value.instructions.dynamic.map((entry, index) => [entry, [
			"instructions",
			"dynamic",
			index
		]]),
		...value.instructions.static.map((entry, index) => [entry, [
			"instructions",
			"static",
			index
		]]),
		...value.memories.map((entry, index) => [entry, ["memories", index]]),
		...value.instrumentation === void 0 ? [] : [[value.instrumentation, ["instrumentation"]]],
		...value.remoteAgents.entries.map((entry, index) => [entry, [
			"remoteAgents",
			"entries",
			index
		]]),
		...value.schedules.map((entry, index) => [entry, ["schedules", index]]),
		...value.skills.dynamic.map((entry, index) => [entry, [
			"skills",
			"dynamic",
			index
		]]),
		...value.skills.static.map((entry, index) => [entry, [
			"skills",
			"static",
			index
		]]),
		...value.subagents.local.flatMap((entry, index) => entry.configResolver === void 0 ? [] : [[entry.configResolver, [
			"subagents",
			"local",
			index,
			"configResolver"
		]]]),
		...value.tools.dynamic.map((entry, index) => [entry, [
			"tools",
			"dynamic",
			index
		]]),
		...value.tools.static.map((entry, index) => [entry, [
			"tools",
			"static",
			index
		]]),
		[value.sandbox, ["sandbox"]]
	];
	for (const [entry, path] of boundSources) {
		if (entry.sourceKind === "module" && entry.binding === void 0) {
			context.addIssue({
				code: "custom",
				message: "Module source is missing its compiled binding.",
				path: [...path, "binding"]
			});
			continue;
		}
		if (entry.sourceKind !== "module" && entry.sourceKind !== "unrecognized" && entry.binding !== void 0) {
			context.addIssue({
				code: "custom",
				message: `${entry.sourceKind} source cannot carry a module binding.`,
				path: [...path, "binding"]
			});
			continue;
		}
		if (entry.binding === void 0) continue;
		if (entry.binding.logicalPath !== entry.logicalPath) context.addIssue({
			code: "custom",
			message: "Source and binding logical paths do not match.",
			path: [
				...path,
				"binding",
				"logicalPath"
			]
		});
		if (JSON.stringify(entry.binding.owner) !== JSON.stringify(entry.owner)) context.addIssue({
			code: "custom",
			message: "Source and binding owners do not match.",
			path: [
				...path,
				"binding",
				"owner"
			]
		});
	}
});
function describeAgentInfoVersionMismatch(payload) {
	if (typeof payload !== "object" || payload === null) return void 0;
	const { kind, version } = payload;
	if (kind !== "eve-agent-info" || typeof version !== "number") return void 0;
	if (version === 5) return void 0;
	return `version: the server sent agent-info version ${version}, but this client reads version ${5}. ${version < 5 ? "Upgrade eve in the agent and redeploy it" : "Upgrade the eve package this client runs from"}.`;
}
function normalizeRoutePattern(path) {
	return path.replace(/^\/+|\/+$/g, "").split("/").map((segment) => segment.startsWith(":") || /^\[[^\]]+\]$/.test(segment) ? ":" : segment).join("/");
}

// src/shared/guards.ts
function isObject$1(value) {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

// src/channel/session-not-active-error.ts
var SessionNotActiveError = class extends EveError {
	static errorName = "SessionNotActiveError";
	retryable;
	constructor(options = {}) {
		const retryable = options.retryable === true;
		super(retryable ? "session_not_ready" : "session_not_active", retryable ? "The session is not ready to accept commands. Retry shortly." : "The session is no longer active. Start a new session.");
		this.retryable = retryable;
	}
};

// src/client/client-error.ts
var ClientError = class extends EveError {
	static errorName = "ClientError";
	status;
	body;
	headers;
	constructor(status, body, headers) {
		const normalizedHeaders = Object.freeze(Object.fromEntries(new Headers(headers).entries()));
		const contentType = normalizedHeaders["content-type"]?.toLowerCase();
		const parsed = parseJsonObject$1(body);
		let message = body || `Server returned ${status}.`;
		if (typeof parsed?.error === "string") message = parsed.error;
		else if (parsed === void 0 && contentType?.includes("text/html")) message = `Server returned ${status} with an HTML response. Check the eve route and development server configuration.`;
		super(typeof parsed?.code === "string" ? parsed.code : "http_error", message);
		this.status = status;
		this.body = body;
		this.headers = normalizedHeaders;
	}
};
var ClientSessionStrandedError = class extends ClientError {
	static errorName = "ClientSessionStrandedError";
	eveVersion;
	constructor(status, body, headers, details) {
		super(status, body, headers);
		this.eveVersion = details.eveVersion;
	}
};
function createClientError(status, body, headers) {
	const parsed = status === 409 ? parseJsonObject$1(body) : void 0;
	if (parsed?.code === "session_not_active" || parsed?.code === "session_not_ready") return new SessionNotActiveError({ retryable: parsed.code === "session_not_ready" });
	if (parsed?.code !== "session_stranded") return new ClientError(status, body, headers);
	return new ClientSessionStrandedError(status, body, headers, { eveVersion: typeof parsed.eveVersion === "string" ? parsed.eveVersion : void 0 });
}
function parseJsonObject$1(body) {
	try {
		const parsed = JSON.parse(body);
		return isObject$1(parsed) ? parsed : void 0;
	} catch {
		return;
	}
}

// src/protocol/session-projection/request-status.ts
function deliveryStatus(outcome, turn, session) {
	switch (outcome) {
		case void 0: return session === "failed" ? "failed" : "working";
		case "awaiting-input": return "awaiting-input";
		case "failed":
		case "refused": return "failed";
		case "ignored":
		case "applied": return "completed";
		case "handled": return turn === "cancelled" ? "cancelled" : turn === "failed" ? "failed" : "completed";
		default: return "failed";
	}
}

// src/protocol/session-events/catalog.ts
const FACT_CATALOG = {
	"call.requested": {
		family: "call",
		idField: "callId",
		role: "introduces"
	},
	"call.settled": {
		family: "call",
		idField: "callId",
		role: "terminal"
	},
	"call.started": {
		family: "call",
		idField: "callId",
		role: "updates"
	},
	"child.opened": {
		family: "child",
		idField: "sessionId",
		role: "introduces"
	},
	"child.sent": {
		family: "child",
		idField: "sessionId",
		role: "record"
	},
	"content.completed": {
		family: "content",
		idField: "partId",
		role: "complete"
	},
	"context.settled": {
		family: "context",
		idField: "changeId",
		role: "terminal"
	},
	"context.started": {
		family: "context",
		idField: "changeId",
		role: "introduces"
	},
	"delivery.admitted": {
		family: "delivery",
		idField: "deliveryId",
		role: "introduces"
	},
	"delivery.consumed": {
		family: "delivery",
		idField: "deliveryId",
		role: "updates"
	},
	"delivery.settled": {
		family: "delivery",
		idField: "deliveryId",
		role: "terminal"
	},
	"interaction.opened": {
		family: "interaction",
		idField: "interactionId",
		role: "introduces"
	},
	"interaction.settled": {
		family: "interaction",
		idField: "interactionId",
		role: "terminal"
	},
	"model.requested": {
		family: "model",
		idField: "runId",
		role: "introduces"
	},
	"model.retried": {
		family: "model",
		idField: "runId",
		role: "updates"
	},
	"model.settled": {
		family: "model",
		idField: "runId",
		role: "terminal"
	},
	"model.started": {
		family: "model",
		idField: "runId",
		role: "updates"
	},
	"response.admitted": {
		family: "response",
		idField: "responseId",
		role: "updates"
	},
	"response.settled": {
		family: "response",
		idField: "responseId",
		role: "terminal"
	},
	"response.submitted": {
		family: "response",
		idField: "responseId",
		role: "introduces"
	},
	"session.ended": {
		family: "session",
		idField: "",
		role: "terminal"
	},
	"session.started": {
		family: "session",
		idField: "",
		role: "introduces"
	},
	"task.ended": {
		family: "task",
		idField: "taskId",
		role: "terminal"
	},
	"task.started": {
		family: "task",
		idField: "taskId",
		role: "introduces"
	},
	"turn.paused": {
		family: "turn",
		idField: "turnId",
		role: "updates"
	},
	"turn.settled": {
		family: "turn",
		idField: "turnId",
		role: "terminal"
	},
	"turn.started": {
		family: "turn",
		idField: "turnId",
		role: "introduces"
	},
	"usage.recorded": {
		family: "usage",
		idField: "",
		role: "record"
	}
};
const PROGRESS_CATALOG = {
	"call.input": {
		family: "call",
		idField: "callId"
	},
	"call.progress": {
		family: "call",
		idField: "callId"
	},
	"content.delta": {
		family: "content",
		idField: "partId"
	}
};
function isFactType(type) {
	return typeof type === "string" && Object.hasOwn(FACT_CATALOG, type);
}
function isProgressType(type) {
	return typeof type === "string" && Object.hasOwn(PROGRESS_CATALOG, type);
}

// src/protocol/session-events/json.ts
function isObject(value) {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

// src/protocol/session-projection/tree.ts
const TABLES = {
	call: "calls",
	change: "changes",
	child: "children",
	delivery: "deliveries",
	interaction: "interactions",
	part: "parts",
	response: "responses",
	run: "runs",
	task: "tasks",
	turn: "turns"
};
const CLOSABLE = [
	"interaction",
	"response",
	"call",
	"run",
	"task",
	"change",
	"delivery",
	"turn"
];
function rowOf(view, family, id) {
	return view[TABLES[family]][id];
}
function refOf(keyed) {
	if (!isObject(keyed)) return void 0;
	if ("turnId" in keyed) return {
		family: "turn",
		id: keyed.turnId
	};
	if ("runId" in keyed) return {
		family: "run",
		id: keyed.runId
	};
	if ("changeId" in keyed) return {
		family: "change",
		id: keyed.changeId
	};
	if ("callId" in keyed) return {
		family: "call",
		id: keyed.callId
	};
	if ("taskId" in keyed) return {
		family: "task",
		id: keyed.taskId
	};
	if ("responseId" in keyed) return {
		family: "response",
		id: keyed.responseId
	};
	if ("interactionId" in keyed) return {
		family: "interaction",
		id: keyed.interactionId
	};
}
function parentOf(view, ref) {
	switch (ref.family) {
		case "run": return refOf(rowOf(view, "run", ref.id)?.owner);
		case "change": {
			const turnId = rowOf(view, "change", ref.id)?.turnId;
			return turnId === void 0 ? void 0 : {
				family: "turn",
				id: turnId
			};
		}
		case "call": {
			const row = rowOf(view, "call", ref.id);
			if (row === void 0) return void 0;
			if (row.taskId !== void 0) return {
				family: "task",
				id: row.taskId
			};
			const madeBy = refOf(row.owner);
			if (madeBy?.family !== "run") return madeBy;
			const run = rowOf(view, "run", madeBy.id);
			return run?.status === "settled" && run.outcome === "completed" ? refOf(run.owner) : madeBy;
		}
		case "interaction": return refOf(rowOf(view, "interaction", ref.id)?.subject);
		case "response": {
			const interactionId = rowOf(view, "response", ref.id)?.interactionId;
			return interactionId === void 0 ? void 0 : {
				family: "interaction",
				id: interactionId
			};
		}
		case "delivery": {
			const row = rowOf(view, "delivery", ref.id);
			return row?.status === "consumed" && row.turnId !== void 0 ? {
				family: "turn",
				id: row.turnId
			} : void 0;
		}
		case "child": return refOf(rowOf(view, "child", ref.id)?.owner);
		case "part": {
			const row = rowOf(view, "part", ref.id);
			if (row?.runId !== void 0) return {
				family: "run",
				id: row.runId
			};
			return row?.turnId === void 0 ? void 0 : {
				family: "turn",
				id: row.turnId
			};
		}
		case "turn":
		case "task": return;
	}
}
function ancestors(view, ref) {
	const found = [];
	const seen = /* @__PURE__ */ new Set([`${ref.family}:${ref.id}`]);
	let current = parentOf(view, ref);
	while (current !== void 0 && !seen.has(`${current.family}:${current.id}`)) {
		seen.add(`${current.family}:${current.id}`);
		found.push(current);
		current = parentOf(view, current);
	}
	return found;
}
function ownerOf(view, ref, family) {
	if (ref.family === family) return ref.id;
	return ancestors(view, ref).find((owner) => owner.family === family)?.id;
}
function isOpen(view, ref) {
	const row = rowOf(view, ref.family, ref.id);
	return row?.status !== void 0 && row.status !== "settled" && row.status !== "ended";
}
function openUnder(view, owner) {
	const found = [];
	for (const family of CLOSABLE) for (const [id, row] of Object.entries(view[TABLES[family]])) {
		const ref = {
			family,
			id
		};
		if (!isOpen(view, ref)) continue;
		const above = ancestors(view, ref);
		if (owner !== "session" && !above.some((a) => a.family === owner.family && a.id === owner.id)) continue;
		found.push({
			at: row.introducedAt,
			depth: above.length,
			ref
		});
	}
	return found.sort((a, b) => b.depth - a.depth || b.at - a.at).map((entry) => entry.ref);
}

// src/protocol/session-projection/fold.ts
const ZERO = {
	cacheReadTokens: 0,
	cacheWriteTokens: 0,
	inputTokens: 0,
	outputTokens: 0
};
function dictionary(source) {
	return Object.assign(Object.create(null), source);
}
function emptySessionView() {
	return {
		calls: dictionary(),
		changes: dictionary(),
		children: dictionary(),
		deliveries: dictionary(),
		interactions: dictionary(),
		parts: dictionary(),
		position: 0,
		responses: dictionary(),
		runs: dictionary(),
		session: {
			status: "new",
			turnCount: 0
		},
		tasks: dictionary(),
		turns: dictionary(),
		usage: {
			byKind: dictionary(),
			total: ZERO
		}
	};
}
function emptyPreviews() {
	return {
		calls: dictionary(),
		parts: dictionary()
	};
}
function foldReceivedEvent(view, event, previews) {
	const state = view;
	const line = event.meta?.position?.line ?? state.position;
	if (line < state.position) return;
	const into = previews;
	if (isFactType(event.type)) foldFact(state, into, event, {
		at: event.meta?.at ?? "",
		position: line
	});
	else if (into !== void 0 && isProgressType(event.type)) foldProgress(state, into, event);
	if (event.meta?.endOfLine !== false) state.position = line + 1;
}
function foldFact(view, previews, raw, at) {
	if (raw === null || typeof raw !== "object") return;
	const fact = raw;
	if (!isFactType(fact.type) || fact.data === null || typeof fact.data !== "object") return;
	if (view.session.status === "ended") return;
	if ((fact.type === "model.requested" || fact.type === "call.requested" || fact.type === "child.opened") && !isObject(fact.data.owner)) return;
	if (foldLifecycle(view, fact, {
		introducedAt: at.position,
		startedAt: at.at
	}, at)) {
		foldSpecifics(view, previews, fact, at);
		return;
	}
	switch (fact.type) {
		case "session.started": {
			if (view.session.status !== "new") return;
			const { parent, runtime } = fact.data;
			view.session = {
				...view.session,
				parent,
				runtime,
				startedAt: at.at,
				status: "open"
			};
			return;
		}
		case "session.ended": {
			const { cause, error, outcome } = fact.data;
			if (typeof outcome !== "string") return;
			view.session = {
				...view.session,
				cause,
				closedAt: at.position,
				endedAt: at.at,
				error,
				outcome,
				status: "ended"
			};
			return;
		}
		case "child.sent": {
			const { callId, childDeliveryId: deliveryId, sessionId } = fact.data;
			const child = view.children[sessionId];
			if (child === void 0 || child.deliveries?.some((sent) => sent.deliveryId === deliveryId)) return;
			view.children[sessionId] = {
				...child,
				deliveries: [...child.deliveries ?? [], {
					callId,
					deliveryId
				}]
			};
			return;
		}
		case "usage.recorded": {
			const { kind, owner, usage } = fact.data;
			if (usage === null || typeof usage !== "object") return;
			view.usage = addToTotals(view.usage, kind, usage);
			if (!isObject(owner)) return;
			if ("runId" in owner) {
				const run = view.runs[owner.runId];
				if (run !== void 0) view.runs[run.runId] = {
					...run,
					usage: addUsage(run.usage, usage)
				};
			} else if ("callId" in owner) {
				const call = view.calls[owner.callId];
				if (call !== void 0) view.calls[call.callId] = {
					...call,
					usage: addUsage(call.usage, usage)
				};
			}
			return;
		}
	}
}
const LIFECYCLE = {
	"call.requested": {
		status: "requested",
		table: "calls"
	},
	"call.settled": {
		status: "settled",
		table: "calls"
	},
	"call.started": {
		from: "requested",
		status: "running",
		table: "calls"
	},
	"child.opened": { table: "children" },
	"content.completed": { table: "parts" },
	"context.settled": {
		status: "settled",
		table: "changes"
	},
	"context.started": {
		status: "running",
		table: "changes"
	},
	"delivery.admitted": {
		status: "admitted",
		table: "deliveries"
	},
	"delivery.consumed": {
		from: "admitted",
		omit: ["history"],
		status: "consumed",
		table: "deliveries"
	},
	"delivery.settled": {
		status: "settled",
		table: "deliveries"
	},
	"interaction.opened": {
		status: "open",
		table: "interactions"
	},
	"interaction.settled": {
		status: "settled",
		table: "interactions"
	},
	"model.requested": {
		status: "requested",
		table: "runs"
	},
	"model.settled": {
		status: "settled",
		table: "runs"
	},
	"model.started": {
		status: "running",
		table: "runs"
	},
	"response.admitted": {
		from: "submitted",
		status: "admitted",
		table: "responses"
	},
	"response.settled": {
		status: "settled",
		table: "responses"
	},
	"response.submitted": {
		status: "submitted",
		table: "responses"
	},
	"task.ended": {
		status: "ended",
		table: "tasks"
	},
	"task.started": {
		status: "running",
		table: "tasks"
	},
	"turn.settled": {
		rename: { cause: "endedBy" },
		status: "settled",
		table: "turns"
	},
	"turn.started": {
		omit: ["trace"],
		status: "running",
		table: "turns"
	}
};
const FOLD_FIELDS = /* @__PURE__ */ new Set([
	"introducedAt",
	"startedAt",
	"closedAt",
	"endedAt",
	"consumedAt",
	"step",
	"runs",
	"status"
]);
function foldLifecycle(view, fact, introduced, at) {
	const rule = LIFECYCLE[fact.type];
	if (rule === void 0) return false;
	const { idField, role } = FACT_CATALOG[fact.type];
	const data = Object.fromEntries(Object.entries(fact.data).flatMap(([key, value]) => rule.omit?.includes(key) === true || FOLD_FIELDS.has(key) ? [] : [[rule.rename?.[key] ?? key, value]]));
	const id = data[idField];
	if (typeof id !== "string") return false;
	const rows = view[rule.table];
	const row = rows[id];
	const status = rule.status === void 0 ? {} : { status: rule.status };
	const closed = (entry) => entry.status === "settled" || entry.status === "ended";
	switch (role) {
		case "introduces":
		case "complete":
			if (row !== void 0) return false;
			rows[id] = {
				...introduced,
				...data,
				...status
			};
			return true;
		case "updates":
			if (row === void 0 || (rule.from !== void 0 ? row.status !== rule.from : closed(row))) return false;
			rows[id] = {
				...row,
				...data,
				...status
			};
			return true;
		case "terminal":
			if (row === void 0 || closed(row) || typeof data.outcome !== "string") return false;
			rows[id] = {
				...row,
				...data,
				closedAt: at.position,
				endedAt: at.at,
				...status
			};
			return true;
		default: return false;
	}
}
function foldSpecifics(view, previews, fact, at) {
	switch (fact.type) {
		case "delivery.consumed": {
			const row = view.deliveries[fact.data.deliveryId];
			view.deliveries[row.deliveryId] = {
				...row,
				consumedAt: at.position
			};
			return;
		}
		case "turn.started":
			view.session = {
				...view.session,
				latestTurnId: fact.data.turnId,
				turnCount: view.session.turnCount + 1
			};
			delete view.selection;
			return;
		case "model.requested": {
			const { owner, runId } = fact.data;
			const turn = "turnId" in owner ? view.turns[owner.turnId] : void 0;
			if (turn === void 0) return;
			const step = turn.runs ?? 0;
			view.turns[turn.turnId] = {
				...turn,
				runs: step + 1
			};
			view.runs[runId] = {
				...view.runs[runId],
				step
			};
			return;
		}
		case "model.settled":
			if (previews !== void 0) dropRunPreviews(view, previews, fact.data.runId);
			return;
		case "call.requested":
		case "call.settled":
			if (previews !== void 0) delete previews.calls[fact.data.callId];
			return;
		case "content.completed": {
			const { partId, phase, runId } = fact.data;
			if (previews !== void 0) delete previews.parts[partId];
			const runOwner = runId === void 0 ? void 0 : view.runs[runId]?.owner;
			const turnId = runId === void 0 ? fact.scope?.turnId : runOwner !== void 0 && "turnId" in runOwner ? runOwner.turnId : void 0;
			if (runId === void 0 && turnId !== void 0) view.parts[partId] = {
				...view.parts[partId],
				turnId
			};
			const turn = turnId === void 0 ? void 0 : view.turns[turnId];
			if (phase === "reply" && turn !== void 0 && turn.status !== "settled") {
				const sameStep = (turn.reply ?? []).filter((id) => {
					const part = view.parts[id];
					return part !== void 0 && part.runId === runId;
				});
				view.turns[turn.turnId] = {
					...turn,
					reply: [...sameStep, partId]
				};
			}
			return;
		}
		case "context.settled": {
			const { outcome, selects } = fact.data;
			if (outcome === "completed" && "selects" in fact.data && selects !== void 0) view.selection = selects;
			return;
		}
	}
}
function foldProgress(view, previews, raw) {
	if (raw === null || typeof raw !== "object") return;
	const progress = raw;
	if (!isProgressType(progress.type) || progress.data === null || typeof progress.data !== "object") return;
	if (view.session.status === "ended") return;
	switch (progress.type) {
		case "content.delta": {
			const { delta, kind, partId } = progress.data;
			if (view.parts[partId] !== void 0 || typeof delta !== "string") return;
			const preview = previews.parts[partId];
			if (preview !== void 0) previews.parts[partId] = {
				...preview,
				text: preview.text + delta
			};
			else if (kind !== void 0) previews.parts[partId] = {
				kind,
				partId,
				runId: progress.scope?.runId,
				text: delta
			};
			return;
		}
		case "call.input": {
			const { callId, delta, kind, name } = progress.data;
			if (view.calls[callId] !== void 0 || typeof delta !== "string") return;
			const preview = previews.calls[callId];
			if (preview !== void 0) previews.calls[callId] = {
				...preview,
				input: preview.input + delta
			};
			else if (name !== void 0) {
				const announced = {
					callId,
					input: delta,
					name,
					runId: progress.scope?.runId
				};
				previews.calls[callId] = kind === void 0 ? announced : {
					...announced,
					kind
				};
			}
			return;
		}
		case "call.progress": {
			const { callId, output, label } = progress.data;
			const call = view.calls[callId];
			if (call === void 0 || call.status === "settled") return;
			const preview = previews.calls[callId];
			previews.calls[callId] = {
				callId,
				input: preview?.input ?? "",
				name: call.capability.name,
				output,
				runId: "runId" in call.owner ? call.owner.runId : void 0,
				...label !== void 0 && { label }
			};
			return;
		}
	}
}
function dropRunPreviews(view, previews, runId) {
	for (const [partId, preview] of Object.entries(previews.parts)) if (preview.runId === runId) delete previews.parts[partId];
	for (const [callId, preview] of Object.entries(previews.calls)) if (preview.runId === runId && view.calls[callId] === void 0) delete previews.calls[callId];
}
function addUsage(a, b) {
	if (a === void 0) return b;
	const sum = {
		cacheReadTokens: a.cacheReadTokens + b.cacheReadTokens,
		cacheWriteTokens: a.cacheWriteTokens + b.cacheWriteTokens,
		inputTokens: a.inputTokens + b.inputTokens,
		outputTokens: a.outputTokens + b.outputTokens
	};
	if (a.costUsd !== void 0 || b.costUsd !== void 0) sum.costUsd = (a.costUsd ?? 0) + (b.costUsd ?? 0);
	return sum;
}
function addToTotals(totals, kind, usage) {
	return {
		byKind: dictionary({
			...totals.byKind,
			[kind]: addUsage(totals.byKind[kind], usage)
		}),
		total: addUsage(totals.total, usage)
	};
}

// src/protocol/session-projection/display-name.ts
function displayName(identifier) {
	const words = lastSegment(identifier).replace(/([a-z0-9])([A-Z])/gu, "$1 $2").replace(/([A-Z]+)([A-Z][a-z])/gu, "$1 $2").split(SEPARATORS).filter((word) => word !== "").map((word) => word.length > 1 && word === word.toUpperCase() ? word : word.toLowerCase());
	return words.length === 0 ? identifier : words.join(" ");
}
function displayTitle(identifier) {
	return capitalize(displayName(identifier));
}
const SEPARATORS = /[\s_-]+/u;
function lastSegment(identifier) {
	return identifier.split("__").findLast((segment) => segment !== "") ?? identifier;
}
function capitalize(text) {
	return text.charAt(0).toUpperCase() + text.slice(1);
}

// src/protocol/session-projection/selectors.ts
function activeTurn(view) {
	if (view.session.status === "ended") return void 0;
	const latest = view.session.latestTurnId;
	const row = latest === void 0 ? void 0 : view.turns[latest];
	return row !== void 0 && row.status !== "settled" ? row : void 0;
}
function conversation(view) {
	const selection = view.selection;
	const start = selection === void 0 ? view.session.latestTurnId : selection?.turnId;
	const turns = [];
	const seen = /* @__PURE__ */ new Set();
	let id = start;
	while (id !== void 0 && id !== null && !seen.has(id)) {
		seen.add(id);
		const row = view.turns[id];
		if (row === void 0) break;
		turns.push(row);
		id = row.follows;
	}
	return turns.reverse();
}
function failure(view, turnId) {
	const row = turnId === void 0 ? void 0 : view.turns[turnId];
	if (row?.outcome === "failed") return row.error ?? {
		code: "TURN_FAILED",
		message: "The turn failed."
	};
	if (view.session.outcome === "failed") return view.session.error ?? {
		code: "SESSION_FAILED",
		message: "The session failed."
	};
}
function callOutputSource(view, callId) {
	const seen = /* @__PURE__ */ new Set();
	let row = view.calls[callId];
	while (row !== void 0 && !seen.has(row.callId)) {
		seen.add(row.callId);
		if (row.outcome !== "completed" || row.outputOf === void 0) return row;
		row = view.calls[row.outputOf.callId];
	}
}
function isWorking(view, taskId) {
	if (view.session.status === "ended" || view.tasks[taskId]?.status !== "running") return false;
	return Object.values(view.calls).some((row) => row.status !== "settled" && callTask(view, row) === taskId);
}
function tasks(view, filter = {}) {
	return Object.values(view.tasks).filter((row) => {
		switch (filter.status) {
			case void 0: return true;
			case "ended": return row.status === "ended";
			case "working": return isWorking(view, row.taskId);
			case "idle": return row.status === "running" && !isWorking(view, row.taskId);
		}
	});
}
function openInteractions(view, filter = {}) {
	if (view.session.status === "ended") return [];
	return Object.values(view.interactions).filter((row) => {
		if (row.status !== "open" || filter.kind !== void 0 && row.request.kind !== filter.kind) return false;
		const about = filter.about;
		if (about === void 0) return true;
		if ("callId" in about) {
			const call = view.calls[about.callId];
			return "callId" in row.subject && row.subject.callId === about.callId || row.origin?.call?.callId === about.callId || call?.taskId !== void 0 && interactionOwner(view, row).taskId === call.taskId;
		}
		if ("taskId" in about) return interactionOwner(view, row).taskId === about.taskId;
		if ("turnId" in about) return interactionOwner(view, row).turnId === about.turnId;
		return sameSubject(row.subject, about);
	}).sort((a, b) => a.introducedAt - b.introducedAt);
}
function answeredInteractionIds(view) {
	return new Set(Object.values(view.responses).filter((row) => row.status === "admitted").map((row) => row.interactionId));
}
function queue(view) {
	if (view.session.status === "ended") return [];
	return Object.values(view.deliveries).filter((row) => row.status === "admitted").sort((a, b) => a.introducedAt - b.introducedAt);
}
function idle(view) {
	if (view.session.status === "ended") return true;
	const active = activeTurn(view);
	if (active !== void 0 && waiting(view, active.turnId)?.on !== "interaction") return false;
	if (Object.values(view.changes).some((row) => row.status === "running")) return false;
	if (queue(view).length > 0) return false;
	return !Object.keys(view.tasks).some((taskId) => isWorking(view, taskId));
}
function waiting(view, turnId) {
	if (view.session.status === "ended") return void 0;
	const row = view.turns[turnId];
	if (row === void 0 || row.status === "settled") return void 0;
	const open = openWork(view, { turnId });
	if (open.runs.length > 0 || open.changes.length > 0) return { on: "session" };
	const signingIn = new Set(open.interactions.flatMap((row) => "responseId" in row.subject ? [row.subject.responseId] : []));
	if (open.responses.some((response) => response.status === "submitted" && !signingIn.has(response.responseId))) return { on: "session" };
	const decided = Math.max(-1, ...Object.values(view.runs).filter((run) => runTurn(view, run.runId) === turnId).map((run) => run.introducedAt), ...Object.values(view.interactions).filter((row) => interactionOwner(view, row).turnId === turnId || subjectTurn(view, row) === turnId).map((row) => row.introducedAt), ...Object.values(view.responses).filter((response) => response.status !== "submitted" && view.deliveries[response.deliveryId]?.turnId === turnId).map((response) => response.introducedAt));
	if (Object.values(view.deliveries).some((delivery) => delivery.status === "consumed" && delivery.turnId === turnId && (delivery.consumedAt ?? -1) > decided)) return { on: "session" };
	const interactions = Object.values(view.interactions);
	const about = (outcome) => new Set(interactions.flatMap((row) => !outcome(row) ? [] : [..."callId" in row.subject ? [row.subject.callId] : [], ...row.origin?.call === void 0 ? [] : [row.origin.call.callId]]));
	const asked = about((row) => row.status === "open");
	const approved = about((row) => row.status === "settled" && row.outcome === "accepted");
	const turnCalls = Object.values(view.calls).filter((entry) => entry.status !== "settled" && callTurn(view, entry) === turnId);
	const calls = turnCalls.filter((entry) => entry.status === "running");
	const answered = answeredInteractionIds(view);
	if (!interactions.some((row) => row.status === "open" && row.request.kind === "sign-in" && "turnId" in row.subject && row.subject.turnId === turnId && !answered.has(row.interactionId)) && calls.some((entry) => entry.taskId === void 0 && entry.capability.name !== "eve__task_wait" && !asked.has(entry.callId))) return { on: "session" };
	const pending = turnCalls.filter((entry) => entry.status === "requested" && !asked.has(entry.callId));
	if (pending.some((entry) => approved.has(entry.callId))) return { on: "session" };
	if (pending.some((entry) => entry.capability.kind === "control" && entry.capability.name === "eve__task_cancel")) return { on: "session" };
	if (pending.length > 0 && calls.length === 0) return { on: "session" };
	const interactionsWaiting = openInteractions(view).filter((entry) => !answered.has(entry.interactionId) && !("callId" in entry.subject && view.calls[entry.subject.callId]?.status === "settled") && (interactionOwner(view, entry).turnId === turnId || subjectTurn(view, entry) === turnId));
	if (interactionsWaiting.length > 0) return {
		interactions: interactionsWaiting,
		on: "interaction"
	};
	if (calls.length > 0) {
		const taskIds = new Set(calls.flatMap((call) => call.taskId ?? []));
		if (calls.some((call) => call.capability.name === "eve__task_wait")) for (const task of tasks(view, { status: "working" })) taskIds.add(task.taskId);
		return {
			on: "work",
			calls,
			tasks: [...taskIds].flatMap((id) => view.tasks[id] ?? [])
		};
	}
	return { on: "session" };
}
function ownApproval(view, callId) {
	let found;
	for (const row of Object.values(view.interactions)) if (row.request.kind === "approval" && row.origin === void 0 && "callId" in row.subject && row.subject.callId === callId) found = row;
	return found;
}
function callState(view, callId) {
	const row = view.calls[callId];
	if (row === void 0) return void 0;
	if (row.status === "settled") switch (row.outcome) {
		case "completed":
		case "failed":
		case "rejected": return row.outcome;
		case "interrupted":
		case "abandoned": return "cancelled";
		default: return "failed";
	}
	const answered = answeredInteractionIds(view);
	const waits = openInteractions(view, { about: { callId } }).filter((entry) => !answered.has(entry.interactionId));
	if (waits.length > 0) {
		const own = ownApproval(view, callId);
		return waits.some((entry) => entry === own) ? "approval" : "blocked";
	}
	return row.status === "requested" ? "requested" : "running";
}
function callLabel(row, preview) {
	return row.label ?? (row.status === "settled" ? void 0 : preview?.label) ?? row.capability.label ?? displayTitle(row.capability.name);
}
function callRun(view, entry) {
	const owner = callOwnerRoot(view, entry);
	return owner !== void 0 && "runId" in owner ? owner.runId : void 0;
}
function callOwnerRoot(view, entry) {
	const seen = /* @__PURE__ */ new Set();
	let current = entry;
	while (current !== void 0 && !seen.has(current.callId)) {
		seen.add(current.callId);
		if (!("callId" in current.owner)) return current.owner;
		current = view.calls[current.owner.callId];
	}
}
function callTurn(view, entry) {
	const owner = callOwnerRoot(view, entry);
	if (owner === void 0) return void 0;
	if ("turnId" in owner) return owner.turnId;
	if (!("runId" in owner)) return void 0;
	return view.runs[owner.runId] === void 0 ? void 0 : runTurn(view, owner.runId);
}
function callTask(view, entry) {
	return ownerOf(view, {
		family: "call",
		id: entry.callId
	}, "task");
}
function runTurn(view, runId) {
	return ownerOf(view, {
		family: "run",
		id: runId
	}, "turn");
}
function interactionOwner(view, entry) {
	const ref = {
		family: "interaction",
		id: entry.interactionId
	};
	const owner = {};
	for (const family of [
		"turn",
		"task",
		"run",
		"change"
	]) {
		const id = ownerOf(view, ref, family);
		if (id !== void 0) owner[`${family}Id`] = id;
	}
	return owner;
}
function openWork(view, owner) {
	if (view.session.status === "ended") return {
		calls: [],
		changes: [],
		deliveries: [],
		interactions: [],
		responses: [],
		runs: [],
		tasks: []
	};
	const ref = "session" in owner ? "session" : refOf(owner);
	const open = openUnder(view, ref);
	if (ref !== "session" && ref.family !== "turn" && isOpen(view, ref)) open.push(ref);
	const rows = (family) => open.flatMap((entry) => {
		const row = entry.family === family ? rowOf(view, family, entry.id) : void 0;
		return row === void 0 ? [] : [row];
	});
	const answering = new Set(ref !== "session" && ref.family === "turn" ? Object.values(view.responses).flatMap((response) => ownerOf(view, {
		family: "response",
		id: response.responseId
	}, "turn") === ref.id ? [response.deliveryId] : []) : []);
	const deliveries = [...rows("delivery"), ...Object.values(view.deliveries).filter((row) => row.status === "admitted" && answering.has(row.deliveryId))];
	return {
		calls: rows("call"),
		changes: rows("change"),
		deliveries,
		interactions: rows("interaction"),
		responses: rows("response"),
		runs: rows("run"),
		tasks: rows("task")
	};
}
function subjectTurn(view, entry) {
	const { subject } = entry;
	if ("turnId" in subject) return subject.turnId;
	if ("callId" in subject) {
		const callRow = view.calls[subject.callId];
		return callRow === void 0 ? void 0 : callTurn(view, callRow);
	}
}
function sameSubject(a, b) {
	const [aKey, aValue] = Object.entries(a)[0] ?? [];
	const [bKey, bValue] = Object.entries(b)[0] ?? [];
	return aKey === bKey && aValue === bValue;
}

// src/protocol/session-projection/reader.ts
function runPlace(view, runId) {
	const row = runId === void 0 ? void 0 : view.runs[runId];
	if (row === void 0 || row.step === void 0 || !("turnId" in row.owner)) return void 0;
	return {
		stepIndex: row.step,
		turnId: row.owner.turnId
	};
}
function partPlace(view, row) {
	if (row.runId !== void 0) return runPlace(view, row.runId);
	return row.turnId === void 0 ? void 0 : {
		stepIndex: turnStepAt(view, row.turnId, row.introducedAt),
		turnId: row.turnId
	};
}
function turnStepAt(view, turnId, position = Infinity) {
	let step = 0;
	for (const row of Object.values(view.runs)) {
		if (row.step === void 0 || row.introducedAt > position) continue;
		if ("turnId" in row.owner && row.owner.turnId === turnId) step = Math.max(step, row.step);
	}
	return step;
}
function callPlace(view, callId) {
	const row = view.calls[callId];
	if (row === void 0) return void 0;
	const place = runPlace(view, callRun(view, row));
	if (place !== void 0) return place;
	const turnId = callTurn(view, row) ?? view.session.latestTurnId;
	return turnId === void 0 ? void 0 : {
		stepIndex: turnStepAt(view, turnId, row.introducedAt),
		turnId
	};
}
function askedCall(view, row) {
	if (row.origin !== void 0) return row.origin.call;
	if (!("callId" in row.subject)) return void 0;
	const call = view.calls[row.subject.callId];
	if (call === void 0) return void 0;
	return call.input === void 0 ? {
		callId: call.callId,
		name: call.capability.name
	} : {
		callId: call.callId,
		input: call.input,
		name: call.capability.name
	};
}
function interactionPlace(view, row) {
	const owner = interactionOwner(view, row);
	const turnId = owner.turnId ?? view.session.latestTurnId ?? "turn_0";
	const place = {
		stepIndex: turnStepAt(view, turnId, row.introducedAt),
		turnId
	};
	const taskId = owner.taskId ?? ("taskId" in row.subject ? row.subject.taskId : void 0);
	if (taskId !== void 0) place.taskId = taskId;
	return place;
}
function interaction$1(view, interactionId) {
	const row = view.interactions[interactionId];
	if (row === void 0) return void 0;
	let request = row.request;
	if (row.request.signIn !== void 0) {
		const { callbackUrl: _callbackUrl, ...signIn } = row.request.signIn;
		request = {
			...row.request,
			signIn
		};
	}
	const shown = {
		...interactionPlace(view, row),
		interactionId,
		request,
		status: row.status
	};
	const call = askedCall(view, row);
	if (call !== void 0) shown.call = call;
	if (row.outcome !== void 0) shown.outcome = row.outcome;
	if (row.reason !== void 0) shown.reason = row.reason;
	let answer = decidingAnswer(row);
	if (row.status === "open") for (const response of Object.values(view.responses)) {
		if (response.interactionId !== interactionId || response.status === "settled") continue;
		if (response.value !== void 0) answer = {
			...response.value,
			interactionId
		};
	}
	if (answer !== void 0) shown.answer = answer;
	return shown;
}
function decidingAnswer(row) {
	const value = row.response;
	if (value === void 0) return void 0;
	const answer = { interactionId: row.interactionId };
	if (typeof value.optionId === "string") answer.optionId = value.optionId;
	if (typeof value.text === "string") answer.text = value.text;
	return answer.optionId === void 0 && answer.text === void 0 ? void 0 : answer;
}
function signInEnding(outcome) {
	switch (outcome) {
		case "accepted": return "connected";
		case "declined":
		case "invalid": return "declined";
		case "failed": return "failed";
		case "expired": return "timed out";
		default: return "cancelled";
	}
}

// src/client/session-utils.ts
function turnSummary(deliveryId) {
	const segment = new ResponseSegment({ deliveryId });
	let settlement;
	let consumedBy;
	let sessionEnded = false;
	const outcomes = /* @__PURE__ */ new Map();
	const turnReplies = /* @__PURE__ */ new Map();
	const turnResults = /* @__PURE__ */ new Map();
	const turnFailures = /* @__PURE__ */ new Map();
	let sessionFailure;
	const parts = /* @__PURE__ */ new Map();
	let boundary;
	let failure;
	let message;
	let result;
	function observe(event) {
		if (event.type === "session.ended") sessionEnded = true;
		if (event.type === "delivery.consumed" && event.data.deliveryId === deliveryId) consumedBy = event.data.turnId;
		if (event.type === "delivery.settled" && event.data.deliveryId === deliveryId) settlement = event.data;
		if (event.type === "turn.settled") outcomes.set(event.data.turnId, event.data.outcome);
		if (segment.observe(event)) boundary = segment.boundary;
		const failed = failureOf(event);
		failure = failed ?? failure;
		if (failed !== void 0) {
			if (event.type === "turn.settled") turnFailures.set(event.data.turnId, failed);
			if (event.type === "session.ended") sessionFailure = failed;
		}
		if (event.type === "content.completed") {
			parts.set(event.data.partId, {
				kind: event.data.kind,
				value: event.data.value
			});
			if (event.data.kind === "result") {
				result = event.data.value;
				if (event.scope?.turnId !== void 0) turnResults.set(event.scope.turnId, result);
			}
		}
		if (event.type === "turn.settled") {
			const text = (event.data.reply ?? []).flatMap((partId) => {
				const part = parts.get(partId);
				return part?.kind === "text" && typeof part.value === "string" ? [part.value] : [];
			});
			message = text.length === 0 ? void 0 : text.join("\n");
			turnReplies.set(event.data.turnId, message);
			for (const partId of event.data.reply ?? []) {
				const part = parts.get(partId);
				if (part?.kind === "result") turnResults.set(event.data.turnId, part.value);
			}
		}
	}
	function summarize() {
		const turnId = settlement?.turnId ?? consumedBy;
		const status = deliveryId === void 0 ? summarizeBoundaryStatus(boundary, failure) : deliveryStatus(settlement?.outcome, outcomes.get(turnId ?? ""), sessionFailure === void 0 ? void 0 : "failed");
		if (deliveryId !== void 0) {
			const conversational = settlement?.outcome === "handled" || settlement?.outcome === "awaiting-input";
			message = conversational && turnId !== void 0 ? turnReplies.get(turnId) : void 0;
			result = conversational && turnId !== void 0 ? turnResults.get(turnId) : void 0;
			failure = status === "failed" ? turnFailures.get(turnId ?? "") ?? sessionFailure : void 0;
			if (status === "failed" && failure === void 0) failure = {
				code: settlement?.outcome === "refused" ? "DELIVERY_REFUSED" : "DELIVERY_FAILED",
				message: settlement?.reason ?? (settlement?.outcome === "refused" ? "The delivery was refused." : "The delivery failed.")
			};
		}
		return {
			boundary,
			failure,
			interactions: segment.interactions,
			message,
			result,
			sessionEnded,
			status,
			outcome: settlement?.outcome
		};
	}
	return {
		observe,
		result: summarize
	};
}
function summarizeBoundaryStatus(boundary, failure) {
	if (failure !== void 0) return "failed";
	if (boundary?.type === "turn.settled") return boundary.data.outcome;
	if (boundary?.type === "session.ended") return boundary.data.outcome;
	return boundary?.type === "turn.paused" ? "awaiting-input" : "working";
}
function failureOf(event) {
	if (event.type === "turn.settled" && event.data.outcome === "failed") return event.data.error ?? {
		code: "TURN_FAILED",
		message: "The turn failed."
	};
	if (event.type === "session.ended" && event.data.outcome === "failed") return event.data.error ?? {
		code: "SESSION_FAILED",
		message: "The session failed."
	};
}
function endsTurn(event) {
	if (event.type === "turn.settled" || event.type === "session.ended") return true;
	return event.type === "turn.paused" && event.data.awaiting.some((entry) => "interactionId" in entry);
}
var ResponseSegment = class {
	#view = emptySessionView();
	#deliveryId;
	#boundary;
	constructor(options = {}) {
		this.#deliveryId = options.deliveryId;
	}
	get interactions() {
		return openInteractions(this.#view).flatMap((row) => interaction$1(this.#view, row.interactionId) ?? []);
	}
	get boundary() {
		return this.#boundary;
	}
	observe(event) {
		foldReceivedEvent(this.#view, event);
		if (this.#deliveryId === void 0 ? endsTurn(event) : event.type === "session.ended" || event.type === "delivery.settled" && event.data.deliveryId === this.#deliveryId) this.#boundary = event;
		const meta = "meta" in event ? event.meta : void 0;
		const endOfLine = meta !== null && typeof meta === "object" && "endOfLine" in meta ? meta.endOfLine : void 0;
		return this.#boundary !== void 0 && endOfLine !== false;
	}
};

// src/client/delivery-events.ts
async function* deliveryEvents(source, deliveryId, signal, beforeAdmission) {
	const segment = new ResponseSegment({ deliveryId });
	let started = false;
	let admittingLine = [];
	for await (const event of source) {
		if (!started) {
			if (event.type === "session.ended") throw new Error("The session ended before admitting the accepted delivery.");
			if (admittingLine[0]?.meta.position.line !== event.meta.position.line) {
				for (const earlier of admittingLine) beforeAdmission?.(earlier);
				admittingLine = [];
			}
			admittingLine.push(event);
			if (event.type !== "delivery.admitted" || event.data.deliveryId !== deliveryId) continue;
			started = true;
		}
		const ready = admittingLine.length > 0 ? admittingLine : [event];
		admittingLine = [];
		for (const next of ready) {
			const ended = segment.observe(next);
			yield next;
			if (ended) return;
		}
	}
	if (!signal?.aborted) throw new Error("The stream ended before the accepted delivery settled.");
}

// src/protocol/session-http.ts
const EVE_SESSION_ID_HEADER = "x-eve-session-id";
const EVE_STREAM_TAIL_INDEX_HEADER = "x-eve-stream-tail-index";
const EVE_STREAM_VERSION_HEADER = "x-eve-stream-version";

// src/protocol/session-lines.ts
function isKnownRecordType(type) {
	return isFactType(type) || isProgressType(type);
}
function eventsOfLine(line, position, progressAt) {
	const records = "facts" in line ? line.facts : [line.progress];
	const at = "facts" in line ? line.at : progressAt;
	const events = [];
	records.forEach((raw, index) => {
		if (raw === null || typeof raw !== "object") return;
		const record = raw;
		if (!isKnownRecordType(record.type)) return;
		events.push({
			...record,
			meta: {
				at,
				endOfLine: false,
				position: {
					index,
					line: position
				}
			}
		});
	});
	const last = events.at(-1);
	if (last !== void 0) events[events.length - 1] = {
		...last,
		meta: {
			...last.meta,
			endOfLine: true
		}
	};
	return events;
}
function createEventReader(progressAt = (/* @__PURE__ */ new Date(0)).toISOString()) {
	let lastAt = progressAt;
	return { read(line, position) {
		if ("facts" in line) lastAt = line.at;
		return eventsOfLine(line, position, lastAt);
	} };
}

// src/protocol/session-events/envelope.ts
function classifyRecord(value) {
	if (value === null || typeof value !== "object" || Array.isArray(value)) return {
		kind: "invalid",
		value
	};
	const record = value;
	if (typeof record.$eve === "string") switch (record.$eve) {
		case "position": return typeof record.next === "number" && Number.isSafeInteger(record.next) ? {
			kind: "transport",
			record: {
				$eve: "position",
				next: record.next
			}
		} : {
			kind: "unknown-transport",
			name: record.$eve
		};
		case "heartbeat":
		case "stream.lease-ended":
		case "stream.ended": return {
			kind: "transport",
			record: { $eve: record.$eve }
		};
		default: return {
			kind: "unknown-transport",
			name: record.$eve
		};
	}
	if (Array.isArray(record.facts) && typeof record.at === "string") return {
		kind: "commit",
		line: value
	};
	if (record.progress !== null && typeof record.progress === "object") return {
		kind: "progress",
		line: value
	};
	return {
		kind: "invalid",
		value
	};
}
function isStoredLine(value) {
	const { kind } = classifyRecord(value);
	return kind === "commit" || kind === "progress";
}
const lineEncoder = new TextEncoder();

// src/protocol/v26-lines.ts
function isV26Line(record) {
	return typeof record === "object" && record !== null && !Array.isArray(record) && typeof record.type === "string" && !isStoredLine(record);
}

// src/client/ndjson.ts
function isStreamDisconnectError(error) {
	if (error instanceof DOMException) return error.name === "AbortError";
	if (!(error instanceof Error)) return false;
	const errorCode = "code" in error && typeof error.code === "string" ? error.code : void 0;
	return error.name === "AbortError" || error.message === "terminated" || errorCode === "UND_ERR_SOCKET" || error instanceof TypeError && /^(?:failed to fetch|fetch failed|load failed|networkerror when attempting to fetch resource\.)$/i.test(error.message) || /abort|cancel|disconnect|premature close|socket|terminated/i.test(error.message);
}
async function* readNdjsonStream(body, options = {}) {
	const reader = body.getReader();
	const decoder = new TextDecoder();
	let buffer = "";
	let reachedEof = false;
	const abort = () => {
		reader.cancel().catch(() => {});
	};
	options.signal?.addEventListener("abort", abort, { once: true });
	try {
		while (true) {
			throwIfAborted(options.signal);
			const result = await readWithIdleTimeout(reader, options.idleTimeoutMs);
			throwIfAborted(options.signal);
			if (result.done) {
				reachedEof = true;
				buffer += decoder.decode();
				break;
			}
			if (result.value) buffer += decoder.decode(result.value, { stream: true });
			let newlineIndex = buffer.indexOf("\n");
			while (newlineIndex !== -1) {
				const line = buffer.slice(0, newlineIndex).trim();
				buffer = buffer.slice(newlineIndex + 1);
				if (line.length > 0) yield parseRecord(line);
				newlineIndex = buffer.indexOf("\n");
			}
		}
		const trailing = buffer.trim();
		if (trailing.length > 0) yield parseRecord(trailing);
	} finally {
		options.signal?.removeEventListener("abort", abort);
		if (!reachedEof) reader.cancel().catch(() => {});
		reader.releaseLock();
	}
}
function parseRecord(line) {
	let value;
	try {
		value = JSON.parse(line);
	} catch {
		return {
			kind: "invalid",
			value: line
		};
	}
	return classifyRecord(value);
}
async function readWithIdleTimeout(reader, idleTimeoutMs) {
	let timeout;
	try {
		if (idleTimeoutMs === void 0) return await reader.read();
		return await Promise.race([reader.read(), new Promise((_resolve, reject) => {
			timeout = setTimeout(() => reject(new DOMException("Session stream was idle.", "AbortError")), idleTimeoutMs);
		})]);
	} catch (error) {
		if (error instanceof TypeError) throw new Error("Session stream disconnected.", { cause: error });
		throw error;
	} finally {
		if (timeout !== void 0) clearTimeout(timeout);
	}
}

// src/client/stream-version.ts
function readMessageStreamVersion(headers) {
	const version = headers.get(EVE_STREAM_VERSION_HEADER);
	if (version === "27") return version;
	if (version === null) throw new TypeError(`Missing ${EVE_STREAM_VERSION_HEADER} response header.`);
	throw new TypeError(`Unsupported message stream version: ${version}.`);
}

// src/shared/eve-route-path.ts
const EVE_NAMED_AGENT_MOUNT_PATTERN = /^\/eve\/[a-z0-9][a-z0-9_-]*$/;
const EVE_NAMED_AGENT_PROTOCOL_PATTERN = /^\/eve\/[a-z0-9][a-z0-9_-]*\/v1$/;
function joinEveRoutePath(basePath, routePath) {
	const base = trimTrailingSlash$1(basePath);
	const route = routePath.startsWith("/") ? routePath : `/${routePath}`;
	if (route === "/eve/v1" || route.startsWith(`${"/eve/v1"}/`)) {
		if (EVE_NAMED_AGENT_MOUNT_PATTERN.test(base)) return `${base}${route.slice(4)}`;
		if (EVE_NAMED_AGENT_PROTOCOL_PATTERN.test(base)) return `${base}${route.slice(EVE_ROUTE_PREFIX.length)}`;
	}
	return `${base}${route}`;
}
function trimTrailingSlash$1(value) {
	if (value === "/") return "";
	return value.endsWith("/") ? value.slice(0, -1) : value;
}

// src/client/url.ts
function createClientUrl(baseUrl, routePath, searchParams) {
	const queryIndex = routePath.indexOf("?");
	const pathOnly = queryIndex === -1 ? routePath : routePath.slice(0, queryIndex);
	const embeddedQuery = queryIndex === -1 ? "" : routePath.slice(queryIndex + 1);
	const normalizedRoute = pathOnly.startsWith("/") ? pathOnly : `/${pathOnly}`;
	if (isAbsoluteUrl(baseUrl)) {
		const url = new URL(baseUrl);
		const basePath = trimTrailingSlash(url.pathname);
		url.pathname = joinEveRoutePath(basePath, normalizedRoute);
		mergeEmbeddedQuery(url.searchParams, embeddedQuery);
		mergeSearchParams(url.searchParams, searchParams);
		url.hash = "";
		return url.toString();
	}
	const url = new URL(baseUrl, "http://eve.local");
	const basePath = trimTrailingSlash(url.pathname);
	mergeEmbeddedQuery(url.searchParams, embeddedQuery);
	mergeSearchParams(url.searchParams, searchParams);
	return `${joinEveRoutePath(basePath, normalizedRoute)}${formatSearch(url.searchParams)}`;
}
function mergeEmbeddedQuery(target, embeddedQuery) {
	if (embeddedQuery.length === 0) return;
	for (const [name, value] of new URLSearchParams(embeddedQuery)) target.append(name, value);
}
function isAbsoluteUrl(value) {
	return /^[a-z][a-z\d+\-.]*:/i.test(value);
}
function trimTrailingSlash(value) {
	if (value === "/") return "";
	return value.endsWith("/") ? value.slice(0, -1) : value;
}
function mergeSearchParams(target, searchParams) {
	if (searchParams === void 0) return;
	for (const [name, value] of Object.entries(searchParams)) target.set(name, value);
}
function formatSearch(searchParams) {
	const value = searchParams.toString();
	return value.length === 0 ? "" : `?${value}`;
}

// src/client/open-stream.ts
const DEFAULT_STREAM_READ_IDLE_TIMEOUT_MS = 3e4;
const RECONNECT_BACKOFF = {
	baseDelayMs: 250,
	maxDelayMs: 5e3
};
const DEFAULT_STREAM_RECONNECT_POLICY = {
	reconnect: true,
	retryableStatuses: /* @__PURE__ */ new Set([
		404,
		409,
		425,
		500,
		502,
		503,
		504
	]),
	baseDelayMs: 250,
	maxAttempts: 12,
	maxDelayMs: 5e3
};
const NO_STREAM_RECONNECT_POLICY = {
	...DEFAULT_STREAM_RECONNECT_POLICY,
	reconnect: false,
	maxAttempts: 1
};
function isRetryableStreamError(error, statuses = DEFAULT_STREAM_RECONNECT_POLICY.retryableStatuses) {
	if (error instanceof ClientSessionStrandedError) return false;
	if (SessionNotActiveError.is(error)) return statuses.has(409);
	if (error instanceof ClientError) return error.code !== "session_version_unsupported" && statuses.has(error.status);
	return isStreamDisconnectError(error);
}
function resolveStreamReconnectPolicy(options) {
	if (options === false) return NO_STREAM_RECONNECT_POLICY;
	const defaults = DEFAULT_STREAM_RECONNECT_POLICY;
	return {
		reconnect: true,
		retryableStatuses: options?.retryableStatuses ? new Set(options.retryableStatuses) : defaults.retryableStatuses,
		baseDelayMs: options?.baseDelayMs ?? defaults.baseDelayMs,
		maxAttempts: options?.maxAttempts ?? defaults.maxAttempts,
		maxDelayMs: options?.maxDelayMs ?? defaults.maxDelayMs
	};
}
async function* followStreamLines(input) {
	const resolvePolicy = () => resolveStreamReconnectPolicy(input.resolveReconnectPolicy === void 0 ? input.reconnect : input.resolveReconnectPolicy());
	const bounded = input.follow === false || input.onCaughtUp !== void 0;
	let startIndex = input.startIndex;
	let reconnectDelayMs = RECONNECT_BACKOFF.baseDelayMs;
	let failures = 0;
	let tailIndex;
	let caughtUp = false;
	const passedTail = () => tailIndex !== void 0 && startIndex > tailIndex;
	const noteProgress = () => {
		if (!caughtUp && passedTail()) {
			caughtUp = true;
			input.onCaughtUp?.();
		}
		return input.follow === false && passedTail();
	};
	while (true) {
		const retryPolicy = resolvePolicy();
		let connection;
		try {
			connection = await openStreamBody({
				...input,
				retryPolicy,
				startIndex,
				requestTailIndex: (bounded || startIndex < 0) && tailIndex === void 0
			});
		} catch (error) {
			if (input.signal?.aborted) return;
			throw error;
		}
		if ((bounded || startIndex < 0) && tailIndex === void 0) {
			tailIndex = connection.tailIndex;
			if (tailIndex === void 0) {
				connection.close();
				throw new Error(`This read requires the server to report the ${EVE_STREAM_TAIL_INDEX_HEADER} header. The agent may be running an older eve version.`);
			}
			if (startIndex < 0) startIndex = Math.max(0, tailIndex + 1 + startIndex);
		}
		try {
			input.onOpen?.(connection.headers);
		} catch (error) {
			connection.close();
			throw error;
		}
		if (noteProgress()) {
			connection.close();
			return;
		}
		let streamEnded = false;
		let leaseEnded = false;
		try {
			for await (const record of readNdjsonStream(connection.body, {
				signal: input.signal,
				idleTimeoutMs: input.streamReadIdleTimeoutMs ?? DEFAULT_STREAM_READ_IDLE_TIMEOUT_MS
			})) switch (record.kind) {
				case "transport":
					switch (record.record.$eve) {
						case "position":
							if (record.record.next > startIndex) startIndex = record.record.next;
							input.onPosition?.(startIndex);
							if (noteProgress()) return;
							break;
						case "stream.lease-ended":
							leaseEnded = true;
							break;
						case "stream.ended": streamEnded = true;
					}
					continue;
				case "unknown-transport": continue;
				case "commit":
				case "progress":
				case "invalid": {
					if (record.kind === "invalid" && isV26Line(record.value)) throw new ClientError(409, JSON.stringify({
						code: "session_version_unsupported",
						error: "This session was started by an earlier eve version. Start a new session."
					}));
					const position = startIndex;
					startIndex += 1;
					failures = 0;
					reconnectDelayMs = RECONNECT_BACKOFF.baseDelayMs;
					yield {
						line: record.kind === "invalid" ? void 0 : record.line,
						position
					};
					input.onPosition?.(startIndex);
					if (noteProgress()) return;
				}
			}
		} catch (error) {
			if (!isStreamDisconnectError(error)) throw error;
		} finally {
			connection.close();
		}
		if (streamEnded || input.signal?.aborted || !resolvePolicy().reconnect) return;
		if (leaseEnded) continue;
		failures += 1;
		if (input.follow === false && failures >= retryPolicy.maxAttempts) throw new Error("The session stream kept disconnecting before the read reached its tail.");
		await sleep(reconnectDelayMs, input.signal);
		if (input.signal?.aborted) return;
		reconnectDelayMs = Math.min(reconnectDelayMs * 2, RECONNECT_BACKOFF.maxDelayMs);
	}
}
async function* followStreamIterable(input) {
	const events = createEventReader();
	for await (const { line, position } of followStreamLines(input)) {
		if (line === void 0) continue;
		const lineEvents = events.read(line, position);
		for (const [index, event] of lineEvents.entries()) yield {
			cursor: index === lineEvents.length - 1 ? position + 1 : position,
			event
		};
	}
}
async function openStreamBody(input) {
	const retryPolicy = input.retryPolicy ?? resolveStreamReconnectPolicy(input.reconnect);
	let lastStatus;
	let lastBody;
	let lastHeaders;
	let retryDelayMs = retryPolicy.baseDelayMs;
	const searchParams = { ...input.searchParams };
	if (input.startIndex !== 0) searchParams.startIndex = String(input.startIndex);
	if (input.requestTailIndex === true) searchParams.includeTailIndex = "1";
	if (input.follow === false) searchParams.follow = "false";
	for (let attempt = 0; attempt < retryPolicy.maxAttempts; attempt += 1) {
		throwIfAborted(input.signal);
		const url = createClientUrl(input.baseUrl, input.path, Object.keys(searchParams).length > 0 ? searchParams : void 0);
		const headers = await input.resolveHeaders();
		throwIfAborted(input.signal);
		const connectionController = new AbortController();
		const signal = input.signal ? AbortSignal.any([input.signal, connectionController.signal]) : connectionController.signal;
		let response;
		try {
			response = await fetch(url, {
				cache: "no-store",
				headers,
				redirect: input.redirect,
				signal
			});
		} catch (error) {
			if (input.redirect === "error" && error instanceof Error && error.cause instanceof Error && error.cause.message === "unexpected redirect") throw new Error("The session stream refused a redirect. Use the final agent URL instead.", { cause: error });
			if (input.signal?.aborted || !isStreamDisconnectError(error) || attempt === retryPolicy.maxAttempts - 1) throw error;
			await sleep(retryDelayMs, input.signal);
			retryDelayMs = Math.min(retryDelayMs * 2, retryPolicy.maxDelayMs);
			continue;
		}
		if (response.ok) {
			if (!response.body) throw new ClientError(response.status, "Response body is null.", response.headers);
			try {
				readMessageStreamVersion(response.headers);
			} catch (error) {
				response.body.cancel().catch(() => {});
				connectionController.abort();
				throw error;
			}
			let closed = false;
			return {
				headers: response.headers,
				body: response.body,
				close: () => {
					if (closed) return;
					closed = true;
					response.body?.cancel().catch(() => {});
					connectionController.abort();
				},
				tailIndex: parseTailIndexHeader(response.headers)
			};
		}
		lastStatus = response.status;
		lastBody = await response.text();
		lastHeaders = response.headers;
		const error = createClientError(response.status, lastBody, response.headers);
		if (!isRetryableStreamError(error, retryPolicy.retryableStatuses)) throw error;
		if (attempt < retryPolicy.maxAttempts - 1) {
			await sleep(retryDelayMs, input.signal);
			retryDelayMs = Math.min(retryDelayMs * 2, retryPolicy.maxDelayMs);
		}
	}
	throw new ClientError(lastStatus ?? 0, lastBody ?? "Failed to open message stream.", lastHeaders);
}
function parseTailIndexHeader(headers) {
	const raw = headers.get(EVE_STREAM_TAIL_INDEX_HEADER);
	if (raw === null || !/^-?\d+$/.test(raw)) return;
	const parsed = Number(raw);
	return Number.isSafeInteger(parsed) ? parsed : void 0;
}
async function sleep(ms, signal) {
	if (signal?.aborted) return;
	await new Promise((resolve) => {
		const onAbort = () => {
			clearTimeout(timer);
			resolve();
		};
		const timer = setTimeout(() => {
			signal?.removeEventListener("abort", onAbort);
			resolve();
		}, ms);
		signal?.addEventListener("abort", onAbort, { once: true });
	});
}

// src/protocol/descendant-observation.ts
const EVE_OBSERVATION_KEY_HEADER = "x-eve-observation-key";
function localObservationKey(sessionId) {
	return JSON.stringify(["local", sessionId]);
}

// src/client/agent-session.ts
var ClientAgentSession = class ClientAgentSession {
	name;
	id;
	taskId;
	#context;
	#rootId;
	#children;
	constructor(context, rootId, opened, children = []) {
		const position = opened.meta?.position?.line;
		if (!Number.isSafeInteger(position) || position < 0) throw new TypeError("Pass a received child.opened event with its committed source position.");
		this.#context = context;
		this.#rootId = rootId;
		this.#children = [...children, {
			sessionId: opened.data.sessionId,
			position
		}];
		this.name = opened.data.name;
		this.id = opened.data.sessionId;
		this.taskId = opened.scope?.taskId ?? ("taskId" in opened.data.owner ? opened.data.owner.taskId : void 0);
	}
	agent(opened) {
		return new ClientAgentSession(this.#context, this.#rootId, opened, this.#children);
	}
	async *stream(options) {
		for await (const { event } of this.follow(options)) yield event;
	}
	follow(options, onIdentity, onCaughtUp, onPosition) {
		return followStreamIterable({
			follow: options?.follow,
			onCaughtUp,
			onPosition,
			baseUrl: this.#context.baseUrl,
			path: createEveDescendantStreamRoutePath(this.#rootId),
			searchParams: { children: JSON.stringify(this.#children) },
			redirect: "error",
			resolveHeaders: () => this.#context.resolveHeaders(),
			signal: options?.signal,
			startIndex: options?.startIndex ?? 0,
			reconnect: options?.reconnect,
			onOpen: (headers) => {
				if (onIdentity === void 0) return;
				const key = headers.get(EVE_OBSERVATION_KEY_HEADER);
				if (key === null || key.length > 8192) throw new ClientError(422, "Descendant reader provenance is unavailable.");
				onIdentity(key);
			}
		});
	}
};

// src/client/file-parts.ts
const BASE64_CHUNK_SIZE = 32768;
function messageForRequest(message) {
	if (typeof message === "string") return message;
	return message.map((part) => {
		if (part.type !== "file") return part;
		if (!(part.data instanceof Uint8Array || part.data instanceof ArrayBuffer)) return part;
		const base64 = bytesToBase64(new Uint8Array(part.data));
		return {
			...part,
			data: `data:${part.mediaType};base64,${base64}`
		};
	});
}
function bytesToBase64(bytes) {
	let binary = "";
	for (let offset = 0; offset < bytes.length; offset += BASE64_CHUNK_SIZE) {
		const chunk = bytes.subarray(offset, offset + BASE64_CHUNK_SIZE);
		binary += String.fromCodePoint(...chunk);
	}
	return btoa(binary);
}

// src/client/delivery.ts
const sendReceipts = /* @__PURE__ */ new WeakMap();
var StreamDelivery = class {
	sessionId;
	deliveryId;
	inbox;
	#createStream;
	#result;
	constructor(input) {
		this.sessionId = input.sessionId;
		this.inbox = input.inbox;
		this.deliveryId = input.deliveryId;
		if (input.receipt !== void 0) sendReceipts.set(this, input.receipt);
		this.#createStream = input.createStream;
	}
	async *stream(options) {
		throwIfAborted(options?.signal);
		for await (const event of this.#createStream(options)) {
			throwIfAborted(options?.signal);
			yield event;
		}
		throwIfAborted(options?.signal);
	}
	async result(options) {
		throwIfAborted(options?.signal);
		if (this.#result !== void 0) return this.#result;
		const accumulator = turnSummary(this.deliveryId);
		for await (const event of this.stream(options)) accumulator.observe(event);
		const summary = accumulator.result();
		if (summary.status === "working" || summary.outcome === void 0) throw new Error("The stream ended before the accepted delivery settled.");
		const data = {
			data: summary.result,
			deliveryId: this.deliveryId,
			interactions: summary.interactions,
			outcome: summary.outcome,
			reply: summary.message,
			sessionEnded: summary.sessionEnded,
			sessionId: this.sessionId
		};
		const result = summary.status === "failed" ? {
			...data,
			status: "failed",
			error: summary.failure ?? {
				code: "DELIVERY_FAILED",
				message: "The delivery failed."
			}
		} : {
			...data,
			status: summary.status
		};
		this.#result = result;
		return result;
	}
};

// src/protocol/prewarm-session.ts
const PrewarmResponseSchema = z.object({
	ok: z.literal(true),
	status: z.enum([
		"ready",
		"accepted",
		"unsupported",
		"no_active_session"
	])
});

// src/protocol/delivery.ts
const DeliveryResponseSchema = z.object({
	ok: z.literal(true),
	sessionId: z.string().min(1),
	deliveryId: z.string().min(1)
});

// src/client/session-controls.ts
const paths = {
	cancel: createEveSessionCancelRoutePath,
	clear: createEveSessionClearRoutePath,
	compact: createEveSessionCompactRoutePath,
	end: createEveSessionEndRoutePath
};
async function prewarmClientSession(input) {
	const response = await fetch(createClientUrl(input.context.baseUrl, createEveSessionRoutePath(input.sessionId)), {
		headers: await input.context.resolveHeaders(),
		method: "POST",
		signal: input.signal,
		redirect: input.context.redirect
	});
	const text = await response.text();
	if (!response.ok) throw createClientError(response.status, text, response.headers);
	let payload;
	try {
		payload = JSON.parse(text);
	} catch {
		throw new Error(`Prewarm route returned invalid JSON (${response.status}).`);
	}
	const result = PrewarmResponseSchema.safeParse(payload);
	if (!result.success) throw new Error("Prewarm route returned an invalid response.");
	return { status: result.data.status };
}
async function sendClientControl(input) {
	const { signal, turnId, reason } = input.options ?? {};
	const body = input.kind === "cancel" ? { turnId } : input.kind === "end" ? { reason } : {};
	const headers = await input.context.resolveHeaders();
	headers.set("content-type", "application/json");
	const response = await fetch(createClientUrl(input.context.baseUrl, paths[input.kind](input.sessionId)), {
		body: JSON.stringify(body),
		headers,
		method: "POST",
		signal,
		redirect: input.context.redirect
	});
	const text = await response.text();
	if (!response.ok) throw createClientError(response.status, text, response.headers);
	let payload;
	try {
		payload = JSON.parse(text);
	} catch {
		throw new Error(`${input.kind} route returned invalid JSON (${response.status}).`);
	}
	const result = DeliveryResponseSchema.safeParse(payload);
	if (!result.success || result.data.sessionId !== input.sessionId) throw new Error(`${input.kind} route returned an invalid delivery receipt.`);
	return {
		sessionId: result.data.sessionId,
		deliveryId: result.data.deliveryId
	};
}

// src/shared/errors.ts
function toErrorMessage(error) {
	if (error instanceof Error) return error.message;
	if (typeof error === "string") return error;
	if (error === null || error === void 0) return String(error);
	if (isObject$1(error)) {
		if (typeof error.message === "string" && error.message.length > 0) return error.message;
		return safeJsonStringify(error);
	}
	return String(error);
}
function toError(raw) {
	if (raw instanceof Error) return raw;
	const error = new Error(toErrorMessage(raw));
	if (!isObject$1(raw)) return error;
	if (typeof raw.name === "string" && raw.name.length > 0) error.name = raw.name;
	if (typeof raw.stack === "string" && raw.stack.length > 0) error.stack = raw.stack;
	if ("cause" in raw && raw.cause !== void 0 && raw.cause !== raw) error.cause = raw.cause;
	return error;
}
function safeJsonStringify(value) {
	try {
		return JSON.stringify(value) ?? String(value);
	} catch {
		return String(value);
	}
}

// src/shared/json.ts
const INVALID_JSON_VALUE_CANDIDATE = Symbol("invalid-json-value-candidate");
const JSON_VALUE_ERROR_MESSAGE = "Expected a JSON-serializable value.";
const JSON_OBJECT_ERROR_MESSAGE = "Expected a JSON-serializable object.";
function parseJsonValue(value) {
	const normalized = normalizeJsonValueCandidate(value);
	if (normalized === INVALID_JSON_VALUE_CANDIDATE) throw new TypeError(JSON_VALUE_ERROR_MESSAGE);
	return normalized;
}
function parseJsonObject(value) {
	const normalized = parseJsonValue(value);
	if (!isJsonObjectValue(normalized)) throw new TypeError(JSON_OBJECT_ERROR_MESSAGE);
	return normalized;
}
function normalizeJsonValueCandidate(value, seen = /* @__PURE__ */ new WeakSet()) {
	if (value === null || typeof value === "boolean" || typeof value === "string") return value;
	if (typeof value === "number") return Number.isFinite(value) ? value : INVALID_JSON_VALUE_CANDIDATE;
	if (Array.isArray(value)) {
		const normalizedItems = [];
		for (const item of value) {
			const normalizedItem = normalizeJsonValueCandidate(item, seen);
			if (normalizedItem === INVALID_JSON_VALUE_CANDIDATE) return INVALID_JSON_VALUE_CANDIDATE;
			normalizedItems.push(normalizedItem);
		}
		return normalizedItems;
	}
	if (typeof value !== "object" || value === void 0) return INVALID_JSON_VALUE_CANDIDATE;
	if (!isPlainObject(value)) return INVALID_JSON_VALUE_CANDIDATE;
	if (seen.has(value)) return INVALID_JSON_VALUE_CANDIDATE;
	seen.add(value);
	const normalized = {};
	for (const [key, entry] of Object.entries(value)) {
		if (entry === void 0) continue;
		const normalizedEntry = normalizeJsonValueCandidate(entry, seen);
		if (normalizedEntry === INVALID_JSON_VALUE_CANDIDATE) return INVALID_JSON_VALUE_CANDIDATE;
		normalized[key] = normalizedEntry;
	}
	seen.delete(value);
	return normalized;
}
function isJsonObjectValue(value) {
	return value !== null && !Array.isArray(value) && typeof value === "object";
}
function isPlainObject(value) {
	const prototype = Object.getPrototypeOf(value);
	return prototype === null || Object.getPrototypeOf(prototype) === null;
}

// src/tools/schema-emission.ts
const JSON_SCHEMA_TARGET = "draft-07";
function serializeOutputSchema(source) {
	if (source === null || source === void 0) return source;
	return emitJsonSchema(source, "output");
}
function emitJsonSchema(source, direction) {
	const standard = getStandardSchemaProperties(source);
	if (standard === void 0) return withoutSchemaVersion(parseJsonObject(source));
	const emit = readJsonSchemaEmitter(standard, direction);
	if (emit === void 0) throw new Error(describeMissingEmitter(standard));
	return withoutSchemaVersion(parseJsonObject(emit({ target: JSON_SCHEMA_TARGET })));
}
function readJsonSchemaEmitter(standard, direction) {
	const jsonSchema = standard.jsonSchema;
	if (typeof jsonSchema !== "object" || jsonSchema === null) return void 0;
	const emit = jsonSchema[direction];
	return typeof emit === "function" ? emit : void 0;
}
function getStandardSchemaProperties(value) {
	if (typeof value !== "object" || value === null || !("~standard" in value)) return void 0;
	const standard = value["~standard"];
	return typeof standard === "object" && standard !== null ? standard : void 0;
}
function describeMissingEmitter(standard) {
	const vendor = typeof standard.vendor === "string" ? standard.vendor : "unknown";
	if (vendor === "zod") return "Zod 3 cannot emit an output JSON Schema. Upgrade to Zod 4 or provide a plain JSON Schema object.";
	return `Standard Schema vendor "${vendor}" does not support JSON Schema conversion. Provide a Standard Schema implementation with JSON Schema conversion or a plain JSON Schema object.`;
}
function withoutSchemaVersion(schema) {
	const { $schema: _schemaVersion, ...canonical } = schema;
	return canonical;
}

// src/tools/schema.ts
function defineJsonSchema(schema, check) {
	const emit = () => structuredClone(schema);
	const toolSchema = { "~standard": {
		version: 1,
		vendor: "eve",
		validate: createJsonSchemaValidator(schema, check),
		jsonSchema: {
			input: emit,
			output: emit
		}
	} };
	plainJsonSchemas.add(toolSchema);
	return toolSchema;
}
const plainJsonSchemas = /* @__PURE__ */ new WeakSet();
const UNSPECIFIED_INPUT_SCHEMA = defineJsonSchema({});
function createJsonSchemaValidator(schema, check) {
	let validator;
	let warned = false;
	const passThrough = (value, reason) => {
		if (!warned) {
			warned = true;
			console.warn(`[eve] Tool schema cannot validate values locally; passing them through unvalidated: ${reason}`);
		}
		return { value };
	};
	return (value) => {
		if (validator === void 0) {
			const built = buildValidator(schema);
			if (typeof built === "string") {
				validator = null;
				return passThrough(value, built);
			}
			validator = built;
		}
		if (validator === null) return { value };
		let result;
		try {
			result = validator.validate(value);
		} catch (error) {
			if (value === void 0) return { issues: [{ message: "Expected a JSON value." }] };
			return passThrough(value, toErrorMessage(error));
		}
		if (!result.valid) return { issues: toIssues(result.errors) };
		const filled = applyDefaults(schema, schema, value);
		const message = check?.(filled);
		return message === void 0 ? { value: filled } : { issues: [{ message }] };
	};
}
function applyDefaults(root, schema, value) {
	let result = value;
	for (const node of followRefs(root, schema)) {
		const { items, properties } = node;
		if (isObject$1(result) && isObject$1(properties)) result = fillProperties(root, properties, result);
		else if (Array.isArray(result) && isObject$1(items)) {
			const list = result;
			const next = list.map((item) => applyDefaults(root, items, item));
			if (next.some((item, index) => item !== list[index])) result = next;
		}
	}
	return result;
}
function fillProperties(root, properties, value) {
	let result = value;
	for (const [key, property] of Object.entries(properties)) {
		const current = Object.hasOwn(value, key) ? value[key] : void 0;
		const next = current === void 0 ? findDefault(root, property) : applyDefaults(root, property, current);
		if (next === current) continue;
		if (result === value) result = { ...value };
		result[key] = next;
	}
	return result;
}
function findDefault(root, schema) {
	for (const node of followRefs(root, schema)) if ("default" in node) return structuredClone(node.default);
}
function* followRefs(root, schema) {
	const seen = /* @__PURE__ */ new Set();
	let node = schema;
	while (isObject$1(node) && !seen.has(node)) {
		seen.add(node);
		yield node;
		node = resolveLocalRef(root, node.$ref);
	}
}
function resolveLocalRef(root, ref) {
	if (typeof ref !== "string" || ref !== "#" && !ref.startsWith("#/")) return void 0;
	let node = root;
	for (const segment of decodePointer(ref)) {
		if (typeof node !== "object" || node === null || !Object.hasOwn(node, segment)) return;
		node = node[segment];
	}
	return node;
}
function buildValidator(schema) {
	try {
		const copy = structuredClone(schema);
		return prepareForValidation(copy) ?? new Validator(copy, "2020-12", false);
	} catch (error) {
		return toErrorMessage(error);
	}
}
const JSON_TYPES = /* @__PURE__ */ new Set([
	"array",
	"boolean",
	"integer",
	"null",
	"number",
	"object",
	"string"
]);
const EXCLUSIVE_BOUNDS = [["exclusiveMinimum", "minimum"], ["exclusiveMaximum", "maximum"]];
const SUBSCHEMA_KEYWORDS = [
	"additionalItems",
	"additionalProperties",
	"contains",
	"else",
	"if",
	"not",
	"propertyNames",
	"then",
	"unevaluatedItems",
	"unevaluatedProperties"
];
const SUBSCHEMA_LIST_KEYWORDS = [
	"allOf",
	"anyOf",
	"oneOf",
	"prefixItems"
];
const SUBSCHEMA_MAP_KEYWORDS = [
	"$defs",
	"definitions",
	"dependencies",
	"dependentSchemas",
	"patternProperties",
	"properties"
];
function prepareForValidation(schema) {
	if (typeof schema === "boolean") return void 0;
	if (typeof schema !== "object" || schema === null || Array.isArray(schema)) return "a subschema is neither an object nor a boolean";
	const node = schema;
	delete node.format;
	for (const [flag, bound] of EXCLUSIVE_BOUNDS) {
		if (typeof node[flag] !== "boolean") continue;
		if (node[flag] && typeof node[bound] === "number") {
			node[flag] = node[bound];
			delete node[bound];
		} else delete node[flag];
	}
	const { enum: values, pattern, required, type } = node;
	if (type !== void 0 && !(Array.isArray(type) ? type.every(isJsonType) : isJsonType(type))) return `unsupported type ${JSON.stringify(type)}`;
	if (values !== void 0 && !Array.isArray(values)) return "`enum` is not an array";
	if (required !== void 0 && !(Array.isArray(required) && required.every((key) => typeof key === "string"))) return "`required` is not an array of strings";
	if (pattern !== void 0 && !isRegExpSource(pattern)) return `invalid pattern ${JSON.stringify(pattern)}`;
	for (const keyword of SUBSCHEMA_KEYWORDS) if (keyword in node) {
		const problem = prepareForValidation(node[keyword]);
		if (problem !== void 0) return problem;
	}
	const items = node.items;
	for (const subschema of Array.isArray(items) ? items : items === void 0 ? [] : [items]) {
		const problem = prepareForValidation(subschema);
		if (problem !== void 0) return problem;
	}
	for (const keyword of SUBSCHEMA_LIST_KEYWORDS) {
		const list = node[keyword];
		if (list === void 0) continue;
		if (!Array.isArray(list)) return `\`${keyword}\` is not an array`;
		for (const subschema of list) {
			const problem = prepareForValidation(subschema);
			if (problem !== void 0) return problem;
		}
	}
	for (const keyword of SUBSCHEMA_MAP_KEYWORDS) {
		const map = node[keyword];
		if (map === void 0) continue;
		if (typeof map !== "object" || map === null || Array.isArray(map)) return `\`${keyword}\` is not an object`;
		for (const [key, subschema] of Object.entries(map)) {
			if (keyword === "patternProperties" && !isRegExpSource(key)) return `invalid pattern ${JSON.stringify(key)}`;
			if (keyword === "dependencies" && Array.isArray(subschema)) continue;
			const problem = prepareForValidation(subschema);
			if (problem !== void 0) return problem;
		}
	}
}
function isJsonType(value) {
	return typeof value === "string" && JSON_TYPES.has(value);
}
function isRegExpSource(value) {
	if (typeof value !== "string") return false;
	try {
		new RegExp(value, "u");
		return true;
	} catch {
		return false;
	}
}
const CLOSED_OBJECT_KEYWORD = /\/(?:additional|unevaluated)Properties$/;
function toIssues(errors) {
	const failures = [];
	for (let index = 0; index < errors.length; index++) {
		const unit = errors[index];
		const rejected = errors[index + 1];
		if (CLOSED_OBJECT_KEYWORD.test(unit.keywordLocation) && rejected?.keyword === "false") {
			const key = decodePointer(rejected.instanceLocation).at(-1);
			failures.push({
				keyword: "false",
				location: rejected.instanceLocation,
				message: `Unrecognized key: ${JSON.stringify(key)}`,
				object: unit.instanceLocation
			});
			index++;
		} else failures.push({
			keyword: unit.keyword,
			location: unit.instanceLocation,
			message: unit.error
		});
	}
	const relevant = failures.filter((failure) => failure.object === void 0 || !failures.some((other) => other.object === void 0 && (other.location === failure.location || other.location.startsWith(`${failure.location}/`))));
	return relevant.filter((failure, index) => {
		const next = relevant[index + 1];
		if (next === void 0) return true;
		if (next.location.startsWith(`${failure.location}/`)) return false;
		return !(failure.keyword === "$ref" && next.location === failure.location);
	}).map(({ location, message, object }) => {
		const path = decodePointer(object ?? location);
		return path.length === 0 ? { message } : {
			message,
			path
		};
	});
}
function decodePointer(location) {
	return location.split("/").slice(1).map((segment) => {
		let decoded = segment;
		try {
			decoded = decodeURIComponent(segment);
		} catch {}
		return decoded.replaceAll("~1", "/").replaceAll("~0", "~");
	});
}

// src/client/session.ts
const SESSION_SEND_RETRY_BASE_DELAY_MS = 250;
const SESSION_SEND_RETRY_MAX_DELAY_MS = 2e3;
const SESSION_SEND_READY_TIMEOUT_MS = 2e4;
const followSession = Symbol("followClientSession");
var ClientSession = class ClientSession {
	#context;
	#state;
	constructor(context, state) {
		this.#context = context;
		this.#state = state;
	}
	static async create(context, input) {
		const startedAt = Date.now();
		const response = await postTurn(context, EVE_SESSION_ROUTE_PATH, input, true, input.stubs);
		const acceptedAt = Date.now();
		const { sessionId, deliveryId } = await readAcceptedMessage(response);
		const session = new ClientSession(context, {
			sessionId,
			streamIndex: 0
		});
		const receipt = {
			deliveryId,
			startedAt,
			notReadyMs: 0,
			acceptedAt
		};
		return {
			delivery: session.#messageResponse(response, input, 0, deliveryId, receipt),
			session
		};
	}
	static async prewarm(context, options = {}) {
		const { sessionId } = await readAcceptedMessage(await postCreateSession(context, options));
		return new ClientSession(context, {
			sessionId,
			streamIndex: 0
		});
	}
	get id() {
		return this.#state.sessionId;
	}
	get state() {
		return this.#state;
	}
	async snapshot(options) {
		throwIfAborted(options?.signal);
		const events = [];
		let streamIndex = 0;
		for await (const { cursor, event } of this.#readStream({
			follow: false,
			signal: options?.signal,
			startIndex: 0
		})) {
			events.push(event);
			streamIndex = cursor;
		}
		throwIfAborted(options?.signal);
		return {
			events,
			session: {
				...this.#state,
				streamIndex
			}
		};
	}
	async send(message, options = {}) {
		return await this.#send({
			...options,
			message
		}, true);
	}
	async respond(answers, options = {}) {
		if (answers.length === 0) throw new Error("ClientSession.respond() requires at least one answer.");
		return await this.#send({
			...options,
			answers
		}, false);
	}
	async #send(input, retrySessionNotReady) {
		const initialStreamIndex = this.#state.streamIndex;
		const path = createEveSessionRoutePath(this.#state.sessionId);
		const { response, timing } = await postSessionSend(this.#context, path, input, retrySessionNotReady, this.#state.inbox);
		const { sessionId: responseSessionId, deliveryId, inbox } = await readAcceptedMessage(response, this.#state.sessionId);
		if (responseSessionId !== this.#state.sessionId) throw new Error("Message route returned a different session id.");
		this.#state = {
			...this.#state,
			inbox
		};
		if (deliveryId === void 0) throw new Error("Message route did not return a delivery id. Update the server before sending with this client.");
		return this.#messageResponse(response, input, initialStreamIndex, deliveryId, {
			...timing,
			deliveryId
		});
	}
	async prewarm(options) {
		return await prewarmClientSession({
			context: this.#context,
			sessionId: this.#state.sessionId,
			signal: options?.signal
		});
	}
	async cancel(options) {
		return this.#control("cancel", options);
	}
	async clear(options) {
		return this.#control("clear", options);
	}
	async compact(options) {
		return this.#control("compact", options);
	}
	async end(options) {
		return this.#control("end", options);
	}
	async #control(kind, options) {
		const startIndex = this.#state.streamIndex;
		const receipt = await sendClientControl({
			context: this.#context,
			kind,
			options,
			sessionId: this.#state.sessionId
		});
		return new StreamDelivery({
			...receipt,
			createStream: (read) => this.#createEventStream(startIndex, { signal: read?.signal }, receipt.deliveryId, kind !== "end")
		});
	}
	stream(options) {
		return this.#streamAndAdvance(options);
	}
	agent(opened) {
		return new ClientAgentSession(this.#context, this.id, opened);
	}
	[followSession](options) {
		return this.#streamAndAdvance(options);
	}
	#messageResponse(response, input, initialStreamIndex, deliveryId, receipt) {
		response.body?.cancel().catch(() => {});
		if (deliveryId === void 0) throw new Error("Message route did not return a delivery id.");
		return new StreamDelivery({
			createStream: (read) => this.#createEventStream(initialStreamIndex, {
				...input,
				signal: read?.signal
			}, deliveryId),
			deliveryId,
			receipt,
			sessionId: this.#state.sessionId
		});
	}
	#createEventStream(initialStreamIndex, input, deliveryId, follow = true) {
		return deliveryEvents(this.#streamAndAdvance({
			follow,
			headers: input.headers,
			signal: input.signal,
			startIndex: initialStreamIndex,
			reconnect: input.reconnect
		}), deliveryId, input.signal);
	}
	async *#streamAndAdvance(options) {
		const startIndex = options?.startIndex ?? this.#state.streamIndex;
		for await (const { cursor, event } of this.#readStream({
			follow: options?.follow,
			headers: options?.headers,
			onCaughtUp: options?.onCaughtUp,
			resolveHeaders: options?.resolveHeaders,
			resolveReconnectPolicy: options?.resolveReconnectPolicy,
			signal: options?.signal,
			startIndex,
			reconnect: options?.reconnect
		})) {
			this.#advanceStreamIndex(cursor);
			yield event;
		}
	}
	#advanceStreamIndex(streamIndex) {
		this.#state = {
			...this.#state,
			streamIndex: Math.max(this.#state.streamIndex, streamIndex)
		};
	}
	#readStream(input) {
		return followStreamIterable({
			onCaughtUp: input.onCaughtUp,
			follow: input.follow,
			baseUrl: this.#context.baseUrl,
			resolveHeaders: () => this.#context.resolveHeaders(input.resolveHeaders?.() ?? input.headers),
			path: createEveSessionStreamRoutePath(this.#state.sessionId),
			redirect: this.#context.redirect,
			signal: input.signal,
			startIndex: input.startIndex,
			reconnect: input.reconnect,
			resolveReconnectPolicy: input.resolveReconnectPolicy
		});
	}
};
function followClientSession(session, options) {
	return session[followSession](options);
}
async function postSessionSend(context, path, input, retrySessionNotReady, inbox) {
	const startedAt = Date.now();
	const readyDeadline = startedAt + SESSION_SEND_READY_TIMEOUT_MS;
	let retryDelayMs = SESSION_SEND_RETRY_BASE_DELAY_MS;
	for (;;) {
		const attemptAt = Date.now();
		try {
			return {
				response: await postTurn(context, path, input, false, void 0, inbox),
				timing: {
					startedAt,
					notReadyMs: attemptAt - startedAt,
					acceptedAt: Date.now()
				}
			};
		} catch (error) {
			if (!retrySessionNotReady || !isSessionNotReady(error)) throw error;
			const remainingMs = readyDeadline - Date.now();
			if (remainingMs <= 0) throw error;
			await sleep(Math.min(retryDelayMs, remainingMs), input.signal);
		}
		throwIfAborted(input.signal);
		retryDelayMs = Math.min(retryDelayMs * 2, SESSION_SEND_RETRY_MAX_DELAY_MS);
	}
}
async function postCreateSession(context, options) {
	const headers = await context.resolveHeaders(options.headers);
	const body = options.stubs === void 0 ? void 0 : JSON.stringify({ stubs: options.stubs });
	if (body !== void 0) headers.set("content-type", "application/json");
	const response = await fetch(createClientUrl(context.baseUrl, EVE_SESSION_ROUTE_PATH), {
		body,
		headers,
		method: "POST",
		redirect: context.redirect,
		signal: options.signal ?? null
	});
	if (!response.ok) {
		const responseBody = await response.text();
		throw new ClientError(response.status, responseBody, response.headers);
	}
	return response;
}
function isSessionNotReady(error) {
	return SessionNotActiveError.is(error) && error.retryable;
}
async function postTurn(context, path, input, requireMessage, stubs, inbox) {
	const body = createMessageBody(input, requireMessage);
	if (body === null) throw new Error(requireMessage ? "Creating a session requires a non-empty message." : "A session turn requires a non-empty message or answers.");
	if (stubs !== void 0) body.stubs = stubs;
	if (inbox !== void 0) body.inbox = inbox;
	const headers = await context.resolveHeaders(input.headers);
	headers.set("content-type", "application/json");
	const response = await fetch(createClientUrl(context.baseUrl, path), {
		body: JSON.stringify(body),
		headers,
		method: "POST",
		redirect: context.redirect,
		signal: input.signal ?? null
	});
	if (!response.ok) {
		const responseBody = await response.text();
		throw createClientError(response.status, responseBody, response.headers);
	}
	return response;
}
async function readAcceptedMessage(response, expected) {
	const payload = await response.json();
	const sessionId = (typeof payload.sessionId === "string" ? payload.sessionId : void 0) ?? response.headers.get("x-eve-session-id")?.trim() ?? expected;
	if (!sessionId) throw new Error("Message route did not return a session id.");
	return {
		sessionId,
		inbox: typeof payload.inbox === "string" ? payload.inbox : void 0,
		deliveryId: typeof payload.deliveryId === "string" && payload.deliveryId.length > 0 ? payload.deliveryId : void 0
	};
}
function createMessageBody(input, requireMessage) {
	const body = {};
	if (input.message !== void 0) body.message = messageForRequest(input.message);
	if (input.answers !== void 0 && input.answers.length > 0) body.answers = input.answers;
	if (!requireMessage && input.message !== void 0 && input.turnPolicy !== void 0) body.turnPolicy = input.turnPolicy;
	if (input.clientContext !== void 0) body.clientContext = input.clientContext;
	const outputSchema = serializeOutputSchema(input.outputSchema);
	if (outputSchema !== void 0) body.outputSchema = outputSchema;
	if (requireMessage && body.message === void 0) return null;
	if (body.message === void 0 && body.answers === void 0) return null;
	return body;
}

// src/client/sessions.ts
var ClientSessions = class {
	#context;
	constructor(context) {
		this.#context = context;
	}
	async create(input = {}) {
		if ("message" in input) return await ClientSession.create(this.#context, input);
		return { session: await ClientSession.prewarm(this.#context, input) };
	}
	attach(sessionId, options) {
		if (sessionId.length === 0) throw new Error("sessionId must be a non-empty string.");
		return new ClientSession(this.#context, {
			sessionId,
			inbox: options?.inbox,
			streamIndex: options?.streamIndex ?? 0
		});
	}
};

// src/client/types.ts
const VERCEL_TRUSTED_OIDC_IDP_TOKEN_HEADER = "x-vercel-trusted-oidc-idp-token";

// src/client/client.ts
var Client = class {
	#auth;
	#headers;
	#baseUrl;
	#redirect;
	sessions;
	constructor(options) {
		this.#baseUrl = options.baseUrl;
		this.#auth = options.auth;
		this.#headers = options.headers;
		this.#redirect = options.redirect ?? "error";
		this.sessions = new ClientSessions({
			baseUrl: this.#baseUrl,
			redirect: this.#redirect,
			resolveHeaders: (perRequest) => this.#resolveHeaders(perRequest)
		});
	}
	async health() {
		const url = createClientUrl(this.#baseUrl, EVE_HEALTH_ROUTE_PATH);
		const headers = await this.#resolveHeaders();
		const response = await fetch(url, withRedirectPolicy({ headers }, this.#redirect));
		if (!response.ok) {
			const body = await response.text();
			throw new ClientError(response.status, body, response.headers);
		}
		let payload;
		try {
			payload = await response.json();
		} catch {
			throw new HealthResponseError();
		}
		const result = HealthResultSchema.safeParse(payload);
		if (!result.success) throw new HealthResponseError(result.error.issues.slice(0, 5).map((issue) => {
			const path = issue.path.join(".");
			return path.length === 0 ? issue.message : `${path}: ${issue.message}`;
		}));
		return result.data;
	}
	async info(options = {}) {
		const response = await this.fetch(EVE_INFO_ROUTE_PATH, options);
		if (!response.ok) {
			const body = await response.text();
			throw new ClientError(response.status, body, response.headers);
		}
		let payload;
		try {
			payload = await response.json();
		} catch {
			throw new AgentInfoResponseError();
		}
		const versionMismatch = describeAgentInfoVersionMismatch(payload);
		if (versionMismatch !== void 0) throw new AgentInfoResponseError([versionMismatch]);
		const result = AgentInfoResultSchema.safeParse(payload);
		if (!result.success) throw new AgentInfoResponseError(result.error.issues.slice(0, 5).map((issue) => {
			const path = issue.path.join(".");
			return path.length === 0 ? issue.message : `${path}: ${issue.message}`;
		}));
		return result.data;
	}
	async fetch(path, init = {}) {
		const url = createClientUrl(this.#baseUrl, path);
		const headers = await this.#resolveHeaders(headersInitToRecord(init.headers));
		return await fetch(url, withRedirectPolicy({
			...init,
			headers
		}, this.#redirect));
	}
	async #resolveHeaders(perRequest) {
		const headers = new Headers();
		const [baseHeaders, authHeaders] = await Promise.all([resolveHeadersValue(this.#headers), this.#resolveAuthHeaders()]);
		for (const [key, value] of Object.entries(baseHeaders)) headers.set(key, value);
		for (const [key, value] of Object.entries(authHeaders)) headers.set(key, value);
		if (perRequest) for (const [key, value] of Object.entries(perRequest)) headers.set(key, value);
		return headers;
	}
	async #resolveAuthHeaders() {
		const auth = this.#auth;
		if (!auth) return {};
		if ("vercelOidc" in auth) {
			const token = (await resolveTokenValue(auth.vercelOidc.token)).trim();
			if (token.length === 0) return {};
			return {
				authorization: `Bearer ${token}`,
				[VERCEL_TRUSTED_OIDC_IDP_TOKEN_HEADER]: token
			};
		}
		if ("bearer" in auth) {
			const token = (await resolveTokenValue(auth.bearer)).trim();
			return token.length === 0 ? {} : { authorization: `Bearer ${token}` };
		}
		if ("basic" in auth) {
			const password = await resolveTokenValue(auth.basic.password);
			return { authorization: `Basic ${encodeBasicCredentials(auth.basic.username, password)}` };
		}
		return {};
	}
};
async function resolveTokenValue(value) {
	return typeof value === "function" ? value() : value;
}
async function resolveHeadersValue(value) {
	if (value === void 0) return {};
	return typeof value === "function" ? await value() : value;
}
function headersInitToRecord(headers) {
	if (headers === void 0) return {};
	return Object.fromEntries(new Headers(headers).entries());
}
function withRedirectPolicy(init, redirect) {
	return {
		...init,
		redirect
	};
}

// src/protocol/session-projection/session-view.ts
const KEY = Symbol.for("eve.session-view-registry.v1");
const snapshots = globalThis[KEY] ??= /* @__PURE__ */ new WeakMap();
const immutableRows = /* @__PURE__ */ new WeakMap();
function immutable(value) {
	if (value === null || typeof value !== "object") return value;
	const existing = immutableRows.get(value);
	if (existing !== void 0) return existing;
	const copy = structuredClone(value);
	const pending = [copy];
	const seen = /* @__PURE__ */ new Set();
	while (pending.length > 0) {
		const next = pending.pop();
		if (seen.has(next)) continue;
		seen.add(next);
		for (const child of Object.values(next)) if (child !== null && typeof child === "object") pending.push(child);
		Object.freeze(next);
	}
	immutableRows.set(value, copy);
	immutableRows.set(copy, copy);
	return copy;
}
function table(rows) {
	return Object.freeze(Object.fromEntries(Object.entries(rows).map(([id, row]) => [id, immutable(row)])));
}
function snapshotOf(view, previews = emptyPreviews(), pending = []) {
	const snapshot = Object.freeze({});
	snapshots.set(snapshot, {
		tables: Object.freeze({
			position: view.position,
			session: immutable(view.session),
			calls: table(view.calls),
			changes: table(view.changes),
			children: table(view.children),
			deliveries: table(view.deliveries),
			interactions: table(view.interactions),
			parts: table(view.parts),
			responses: table(view.responses),
			runs: table(view.runs),
			tasks: table(view.tasks),
			turns: table(view.turns),
			usage: immutable(view.usage),
			selection: immutable(view.selection)
		}),
		previews: Object.freeze({
			calls: table(previews.calls),
			parts: table(previews.parts)
		}),
		pending: immutable(pending)
	});
	return snapshot;
}
function snapshotState(view) {
	const state = snapshots.get(view);
	if (state === void 0) throw new TypeError("Invalid SessionView. Use emptySessionView() or a snapshot supplied by eve.");
	return state;
}
function sessionTables(view) {
	return snapshotState(view).tables;
}

// src/protocol/session-projection/public-view.ts
function frozen(value) {
	if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
		for (const child of Object.values(value)) frozen(child);
		Object.freeze(value);
	}
	return value;
}
function interaction(view, interactionId) {
	return frozen(interaction$1(sessionTables(view), interactionId));
}

// src/client/session-store-helpers.ts
function assertAnswerable(input, conversation) {
	for (const { interactionId } of input.answers ?? []) {
		const status = interaction(conversation.view, interactionId)?.status;
		if (status !== void 0 && status !== "open") throw new Error(`Input request ${interactionId} was already answered.`);
	}
}
function assertExclusiveTurnInput(input) {
	if (input.message !== void 0 === (input.answers !== void 0)) throw new Error("A turn requires exactly one of message or answers.");
}
function summarizeMessage(message) {
	if (typeof message === "string") return message;
	return message.flatMap((part) => part.type === "text" ? [part.text] : part.type === "file" ? [part.filename ? `[file: ${part.filename}]` : "[file]"] : []).join("\n");
}
function isAbortError(error) {
	return error instanceof Error && error.name === "AbortError";
}

// src/client/optimistic-message-submissions.ts
let submissionSequence = 0;
var OptimisticMessageSubmissions = class {
	#optimistic;
	#show;
	#submissions = /* @__PURE__ */ new Map();
	constructor(show, optimistic) {
		this.#show = show;
		this.#optimistic = optimistic;
	}
	reset() {
		this.#submissions.clear();
		this.#publish();
	}
	submit(input, turnId) {
		if (input.message === void 0) return void 0;
		const id = crypto.randomUUID?.() ?? `submission_${(submissionSequence += 1).toString()}`;
		this.#submissions.set(id, {
			id,
			message: summarizeMessage(input.message),
			turnId
		});
		this.#publish();
		return id;
	}
	resubmit(id, input) {
		if (id === void 0) return this.submit(input);
		const previous = this.#submissions.get(id);
		if (input.message === void 0) this.#submissions.delete(id);
		else this.#submissions.set(id, {
			...previous,
			id,
			message: summarizeMessage(input.message)
		});
		this.#publish();
		return input.message === void 0 ? void 0 : id;
	}
	correlate(id, deliveryId) {
		if (id === void 0) return;
		const submission = this.#submissions.get(id);
		if (submission !== void 0) this.#submissions.set(id, {
			...submission,
			deliveryId
		});
	}
	reconcile(view) {
		for (const [id, submission] of this.#submissions) {
			const row = submission.deliveryId === void 0 ? void 0 : view.deliveries[submission.deliveryId];
			if (submission.turnId === void 0 && row?.turnId !== void 0) this.#submissions.set(id, {
				...submission,
				turnId: row.turnId
			});
			if (row?.consumedAt !== void 0) this.#submissions.delete(id);
			else if ((row?.status === "settled" || view.session.status === "ended") && submission.error === void 0) this.fail(new Error(row?.reason ?? "The message was not consumed."), id);
		}
		this.#publish();
	}
	fail(error, id) {
		if (id === void 0) return;
		const submission = this.#submissions.get(id);
		if (submission !== void 0) {
			this.#submissions.set(id, {
				...submission,
				error: { message: error.message }
			});
			this.#publish();
		}
	}
	get awaitingReceipt() {
		return [...this.#submissions.values()].some((submission) => submission.deliveryId === void 0 && submission.error === void 0);
	}
	#publish() {
		this.#show([...this.#submissions.values()].filter((submission) => this.#optimistic || submission.error !== void 0));
	}
};

// src/client/messages.ts
function assistantMessages(sources, turnIds) {
	const { interactions, previews, view } = sources;
	const shows = (turnId) => turnId !== void 0 && (turnIds === void 0 || turnIds.has(turnId));
	const placed = /* @__PURE__ */ new Map();
	const results = /* @__PURE__ */ new Map();
	const place = (turnId, entry) => {
		const entries = placed.get(turnId);
		if (entries === void 0) placed.set(turnId, [entry]);
		else entries.push(entry);
	};
	const onCall = /* @__PURE__ */ new Map();
	for (const interaction of Object.values(interactions)) {
		const row = view.interactions[interaction.interactionId];
		const callId = row !== void 0 && "callId" in row.subject ? row.subject.callId : void 0;
		const kind = interaction.request.kind;
		if (callId !== void 0 && view.calls[callId] !== void 0 && (kind === "approval" || kind === "question")) onCall.set(callId, interaction);
		else if (row !== void 0 && shows(interaction.turnId)) place(interaction.turnId, {
			at: row.introducedAt,
			part: {
				...interaction,
				type: "interaction"
			},
			rank: 2
		});
	}
	for (const row of Object.values(view.parts)) {
		const at = partPlace(view, row);
		if (!shows(at?.turnId)) continue;
		if (row.kind === "result") results.set(at.turnId, row.value);
		const type = textKind(row.kind);
		if (type === void 0 || typeof row.value !== "string") continue;
		place(at.turnId, {
			at: row.introducedAt,
			part: {
				id: row.partId,
				state: "done",
				stepIndex: at.stepIndex,
				text: row.value,
				type
			},
			rank: 0
		});
	}
	for (const row of Object.values(view.calls)) {
		if (row.outcome === "abandoned") continue;
		const at = callPlace(view, row.callId);
		if (!shows(at?.turnId)) continue;
		const part = toolPart(view, row, previews.calls[row.callId], onCall.get(row.callId), at.stepIndex);
		place(at.turnId, {
			at: row.introducedAt,
			part: {
				...part,
				stepIndex: at.stepIndex
			},
			rank: 1
		});
	}
	for (const preview of Object.values(previews.parts)) {
		const at = runPlace(view, preview.runId);
		const type = textKind(preview.kind);
		if (!shows(at?.turnId) || type === void 0) continue;
		place(at.turnId, {
			at: Infinity,
			part: {
				id: preview.partId,
				state: "streaming",
				stepIndex: at.stepIndex,
				text: preview.text,
				type
			},
			rank: 0
		});
	}
	for (const preview of Object.values(previews.calls)) {
		const at = runPlace(view, preview.runId);
		if (!shows(at?.turnId) || preview.kind === void 0 || view.calls[preview.callId] !== void 0) continue;
		place(at.turnId, {
			at: Infinity,
			part: {
				callId: preview.callId,
				inputText: preview.input,
				kind: preview.kind,
				label: displayTitle(preview.name),
				name: preview.name,
				state: "streaming",
				stepIndex: at.stepIndex,
				type: "tool"
			},
			rank: 1
		});
	}
	const received = /* @__PURE__ */ new Map();
	for (const row of Object.values(view.deliveries)) {
		if (!shows(row.turnId) || row.consumedAt === void 0 || !sendsMessage(row)) continue;
		const entry = {
			at: row.consumedAt,
			deliveryId: row.deliveryId
		};
		const entries = received.get(row.turnId);
		if (entries === void 0) received.set(row.turnId, [entry]);
		else entries.push(entry);
	}
	const messages = /* @__PURE__ */ new Map();
	for (const turn of Object.values(view.turns)) {
		if (!shows(turn.turnId)) continue;
		const entries = placed.get(turn.turnId) ?? [];
		if (entries.length === 0 && (turn.runs ?? 0) === 0) {
			messages.set(turn.turnId, []);
			continue;
		}
		entries.sort((a, b) => a.at - b.at || a.rank - b.rank);
		const first = entries[0]?.at ?? Infinity;
		const openers = (received.get(turn.turnId) ?? []).filter((entry) => entry.at > first).sort((a, b) => a.at - b.at);
		const pieces = [[], ...openers.map(() => [])];
		for (const entry of entries) pieces[openers.filter((opener) => opener.at < entry.at).length]?.push(entry);
		const running = turn.status !== "settled";
		const last = running ? pieces.length - 1 : Math.max(0, pieces.findLastIndex((parts) => parts.length > 0));
		const shown = [];
		pieces.forEach((parts, index) => {
			if (parts.length === 0 && !(index === last && (running || last === 0))) return;
			const metadata = {
				status: index === last && running ? "streaming" : "complete",
				turnId: turn.turnId
			};
			if (index === last && results.has(turn.turnId)) metadata.result = results.get(turn.turnId);
			const opener = index === 0 ? void 0 : openers[index - 1]?.deliveryId;
			shown.push({
				at: parts[0]?.at ?? Infinity,
				message: {
					id: opener === void 0 ? `${turn.turnId}:assistant` : `${turn.turnId}:${opener}:assistant`,
					metadata,
					parts: parts.map((entry) => entry.part),
					role: "assistant"
				}
			});
		});
		messages.set(turn.turnId, shown);
	}
	return messages;
}
function textKind(kind) {
	return kind === "text" || kind === "reasoning" ? kind : void 0;
}
function toolPart(view, row, preview, interaction, stepIndex) {
	const { kind, name } = row.capability;
	const running = row.status !== "settled";
	const part = {
		callId: row.callId,
		kind,
		label: callLabel(row, preview),
		name,
		state: callState(view, row.callId),
		stepIndex,
		type: "tool"
	};
	if (row.input !== void 0) part.input = row.input;
	const output = running ? preview?.output : row.outcome === "completed" ? callOutputSource(view, row.callId)?.output : void 0;
	if (output !== void 0) part.output = output;
	const error = row.error ?? row.inputError;
	if (error !== void 0) part.error = error;
	if (interaction !== void 0) part.interaction = interaction;
	return part;
}
function sendsMessage(row) {
	return row.parts !== void 0 && row.parts.length > 0;
}
function userMessage(row) {
	if (row.turnId === void 0 || !sendsMessage(row)) return void 0;
	return {
		id: `${row.deliveryId}:user`,
		metadata: {
			status: "complete",
			turnId: row.turnId
		},
		parts: receivedParts(row.parts),
		role: "user"
	};
}
function importedMessages(deliveryId, history) {
	return history.map((message, index) => ({
		id: `${deliveryId}:imported:${String(index)}`,
		metadata: message.id === void 0 ? {
			imported: true,
			status: "complete"
		} : {
			historyId: message.id,
			imported: true,
			status: "complete"
		},
		parts: [{
			state: "done",
			text: message.text,
			type: "text"
		}],
		role: message.role
	}));
}
function receivedParts(parts) {
	return parts.map((part) => part.kind === "text" ? {
		state: "done",
		text: part.text,
		type: "text"
	} : {
		filename: part.filename,
		mediaType: part.mediaType,
		size: part.size,
		type: "file",
		url: part.url
	});
}

// src/shared/answers-delivery-id.ts
function answersDeliveryId(deliveryId) {
	return `answers_${deliveryId}`;
}

// src/client/conversation.ts
var Conversation = class {
	view = emptySessionView();
	previews = emptyPreviews();
	#through;
	#committedThrough;
	#uncommitted = [];
	#pendingAnswers = /* @__PURE__ */ new Map();
	#submissions = [];
	#holdUnconfirmedMessages = false;
	#agents = /* @__PURE__ */ new Map();
	#messages = /* @__PURE__ */ new Map();
	#users = /* @__PURE__ */ new Map();
	#imported = /* @__PURE__ */ new Map();
	#submissionIds = /* @__PURE__ */ new Map();
	#changed = "all";
	#state;
	#viewCopy;
	#viewPosition = -1;
	observe(event) {
		const position = event.meta?.position;
		const through = this.#through;
		if (position !== void 0 && through !== void 0 && (position.line < through.line || position.line === through.line && position.index <= through.index)) return false;
		if (position !== void 0) this.#through = position;
		this.#uncommitted.push(event);
		if (event.meta?.endOfLine === false) return true;
		const committed = this.#uncommitted;
		this.#uncommitted = [];
		this.#committedThrough = this.#through;
		for (const fact of committed) {
			foldReceivedEvent(this.view, fact, this.previews);
			if (fact.type === "delivery.consumed" && (fact.data.history?.length ?? 0) > 0) this.#imported.set(fact.data.deliveryId, importedMessages(fact.data.deliveryId, fact.data.history));
			if (isFactType(fact.type)) this.#viewCopy = void 0;
			for (const turnId of touchedTurns(this.view, this.previews, fact)) this.#touch(turnId);
		}
		this.#forgetAdmittedAnswers();
		this.#state = void 0;
		return true;
	}
	advancePosition(position) {
		if (this.#uncommitted.length !== 0 || position <= this.view.position) return;
		this.view.position = position;
		this.#state = void 0;
		this.#viewCopy = void 0;
	}
	discardUncommitted() {
		this.#uncommitted = [];
		this.#through = this.#committedThrough;
	}
	answer(answers) {
		const entries = answers.map((answer) => ({
			answer,
			deliveryId: void 0
		}));
		for (const entry of entries) if (this.view.interactions[entry.answer.interactionId]?.status === "open") this.#pendingAnswers.set(entry.answer.interactionId, entry);
		this.#answersChanged();
		const retract = () => {
			for (const entry of entries) {
				const id = entry.answer.interactionId;
				if (this.#pendingAnswers.get(id) === entry) this.#pendingAnswers.delete(id);
			}
			this.#answersChanged();
		};
		retract.accept = (deliveryId) => {
			for (const entry of entries) entry.deliveryId = deliveryId;
			this.#forgetAdmittedAnswers();
			this.#answersChanged();
		};
		return retract;
	}
	confirmSubmission(id, deliveryId) {
		this.#submissionIds.set(deliveryId, id);
		this.#state = void 0;
	}
	holdUnconfirmedMessages(hold) {
		if (this.#holdUnconfirmedMessages === hold) return;
		this.#holdUnconfirmedMessages = hold;
		this.#state = void 0;
	}
	setSubmissions(submissions) {
		this.#submissions = submissions;
		this.#state = void 0;
	}
	get submissions() {
		return this.#submissions;
	}
	observeAgent(sessionId, observation) {
		this.#agents.set(sessionId, observation);
		this.#state = void 0;
	}
	get state() {
		if (this.#state !== void 0) return this.#state;
		const { previews, view } = this;
		const interactions = this.#interactions();
		const changed = this.#changed === "all" ? void 0 : /* @__PURE__ */ new Set([...this.#changed, ...Object.values(view.turns).flatMap((turn) => turn.status === "running" ? [turn.turnId] : [])]);
		const derived = assistantMessages({
			interactions,
			previews,
			view
		}, changed);
		if (changed === void 0) this.#messages = /* @__PURE__ */ new Map();
		for (const [turnId, messages] of derived) if (messages.length === 0) this.#messages.delete(turnId);
		else this.#messages.set(turnId, messages);
		this.#changed = /* @__PURE__ */ new Set();
		const state = {
			agents: this.#agentSessions(),
			view: this.#frozenView,
			messages: this.#orderedMessages()
		};
		this.#state = state;
		return state;
	}
	get #frozenView() {
		if (this.#viewCopy !== void 0 && this.#viewPosition === this.view.position) return this.#viewCopy;
		this.#viewPosition = this.view.position;
		return this.#viewCopy = snapshotOf(this.view, this.previews);
	}
	#touch(turnId) {
		if (this.#changed !== "all") this.#changed.add(turnId);
	}
	#answersChanged() {
		this.#changed = "all";
		this.#state = void 0;
	}
	#interactions() {
		const interactions = {};
		for (const interactionId of Object.keys(this.view.interactions)) {
			const shown = interaction$1(this.view, interactionId);
			if (shown === void 0) continue;
			const answer = this.#pendingAnswers.get(interactionId)?.answer;
			interactions[interactionId] = answer !== void 0 && shown.status === "open" ? {
				...shown,
				answer
			} : shown;
		}
		return interactions;
	}
	#orderedMessages() {
		const turnIds = conversation(this.view).map((turn) => turn.turnId);
		const inConversation = new Set(turnIds);
		const sent = /* @__PURE__ */ new Map();
		const imported = /* @__PURE__ */ new Map();
		for (const row of Object.values(this.view.deliveries)) {
			if (row.consumedAt === void 0 || row.turnId === void 0) continue;
			const at = row.consumedAt;
			const history = (this.#imported.get(row.deliveryId) ?? []).map((message) => ({
				at,
				message
			}));
			if (history.length > 0) imported.set(row.turnId, [...imported.get(row.turnId) ?? [], ...history]);
			const submissionId = this.#submissionIds.get(row.deliveryId);
			let message = this.#users.get(row.deliveryId);
			if (this.#holdUnconfirmedMessages && message === void 0 && submissionId === void 0) continue;
			if (message === void 0) {
				message = userMessage(row);
				if (message === void 0) continue;
				this.#users.set(row.deliveryId, message);
			}
			const shown = submissionId === void 0 ? message : {
				...message,
				id: `optimistic:${submissionId}:user`
			};
			const placed = {
				at: row.consumedAt,
				message: shown
			};
			const messages = sent.get(row.turnId);
			if (messages === void 0) sent.set(row.turnId, [placed]);
			else messages.push(placed);
		}
		const local = /* @__PURE__ */ new Map();
		for (const submission of this.#submissions) {
			const turnId = submission.turnId !== void 0 && inConversation.has(submission.turnId) ? submission.turnId : void 0;
			const message = {
				id: `optimistic:${submission.id}:user`,
				metadata: {
					optimistic: true,
					status: submission.error === void 0 ? "submitted" : "failed"
				},
				parts: [{
					text: submission.message,
					type: "text"
				}],
				role: "user"
			};
			const messages = local.get(turnId);
			if (messages === void 0) local.set(turnId, [message]);
			else messages.push(message);
		}
		const messages = [];
		for (const turnId of turnIds) {
			const placed = [
				...(imported.get(turnId) ?? []).map((entry) => ({
					...entry,
					rank: -1
				})),
				...(sent.get(turnId) ?? []).map((entry) => ({
					...entry,
					rank: 0
				})),
				...(this.#messages.get(turnId) ?? []).map((entry) => ({
					...entry,
					rank: 1
				}))
			].sort((a, b) => a.at - b.at || a.rank - b.rank);
			messages.push(...placed.map((entry) => entry.message), ...local.get(turnId) ?? []);
		}
		messages.push(...local.get(void 0) ?? []);
		return messages;
	}
	#agentSessions() {
		const agents = {};
		for (const child of Object.values(this.view.children)) {
			const callId = "callId" in child.owner ? child.owner.callId : void 0;
			const agent = {
				owner: child.owner,
				name: child.name,
				observation: this.#agents.get(child.sessionId) ?? { status: "not-followed" },
				sessionId: child.sessionId
			};
			if (callId !== void 0) {
				agent.callId = callId;
				agent.turnId = callPlace(this.view, callId)?.turnId;
				agent.taskId = this.view.calls[callId]?.taskId;
			} else if ("taskId" in child.owner) agent.taskId = child.owner.taskId;
			agents[child.sessionId] = agent;
		}
		return agents;
	}
	#forgetAdmittedAnswers() {
		for (const [id, pending] of this.#pendingAnswers) if (pending.deliveryId !== void 0 && (this.view.deliveries[pending.deliveryId] !== void 0 || this.view.deliveries[answersDeliveryId(pending.deliveryId)] !== void 0)) {
			this.#pendingAnswers.delete(id);
			this.#answersChanged();
		}
	}
};
function touchedTurns(view, previews, event) {
	const scope = event.scope;
	const data = event.data ?? {};
	const turns = /* @__PURE__ */ new Set();
	const add = (turnId) => {
		if (turnId !== void 0) turns.add(turnId);
	};
	add(scope?.turnId);
	if (typeof data.turnId === "string") add(data.turnId);
	const runId = typeof data.runId === "string" ? data.runId : typeof data.partId === "string" ? view.parts[data.partId]?.runId ?? previews.parts[data.partId]?.runId : void 0;
	if (runId !== void 0) add(runTurn(view, runId));
	if (typeof data.callId === "string") add(callPlace(view, data.callId)?.turnId);
	const interactionId = typeof data.interactionId === "string" ? data.interactionId : typeof data.responseId === "string" ? view.responses[data.responseId]?.interactionId : void 0;
	const row = interactionId === void 0 ? void 0 : view.interactions[interactionId];
	if (row !== void 0) {
		add(interactionPlace(view, row).turnId);
		if ("callId" in row.subject) add(callPlace(view, row.subject.callId)?.turnId);
	}
	return [...turns];
}

// src/client/agent-stream-follower.ts
var AgentStreamFollower = class {
	#root;
	#nodes = /* @__PURE__ */ new Set();
	#identities = /* @__PURE__ */ new Map();
	#policy;
	#onChange;
	#active = false;
	#generation = 0;
	#timer;
	constructor(options) {
		this.#policy = options.policy;
		this.#onChange = options.onChange;
		this.#root = this.#node(options.session, options.conversation, 0);
		this.#root.key = localObservationKey(options.session.id);
		this.#identities.set(this.#root.key, this.#root);
	}
	start() {
		if (this.#active) return;
		this.#active = true;
		for (const node of this.#nodes) {
			node.readyAt = 0;
			if (node.status === "interrupted" && node.reason === "detached") node.status = "queued";
		}
		this.reconcile();
	}
	reconcile() {
		if (!this.#active) return;
		this.#discover(this.#root);
		if (!this.#active) return;
		this.#publish();
		this.#schedule();
	}
	abortAll() {
		this.#active = false;
		this.#generation += 1;
		clearTimeout(this.#timer);
		this.#timer = void 0;
		for (const node of this.#nodes) {
			node.controller?.abort();
			node.controller = void 0;
			node.conversation.discardUncommitted();
			if (node.status !== "unavailable") {
				node.status = "interrupted";
				node.reason = "detached";
			}
		}
		this.#publish();
	}
	#node(reader, conversation, depth) {
		return {
			reader,
			conversation,
			readerDepth: depth,
			depths: /* @__PURE__ */ new Set([depth]),
			edges: /* @__PURE__ */ new Map(),
			status: "queued",
			caughtUp: false,
			readyAt: 0,
			failures: 0,
			idleReads: 0
		};
	}
	#discover(parent) {
		const generation = this.#generation;
		for (const child of Object.values(parent.conversation.view.children)) {
			const edge = parent.edges.get(child.sessionId) ?? { depths: /* @__PURE__ */ new Set() };
			parent.edges.set(child.sessionId, edge);
			for (const parentDepth of parent.depths) {
				if (!this.#active || generation !== this.#generation) return;
				const depth = parentDepth + 1;
				if (edge.depths.has(depth)) continue;
				edge.depths.add(depth);
				let excluded;
				if (depth > 8) excluded = "depth-limit";
				else if (typeof this.#policy === "function") try {
					if (!this.#policy({
						depth,
						name: child.name,
						sessionId: child.sessionId,
						owner: child.owner
					})) excluded = "predicate";
				} catch {
					excluded = "predicate";
				}
				else if (!this.#policy) excluded = "predicate";
				if (!this.#active || generation !== this.#generation) return;
				if (excluded === void 0 && edge.child === void 0 && this.#nodes.size >= 128) excluded = "session-limit";
				if (excluded !== void 0) {
					if (edge.child === void 0) edge.excluded = excluded;
					continue;
				}
				const reader = parent.reader.agent({
					type: "child.opened",
					data: child,
					meta: {
						at: child.startedAt,
						endOfLine: true,
						position: {
							line: child.introducedAt,
							index: 0
						}
					}
				});
				if (edge.child === void 0) {
					edge.child = this.#node(reader, new Conversation(), depth);
					edge.child.readerDepth = parent.readerDepth + 1;
					edge.excluded = void 0;
					this.#nodes.add(edge.child);
				} else {
					const node = edge.child.alias ?? edge.child;
					if (parent.readerDepth + 1 < node.readerDepth) {
						node.reader = reader;
						node.readerDepth = parent.readerDepth + 1;
					}
					if (node !== this.#root && !node.depths.has(depth)) {
						node.depths.add(depth);
						this.#discover(node);
					}
				}
			}
		}
	}
	#schedule() {
		clearTimeout(this.#timer);
		this.#timer = void 0;
		if (!this.#active) return;
		const generation = this.#generation;
		let active = [...this.#nodes].filter((node) => node.controller !== void 0).length;
		let next = Infinity;
		for (const node of [...this.#nodes].sort((a, b) => a.readyAt - b.readyAt)) {
			if (!this.#active || generation !== this.#generation) return;
			if (node.alias !== void 0 || node.controller !== void 0 || node.status === "unavailable") continue;
			if (active < 8 && node.readyAt <= Date.now()) {
				active += 1;
				this.#read(node);
			} else next = Math.min(next, node.readyAt);
		}
		if (active < 8 && next !== Infinity) this.#timer = setTimeout(() => this.#schedule(), Math.max(1, next - Date.now()));
	}
	#read(node) {
		const generation = this.#generation;
		const controller = new AbortController();
		const current = () => this.#active && generation === this.#generation && !controller.signal.aborted;
		const { conversation } = node;
		node.controller = controller;
		node.status = "following";
		node.reason = void 0;
		node.caughtUp = false;
		this.#publish();
		if (!current()) {
			controller.abort();
			return;
		}
		const lease = setTimeout(() => controller.abort(), 1e4);
		controller.signal.addEventListener("abort", () => clearTimeout(lease), { once: true });
		const before = conversation.view.position;
		(async () => {
			try {
				const reader = node.reader;
				let reachedTail = false;
				for await (const { event } of reader.follow({
					signal: controller.signal,
					startIndex: conversation.view.position,
					follow: false,
					reconnect: false
				}, (key) => {
					if (!current()) throw new Error("Observation stopped.");
					if (node.key !== void 0 && node.key !== key) throw new ClientError(422, "Descendant reader identity changed.");
					node.key = key;
					const existing = this.#identities.get(key);
					if (existing !== void 0 && existing !== node) {
						node.alias = existing;
						if (existing !== this.#root) {
							if (node.readerDepth < existing.readerDepth) {
								existing.reader = node.reader;
								existing.readerDepth = node.readerDepth;
							}
							for (const depth of node.depths) existing.depths.add(depth);
							this.#discover(existing);
						}
						controller.abort();
					} else this.#identities.set(key, node);
				}, () => {
					reachedTail = true;
				}, (position) => {
					if (!current() || position <= conversation.view.position) return;
					conversation.advancePosition(position);
					this.#publish();
				})) {
					if (!current()) return;
					conversation.observe(event);
					if (event.meta.endOfLine !== false) {
						this.#discover(node);
						if (!current()) return;
						this.#publish();
						this.#schedule();
					}
				}
				if (!current()) return;
				if (!reachedTail) throw new Error("The descendant stream disconnected before its captured tail.");
				node.caughtUp = true;
				node.status = "caught-up";
				node.failures = 0;
				node.idleReads = conversation.view.position === before ? node.idleReads + 1 : 0;
				node.readyAt = Date.now() + Math.min(1e4, 1e3 * 2 ** Math.min(node.idleReads, 4));
			} catch (error) {
				if (!current()) return;
				node.failures += 1;
				const status = error instanceof ClientError ? error.status : void 0;
				node.status = isRetryableStreamError(error) && node.failures < DEFAULT_STREAM_RECONNECT_POLICY.maxAttempts ? "interrupted" : "unavailable";
				node.reason = status === 401 || status === 403 ? "unauthorized" : status === 410 ? "expired" : status === 422 ? error instanceof ClientError && error.code === "cycle" ? "cycle" : "unsupported" : "transport";
				node.readyAt = Date.now() + Math.min(RECONNECT_BACKOFF.maxDelayMs, RECONNECT_BACKOFF.baseDelayMs * 2 ** Math.min(node.failures - 1, 5));
			} finally {
				clearTimeout(lease);
				if (generation === this.#generation) {
					node.controller = void 0;
					if (controller.signal.aborted) {
						node.status = "queued";
						node.readyAt = Date.now();
					}
					conversation.discardUncommitted();
					if (this.#active) {
						this.#publish();
						this.#schedule();
					}
				}
			}
		})();
	}
	#publish() {
		const published = /* @__PURE__ */ new Set();
		const visit = (node, ancestors) => {
			if (published.has(node)) return;
			published.add(node);
			const next = /* @__PURE__ */ new Set([...ancestors, node]);
			for (const [sessionId, edge] of node.edges) {
				if (edge.child === void 0) {
					node.conversation.observeAgent(sessionId, {
						status: "not-followed",
						reason: edge.excluded
					});
					continue;
				}
				const child = edge.child.alias ?? edge.child;
				if (next.has(child)) {
					node.conversation.observeAgent(sessionId, {
						status: "not-followed",
						reason: "cycle"
					});
					continue;
				}
				visit(child, next);
				node.conversation.observeAgent(sessionId, {
					status: child.status,
					key: child.key,
					conversation: child.conversation.state,
					position: child.conversation.view.position,
					caughtUp: child.caughtUp,
					reason: child.reason
				});
			}
		};
		visit(this.#root, /* @__PURE__ */ new Set());
		this.#onChange();
	}
};

// src/client/session-event-stream.ts
var SessionEventStream = class {
	#controller = new AbortController();
	#caughtUp = Promise.withResolvers();
	caughtUp = this.#caughtUp.promise;
	#ended = false;
	#headers;
	#reconnectPolicy;
	constructor(session, options) {
		this.setOptions(options);
		this.caughtUp.catch(() => {});
		(async () => {
			let historical = true;
			try {
				for await (const event of followClientSession(session, {
					signal: this.#controller.signal,
					resolveHeaders: () => this.#headers,
					resolveReconnectPolicy: () => this.#reconnectPolicy,
					startIndex: options.startIndex,
					onCaughtUp: () => {
						historical = false;
						this.#caughtUp.resolve();
					}
				})) {
					if (this.#controller.signal.aborted) return;
					options.onEvent(event, historical);
					if (event.type === "session.ended") break;
				}
				this.#caughtUp.resolve();
			} catch (error) {
				this.#ended = true;
				this.#caughtUp.reject(error);
				if (!this.#controller.signal.aborted) options.onError(error);
			} finally {
				this.#ended = true;
			}
		})();
	}
	get ended() {
		return this.#ended;
	}
	setOptions(options) {
		if ("headers" in options) this.#headers = options.headers;
		if ("reconnect" in options) this.#reconnectPolicy = options.reconnect;
	}
	close() {
		this.#ended = true;
		const error = new DOMException("Session stream was detached.", "AbortError");
		this.#controller.abort(error);
		this.#caughtUp.reject(error);
	}
};

// src/client/conversation-client.ts
var ConversationClient = class {
	#conversation = new Conversation();
	#follower;
	#stream;
	#onChange;
	constructor(onChange) {
		this.#onChange = onChange;
	}
	get conversation() {
		return this.#conversation.state;
	}
	get view() {
		return this.#conversation.view;
	}
	confirmSubmission(id, deliveryId) {
		this.#conversation.confirmSubmission(id, deliveryId);
	}
	holdUnconfirmedMessages(hold) {
		this.#conversation.holdUnconfirmedMessages(hold);
	}
	get streaming() {
		return this.#stream !== void 0 && !this.#stream.ended;
	}
	showSubmissions(submissions) {
		this.#conversation.setSubmissions(submissions);
	}
	projectAnswers(answers) {
		if (!answers?.length) return void 0;
		const conversation = this.#conversation;
		const pending = conversation.answer(answers);
		this.#onChange();
		const withdraw = () => {
			if (conversation !== this.#conversation) return;
			pending();
			this.#onChange();
		};
		withdraw.accept = (deliveryId) => {
			if (conversation !== this.#conversation) return;
			pending.accept(deliveryId);
			this.#onChange();
		};
		return withdraw;
	}
	replaceAnswers(retract, input) {
		retract?.();
		assertAnswerable(input, this.conversation);
		return this.projectAnswers(input.answers);
	}
	observe(event, options = {}) {
		if (!this.#conversation.observe(event)) return false;
		options.onAccepted?.(event);
		options.reconcile?.(event);
		if (options.notify !== false) {
			this.#onChange();
			if (event.meta.endOfLine !== false) this.reconcileFollowing();
		}
		return true;
	}
	reconcileFollowing() {
		this.#follower?.reconcile();
	}
	hydrate(event) {
		assertCurrentSavedEvent(event);
		const covered = this.#conversation.view.position;
		if (!this.#conversation.observe(event)) return false;
		const { next, position, endOfLine } = event.meta;
		if (position.line < covered) throw new TypeError("Saved events overlap source lines already covered by the conversation. Save the ordered events as eve read them, or read the session again from position 0.");
		if (next !== void 0) {
			if (endOfLine !== true || !Number.isSafeInteger(next) || next < position.line + 1) throw new TypeError("Saved `meta.next` must cover a complete source line with a safe integer cursor. Save the events as eve read them, or read the session again from position 0.");
			this.#conversation.advancePosition(next);
		}
		return true;
	}
	follow(session, policy) {
		this.#follower ??= new AgentStreamFollower({
			session,
			policy,
			conversation: this.#conversation,
			onChange: this.#onChange
		});
		this.#follower.start();
	}
	stream(session, options) {
		if (this.#stream !== void 0 && !this.#stream.ended) {
			this.#stream.setOptions(options);
			return this.#stream;
		}
		this.#stream = new SessionEventStream(session, {
			...options,
			startIndex: options.startIndex ?? this.#conversation.view.position
		});
		return this.#stream;
	}
	closeStream() {
		this.#stream?.close();
		this.#stream = void 0;
		this.#conversation.discardUncommitted();
	}
	stop() {
		this.#follower?.abortAll();
		this.closeStream();
	}
	reset() {
		this.stop();
		this.#follower = void 0;
		this.#conversation = new Conversation();
	}
};
function assertCurrentSavedEvent(event) {
	const { meta, type } = event;
	if (meta?.position !== void 0 && (isFactType(type) || isProgressType(type))) return;
	throw new TypeError(`Saved session event ${JSON.stringify(type)} has no stream position this eve version can read; it was likely saved by eve < 27. Discard saved \`initialEvents\` and the saved session state from before the upgrade, then start a new session.`);
}

// src/shared/wait-with-signal.ts
async function waitWithSignal(promise, signal) {
	if (signal === void 0) return await promise;
	const aborted = Promise.withResolvers();
	const onAbort = () => aborted.reject(signal.reason);
	signal.addEventListener("abort", onAbort, { once: true });
	if (signal.aborted) onAbort();
	try {
		return await Promise.race([aborted.promise, promise]);
	} finally {
		signal.removeEventListener("abort", onAbort);
	}
}

// src/client/session-store.ts
const detachStore = Symbol("detachSessionStore");
const attachStore = Symbol("attachSessionStore");
var SessionStore = class {
	#client;
	#autoPrewarm;
	#followChildStreams;
	#followWhile;
	#externalSession;
	#subscribers = /* @__PURE__ */ new Set();
	#turnWaiters = /* @__PURE__ */ new Set();
	#conversationClient;
	#messageSubmissions;
	#pending = /* @__PURE__ */ new Set();
	#accepted = /* @__PURE__ */ new Set();
	#attached = false;
	#mounted = false;
	#observers = 0;
	#streamingWhenDetached = false;
	#callbacks = {};
	#controller = new AbortController();
	#creation;
	#preparation;
	#resumePromise;
	#session;
	#error;
	#events;
	#snapshot;
	#observedSession;
	#inLine = false;
	#posting = 0;
	#finishes = 0;
	#finishedTurns = /* @__PURE__ */ new Set();
	#endings = [];
	constructor(init) {
		this.#autoPrewarm = init.prewarm ?? false;
		this.#followChildStreams = init.followAgents ?? false;
		this.#followWhile = init.followWhile ?? (() => true);
		this.#externalSession = init.session !== void 0;
		this.#client = this.#externalSession ? void 0 : init.client ?? new Client({
			auth: init.auth,
			headers: init.headers,
			baseUrl: init.baseUrl ?? ""
		});
		this.#conversationClient = new ConversationClient(() => this.#publish());
		this.#events = (init.initialEvents ?? []).filter((event) => this.#conversationClient.hydrate(event));
		this.#messageSubmissions = new OptimisticMessageSubmissions((submissions) => this.#conversationClient.showSubmissions(submissions), init.optimistic ?? true);
		this.#session = init.session ?? (init.initialSession === void 0 ? void 0 : this.#client?.sessions.attach(init.initialSession.sessionId, {
			streamIndex: init.initialSession.streamIndex,
			inbox: init.initialSession.inbox
		}));
		this.#error = this.#recordedFailure();
		this.#snapshot = this.#createSnapshot();
	}
	get snapshot() {
		return this.#snapshot;
	}
	observe() {
		this.#observers += 1;
		this.#activateObservation();
		let released = false;
		return () => {
			if (released) return;
			released = true;
			this.#observers -= 1;
			if (!this.#mounted && this.#observers === 0) this.#deactivateObservation();
		};
	}
	setCallbacks(callbacks) {
		this.#callbacks = callbacks;
	}
	subscribe(callback) {
		this.#subscribers.add(callback);
		return () => void this.#subscribers.delete(callback);
	}
	async prewarm() {
		if (this.#session !== void 0) return await this.#prepare(this.#session);
		const lifetime = this.#controller;
		try {
			await this.#create();
		} catch (error) {
			if (lifetime === this.#controller && !isAbortError(error) && this.#pending.size === 0) this.#fail(error);
			throw error;
		}
		if (lifetime === this.#controller && this.#followWhile(this.#conversationClient.conversation.view)) this.#ensureStream();
	}
	async send(input) {
		if (this.#resumePromise !== void 0) throw new Error("eve session is resuming.");
		assertExclusiveTurnInput(input);
		assertAnswerable(input, this.#conversationClient.conversation);
		const lifetime = this.#controller;
		const signal = input.signal ? AbortSignal.any([lifetime.signal, input.signal]) : lifetime.signal;
		const accepted = Promise.withResolvers();
		this.#pending.add(accepted.promise);
		this.#error = void 0;
		let submissionId = this.#messageSubmissions.submit(input, input.turnPolicy === "steer" ? activeTurn(this.#conversationClient.view)?.turnId : void 0);
		let retract = this.#conversationClient.projectAnswers(input.answers);
		this.#publish();
		let posting = false;
		try {
			const prepared = this.#callbacks.prepareSend === void 0 ? input : await waitWithSignal(Promise.resolve(this.#callbacks.prepareSend(input)), signal);
			throwIfAborted(signal);
			assertExclusiveTurnInput(prepared);
			if (prepared !== input) {
				submissionId = this.#messageSubmissions.resubmit(submissionId, prepared);
				retract = this.#conversationClient.replaceAnswers(retract, prepared);
				this.#publish();
			}
			posting = true;
			this.#posting += 1;
			const delivery = await this.#dispatch({
				...prepared,
				signal
			});
			throwIfAborted(signal);
			const deliveryId = delivery.deliveryId;
			if (deliveryId === void 0) throw new Error("The server did not identify the accepted delivery.");
			retract?.accept(deliveryId);
			retract = void 0;
			if (lifetime === this.#controller) {
				if (submissionId !== void 0) {
					this.#conversationClient.confirmSubmission(submissionId, deliveryId);
					this.#messageSubmissions.correlate(submissionId, deliveryId);
				}
				this.#acceptReceipt(deliveryId);
				this.#callbacks.onSessionChange?.(this.#sessionState);
			}
			accepted.resolve(deliveryId);
			return new StreamDelivery({
				sessionId: delivery.sessionId,
				deliveryId,
				createStream: (read) => delivery.stream(read)
			});
		} catch (error) {
			if (lifetime === this.#controller) {
				retract?.();
				this.#messageSubmissions.fail(toError(error), submissionId);
				if (!isAbortError(error)) this.#fail(error);
			}
			throw error;
		} finally {
			accepted.resolve(void 0);
			if (lifetime === this.#controller) {
				this.#pending.delete(accepted.promise);
				if (posting) this.#posting -= 1;
				this.#publish();
				this.#closeStreamWhenIdle();
			}
		}
	}
	follow(receipt) {
		if (this.#session === void 0) throw new Error("An eve session is required before following.");
		if (receipt.sessionId !== this.#session.id) throw new Error("The delivery belongs to a different eve session.");
		const view = this.#conversationClient.view;
		const delivery = view.deliveries[receipt.deliveryId];
		if (view.session.status === "ended" || delivery?.status === "settled") return;
		this.#error = void 0;
		this.#acceptReceipt(receipt.deliveryId);
		if (this.#accepted.has(receipt.deliveryId)) this.#ensureStream();
		this.#publish();
	}
	resume() {
		if (this.#resumePromise !== void 0) return this.#resumePromise;
		if (this.#session === void 0) return Promise.reject(/* @__PURE__ */ new Error("An eve session is required before resuming."));
		if (this.#pending.size > 0) return Promise.reject(/* @__PURE__ */ new Error("eve session has pending submissions."));
		const lifetime = this.#controller;
		this.#error = void 0;
		const promise = this.#ensureStream({ startIndex: this.#conversationClient.view.position }).caughtUp.then(() => {
			if (lifetime === this.#controller) this.#error ??= this.#recordedFailure();
		}).finally(() => {
			if (lifetime !== this.#controller) return;
			this.#resumePromise = void 0;
			this.#publish();
			this.#closeStreamWhenIdle();
		});
		this.#resumePromise = promise;
		this.#publish(true);
		return promise;
	}
	async cancel() {
		const lifetime = this.#controller;
		const turnId = activeTurn(this.#conversationClient.view)?.turnId ?? await this.#submittedTurn(lifetime.signal);
		throwIfAborted(lifetime.signal);
		return this.#control((session) => session.cancel({ turnId: turnId ?? null }));
	}
	async #submittedTurn(signal) {
		const deliveries = new Set(this.#accepted.keys());
		const pending = [...this.#pending];
		let remaining = pending.length;
		const result = Promise.withResolvers();
		const check = () => {
			const view = this.#conversationClient.view;
			if (view.session.status === "ended") return result.resolve(void 0);
			for (const id of deliveries) {
				const delivery = view.deliveries[id];
				const turn = delivery?.turnId === void 0 ? void 0 : view.turns[delivery.turnId];
				if (turn?.status === "running") return result.resolve(turn.turnId);
				if (delivery?.status === "settled" || turn?.status === "settled") deliveries.delete(id);
			}
			if (remaining === 0 && deliveries.size === 0) result.resolve(void 0);
			else if (this.#error !== void 0) result.reject(this.#error);
		};
		this.#turnWaiters.add(check);
		for (const receipt of pending) receipt.then((id) => {
			remaining -= 1;
			if (id !== void 0) deliveries.add(id);
			check();
		});
		try {
			check();
			return await waitWithSignal(result.promise, signal);
		} finally {
			this.#turnWaiters.delete(check);
		}
	}
	compact() {
		return this.#control((session) => session.compact());
	}
	clear() {
		return this.#control((session) => session.clear());
	}
	end() {
		return this.#control((session) => session.end());
	}
	async #control(dispatch) {
		const session = this.#session;
		if (session === void 0) throw new SessionNotActiveError();
		const lifetime = this.#controller;
		this.#posting += 1;
		this.#ensureStream();
		this.#publish();
		try {
			const receipt = await dispatch(session);
			throwIfAborted(lifetime.signal);
			this.#acceptReceipt(receipt.deliveryId);
			return receipt;
		} finally {
			if (lifetime === this.#controller) {
				this.#posting -= 1;
				this.#publish();
				this.#closeStreamWhenIdle();
			}
		}
	}
	[attachStore]() {
		this.#mounted = true;
		this.#activateObservation();
	}
	#activateObservation() {
		if (this.#attached) return;
		this.#attached = true;
		this.#followAgents();
		const resumeFollowing = this.#streamingWhenDetached && this.#followWhile(this.#conversationClient.conversation.view);
		this.#streamingWhenDetached = false;
		if (this.#session !== void 0 && (this.#hasLocalObligation || resumeFollowing)) this.#ensureStream();
		if (this.#autoPrewarm && this.#session === void 0) this.prewarm().catch(() => {});
	}
	[detachStore]() {
		this.#mounted = false;
		if (this.#observers === 0) this.#deactivateObservation();
	}
	#deactivateObservation() {
		this.#attached = false;
		this.#streamingWhenDetached = this.#conversationClient.streaming;
		this.#stop();
	}
	newSession() {
		this.#stop();
		if (!this.#externalSession) this.#session = void 0;
		this.#accepted.clear();
		this.#finishedTurns.clear();
		this.#events = [];
		this.#conversationClient.reset();
		this.#messageSubmissions.reset();
		this.#error = void 0;
		if (this.#attached) this.#followAgents();
		this.#callbacks.onSessionChange?.(this.#sessionState);
		this.#publish();
		if (this.#autoPrewarm && this.#attached) this.prewarm().catch(() => {});
	}
	#stop() {
		this.#conversationClient.stop();
		this.#controller.abort();
		this.#controller = new AbortController();
		this.#creation = void 0;
		this.#resumePromise = void 0;
		this.#pending.clear();
		this.#posting = 0;
		this.#finishes = 0;
		this.#abandonLine();
	}
	#abandonLine() {
		this.#conversationClient.closeStream();
		let end = this.#events.length;
		while (end > 0 && this.#events[end - 1].meta.endOfLine === false) end -= 1;
		if (end < this.#events.length) this.#events = this.#events.slice(0, end);
		this.#endings = [];
		this.#inLine = false;
	}
	#create(input) {
		if (this.#creation !== void 0) return this.#creation;
		const client = this.#client;
		if (client === void 0) return Promise.reject(/* @__PURE__ */ new Error("This store cannot create a session."));
		const lifetime = this.#controller;
		const signal = input?.signal ?? lifetime.signal;
		const promise = (async () => {
			let session;
			let delivery;
			if (input?.message === void 0) ({session} = await client.sessions.create({ signal }));
			else ({session, delivery} = await client.sessions.create({
				...input,
				message: input.message,
				signal
			}));
			throwIfAborted(lifetime.signal);
			this.#session = session;
			this.#error = void 0;
			this.#callbacks.onSessionChange?.(this.#sessionState);
			this.#followAgents();
			this.#publish();
			return delivery;
		})();
		this.#creation = promise;
		const clear = () => {
			if (this.#creation === promise) this.#creation = void 0;
		};
		promise.then(clear, clear);
		return promise;
	}
	#prepare(session) {
		const lifetime = this.#controller;
		if (this.#preparation?.lifetime === lifetime) return this.#preparation.promise;
		const promise = session.prewarm({ signal: lifetime.signal }).then(() => void 0);
		const preparation = {
			lifetime,
			promise
		};
		this.#preparation = preparation;
		const clear = () => {
			if (this.#preparation === preparation) this.#preparation = void 0;
		};
		promise.then(clear, clear);
		return promise;
	}
	async #dispatch(input) {
		if (this.#creation !== void 0) await waitWithSignal(this.#creation.catch(() => void 0), input.signal);
		throwIfAborted(input.signal);
		if (this.#session === void 0) {
			if (input.message === void 0) throw new Error("Cannot answer before the session starts.");
			const delivery = await this.#create(input);
			this.#ensureStream(input);
			if (delivery === void 0) throw new Error("The session was created without accepting a message.");
			return delivery;
		}
		this.#ensureStream(input);
		return input.answers === void 0 ? await this.#session.send(input.message, input) : await this.#session.respond(input.answers, input);
	}
	#ensureStream(options = {}) {
		if (this.#session === void 0) throw new Error("A session is required before opening its stream.");
		this.#followAgents();
		const lifetime = this.#controller;
		return this.#conversationClient.stream(this.#session, {
			startIndex: this.#conversationClient.view.position,
			...options,
			onEvent: (event, historical) => {
				if (lifetime === this.#controller) this.#acceptServerEvent(event, historical);
			},
			onError: (error) => {
				if (lifetime !== this.#controller) return;
				this.#abandonLine();
				this.#fail(error);
			}
		});
	}
	#followAgents() {
		if (this.#followChildStreams && this.#session) this.#conversationClient.follow(this.#session, this.#followChildStreams);
	}
	#acceptServerEvent(event, historical) {
		const lifetime = this.#controller;
		this.#inLine = event.meta.endOfLine === false;
		if (!this.#conversationClient.observe(event, { notify: false })) return;
		this.#events = [...this.#events, event];
		this.#callbacks.onEvent?.(event);
		if (lifetime !== this.#controller) return;
		if (event.type === "turn.started" && !historical) this.#error = void 0;
		if (event.type === "turn.settled" || event.type === "session.ended") this.#endings.push({
			event,
			historical
		});
		if (this.#inLine) return;
		const view = this.#conversationClient.view;
		const relevantTurns = new Set([...this.#accepted].map((id) => view.deliveries[id]?.turnId).filter((id) => id !== void 0));
		this.#reconcile();
		for (const ending of this.#endings.splice(0)) {
			if (ending.event.type === "turn.settled") {
				if (!ending.historical) this.#finishTurn(ending.event.data.turnId);
				else if (relevantTurns.has(ending.event.data.turnId) && this.#pending.size === 0) this.#error ??= this.#recordedFailure(ending.event.data.turnId);
			} else if (ending.event.data.outcome === "failed") {
				const error = Object.assign(new Error(ending.event.data.error?.message ?? "The session failed."), { name: ending.event.data.error?.code ?? "SESSION_FAILED" });
				if (!ending.historical) this.#fail(error);
				else if (this.#pending.size === 0) this.#error ??= error;
			}
			if (lifetime !== this.#controller) return;
		}
		for (const check of this.#turnWaiters) check();
		this.#callbacks.onSessionChange?.(this.#sessionState);
		if (lifetime !== this.#controller) return;
		this.#publish();
		if (lifetime !== this.#controller) return;
		this.#conversationClient.reconcileFollowing();
		if (lifetime !== this.#controller) return;
		this.#closeStreamWhenIdle();
	}
	#acceptReceipt(deliveryId) {
		this.#accepted.add(deliveryId);
		this.#reconcile();
		const view = this.#conversationClient.view;
		const turnId = view.deliveries[deliveryId]?.turnId;
		if (turnId !== void 0 && view.turns[turnId]?.status === "settled") this.#error ??= this.#recordedFailure(turnId);
		if (view.session.status === "ended") this.#error ??= this.#recordedFailure();
	}
	#reconcile() {
		const view = this.#conversationClient.view;
		if (view.session.status === "ended") this.#accepted.clear();
		this.#messageSubmissions.reconcile(view);
		for (const id of this.#accepted) if (view.deliveries[id]?.status === "settled") this.#accepted.delete(id);
	}
	get #hasLocalObligation() {
		return this.#resumePromise !== void 0 || this.#posting > 0 || this.#pending.size > 0 || this.#accepted.size > 0;
	}
	#closeStreamWhenIdle() {
		if (this.#inLine || this.#hasLocalObligation || this.#followWhile(this.#conversationClient.conversation.view)) return;
		this.#conversationClient.closeStream();
	}
	#finishTurn(turnId) {
		if (this.#finishedTurns.has(turnId)) return;
		if (this.#conversationClient.view.turns[turnId]?.status !== "settled") return;
		this.#finishedTurns.add(turnId);
		this.#finishes += 1;
		const error = failure(this.#conversationClient.view, turnId);
		if (error !== void 0) this.#fail(Object.assign(new Error(error.message), { name: error.code }));
	}
	#recordedFailure(turnId = this.#conversationClient.view.session.latestTurnId) {
		const view = this.#conversationClient.view;
		const error = failure(view, turnId);
		return error === void 0 ? void 0 : Object.assign(new Error(error.message), { name: error.code });
	}
	#fail(error) {
		const reported = this.#error !== void 0;
		this.#error = toError(error);
		for (const check of this.#turnWaiters) check();
		if (!reported) this.#callbacks.onError?.(this.#error);
		this.#publish();
	}
	get #sessionState() {
		if (this.#session === void 0) return this.#observedSession = void 0;
		const sessionId = this.#session.id;
		const streamIndex = this.#conversationClient.view.position;
		const { inbox } = this.#session.state;
		if (this.#observedSession?.sessionId !== sessionId || this.#observedSession.streamIndex !== streamIndex || this.#observedSession.inbox !== inbox) this.#observedSession = {
			sessionId,
			streamIndex,
			inbox
		};
		return this.#observedSession;
	}
	#createSnapshot() {
		this.#conversationClient.holdUnconfirmedMessages(this.#posting > 0 && this.#messageSubmissions.awaitingReceipt);
		const data = this.#conversationClient.conversation;
		const { view } = data;
		return {
			...data,
			view,
			error: this.#error,
			events: this.#events,
			session: this.#sessionState,
			status: this.#resumePromise !== void 0 ? "resuming" : this.#hasLocalObligation || !idle(this.#conversationClient.view) ? "busy" : "idle"
		};
	}
	#publish(force = false) {
		if (this.#resumePromise !== void 0 && !force) return;
		if (this.#inLine) {
			if (this.#error === void 0 && !this.#hasLocalObligation) return;
			this.#snapshot = {
				...this.#snapshot,
				error: this.#error,
				status: this.#resumePromise !== void 0 ? "resuming" : this.#hasLocalObligation ? "busy" : this.#snapshot.status
			};
			for (const subscriber of this.#subscribers) subscriber();
			return;
		}
		this.#snapshot = this.#createSnapshot();
		const finishes = this.#finishes;
		const lifetime = this.#controller;
		this.#finishes = 0;
		for (const subscriber of this.#subscribers) subscriber();
		for (let index = 0; index < finishes && lifetime === this.#controller; index += 1) this.#callbacks.onFinish?.(this.#snapshot);
	}
};
function detachSessionStore(store) {
	store[detachStore]();
}
function attachSessionStore(store) {
	store[attachStore]();
}

// src/client/agent-base-url.ts
const AGENT_NAME_PATTERN = /^[a-z0-9][a-z0-9_-]*$/;
const EVE_NAMED_AGENT_ROUTE_PREFIX = "/eve";
function resolveEveAgentBaseUrl(input) {
	if (input.agent === void 0) return input.baseUrl ?? "";
	if (input.baseUrl !== void 0) throw new Error("useEveAgent cannot combine agent and baseUrl. Use one target option.");
	assertValidAgentName(input.agent);
	return `${EVE_NAMED_AGENT_ROUTE_PREFIX}/${input.agent}`;
}
function assertValidAgentName(name) {
	if (!AGENT_NAME_PATTERN.test(name)) throw new Error(`eve agent name ${JSON.stringify(name)} is invalid. Use lowercase letters, numbers, underscores, or hyphens, starting with a letter or number.`);
}

// src/vue/use-eve-agent.ts
function useEveAgent(options = {}) {
	if (options.resume && options.initialSession === void 0 && options.session === void 0) throw new Error("useEveAgent({ resume: true }) requires initialSession or session.");
	const store = new SessionStore({
		auth: options.auth,
		headers: options.headers,
		baseUrl: resolveEveAgentBaseUrl({
			agent: options.agent,
			baseUrl: options.baseUrl
		}),
		initialEvents: options.initialEvents,
		initialSession: options.initialSession,
		optimistic: options.optimistic,
		followAgents: options.followAgents,
		followWhile: (view) => options.followWhile?.(view) ?? true,
		prewarm: options.prewarm,
		session: options.session
	});
	store.setCallbacks({
		onError: options.onError,
		onEvent: options.onEvent,
		onFinish: options.onFinish,
		onSessionChange: options.onSessionChange,
		prepareSend: options.prepareSend
	});
	const snapshot = shallowRef(store.snapshot);
	if ("window" in globalThis) {
		const unsubscribe = store.subscribe(() => {
			snapshot.value = store.snapshot;
		});
		attachSessionStore(store);
		if (options.resume) store.resume().catch(() => {});
		onScopeDispose(() => {
			unsubscribe();
			detachSessionStore(store);
		});
	}
	return {
		cancel: () => store.cancel(),
		follow: (receipt) => store.follow(receipt),
		messages: computed(() => snapshot.value.messages),
		agents: computed(() => snapshot.value.agents),
		view: computed(() => snapshot.value.view),
		error: computed(() => snapshot.value.error),
		events: computed(() => snapshot.value.events),
		prewarm: () => store.prewarm(),
		end: () => store.end(),
		newSession: () => store.newSession(),
		clear: () => store.clear(),
		compact: () => store.compact(),
		respond: (answers, options) => store.send({
			...options,
			answers
		}),
		resume: () => store.resume(),
		send: (message, options) => store.send({
			...options,
			message
		}),
		session: computed(() => snapshot.value.session),
		status: computed(() => snapshot.value.status)
	};
}

export { signInEnding as n, useEveAgent as t };