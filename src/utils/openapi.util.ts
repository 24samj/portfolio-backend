import { resolver } from "hono-openapi";
import type { OpenAPIV3_1 } from "openapi-types";
import { z } from "zod";
import {
  errorResponseSchema,
  itemResponseSchema,
  listResponseSchema,
} from "@/schemas/envelope.schema";

/** The schema arg `resolver` accepts (a Standard Schema — every zod schema is one). */
type DocSchema = Parameters<typeof resolver>[0];

/**
 * A JSON response entry for `describeRoute`, its body described by a schema.
 * Keeps the verbose `content["application/json"].schema` wrapper out of routes.
 * `resolver` is accepted in `responses` (hono-openapi resolves it); for request
 * bodies use `jsonRequestBody` instead — `resolver` isn't valid there.
 */
export function jsonResponse(description: string, schema: DocSchema) {
  return {
    description,
    content: { "application/json": { schema: resolver(schema) } },
  };
}

/** `{ success, data }` wrapping one item. */
export function itemResponse(description: string, item: z.ZodType) {
  return jsonResponse(description, itemResponseSchema(item));
}

/** `{ success, count, data[] }` wrapping a list. */
export function listResponse(description: string, item: z.ZodType) {
  return jsonResponse(description, listResponseSchema(item));
}

/** The shared `{ success: false, error, message }` envelope. */
export function errorResponse(description: string) {
  return jsonResponse(description, errorResponseSchema);
}

/**
 * A JSON request body entry for `describeRoute`. Unlike responses, `requestBody`
 * is plain OpenAPI typing, so we emit a static schema via zod's JSON-Schema
 * output rather than `resolver`. The cast bridges zod's JSON-Schema type to the
 * OpenAPI 3.1 SchemaObject type — the two are structurally compatible (zod
 * targets draft 2020-12, which OpenAPI 3.1 uses).
 */
export function jsonRequestBody(
  description: string,
  schema: z.ZodType,
  required = true
): OpenAPIV3_1.RequestBodyObject {
  return {
    description,
    required,
    content: {
      "application/json": {
        schema: z.toJSONSchema(schema) as OpenAPIV3_1.SchemaObject,
      },
    },
  };
}
