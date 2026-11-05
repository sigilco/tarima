import { Validator } from "#compiled/@cfworker/json-schema/index.js";
import type { JsonObject } from "#shared/json.js";
export declare function validateStubConstraint(value: unknown, ruleId: string, property: string): void;
export declare function createStubValidator(value: JsonObject | boolean): Validator;
