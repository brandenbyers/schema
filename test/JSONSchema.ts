import type { AST } from "@fp-ts/codec/AST"
import * as boolean_ from "@fp-ts/codec/data/boolean"
import * as number_ from "@fp-ts/codec/data/number"
import type { Provider } from "@fp-ts/codec/Provider"
import { empty, findHandler, Semigroup } from "@fp-ts/codec/Provider"
import type { Schema } from "@fp-ts/codec/Schema"
import * as S from "@fp-ts/codec/Schema"
import { pipe } from "@fp-ts/data/Function"
import * as O from "@fp-ts/data/Option"
import Ajv from "ajv"

type StringJSONSchema = {
  readonly type: "string"
  minLength?: number
  maxLength?: number
}

type JSONSchema =
  | StringJSONSchema
  | {
    readonly type: "number"
    readonly exclusiveMaximum?: number
    readonly exclusiveMinimum?: number
    readonly maximum?: number
    readonly minimum?: number
  }
  | { readonly type: "boolean" }

const JSONSchemaInterpreterId: unique symbol = Symbol.for(
  "@fp-ts/codec/interpreter/JSONSchemaInterpreter"
)

type JSONSchemaInterpreterId = typeof JSONSchemaInterpreterId

const provideUnsafeJsonSchemaFor = (
  support: Provider
) =>
  <A>(schema: Schema<A>): JSONSchema => {
    const go = (ast: AST): JSONSchema => {
      switch (ast._tag) {
        case "Declaration": {
          const merge = Semigroup.combine(support)(ast.provider)
          const handler = findHandler(
            merge,
            JSONSchemaInterpreterId,
            ast.id
          )
          if (O.isSome(handler)) {
            if (O.isSome(ast.config)) {
              return handler.value(ast.config.value)(...ast.nodes.map(go))
            }
            return handler.value(...ast.nodes.map(go))
          }
          if (ast.id === number_.id) {
            return { type: "number" }
          }
          if (ast.id === boolean_.id) {
            return { type: "boolean" }
          }
          throw new Error(
            `Missing support for JSONSchema interpreter, data type ${String(ast.id.description)}`
          )
        }
        case "String":
          return {
            type: "string",
            minLength: ast.minLength,
            maxLength: ast.maxLength
          }
      }
      throw new Error(`Unhandled ${ast._tag}`)
    }

    return go(schema.ast)
  }

const unsafeJsonSchemaFor: <A>(schema: Schema<A>) => JSONSchema = provideUnsafeJsonSchemaFor(empty)

describe("unsafeJsonSchemaFor", () => {
  it("string", () => {
    const schema = S.string
    const validate = new Ajv().compile(unsafeJsonSchemaFor(schema))
    expect(validate("a")).toEqual(true)
    expect(validate(1)).toEqual(false)
  })

  it("boolean", () => {
    const schema = S.boolean
    const validate = new Ajv().compile(unsafeJsonSchemaFor(schema))
    expect(validate(true)).toEqual(true)
    expect(validate(false)).toEqual(true)
    expect(validate(1)).toEqual(false)
  })

  it.skip("minLength", () => {
    const schema = pipe(S.string, S.minLength(1))
    const jsonSchema = unsafeJsonSchemaFor(schema)
    expect(jsonSchema).toEqual({ type: "string", minLength: 1 })
  })

  it.skip("maxLength", () => {
    const schema = pipe(S.string, S.maxLength(1))
    const validate = new Ajv().compile(unsafeJsonSchemaFor(schema))
    expect(validate("")).toEqual(true)
    expect(validate("a")).toEqual(true)

    expect(validate("aa")).toEqual(false)
  })

  it.skip("min", () => {
    const schema = pipe(S.number, S.min(1))
    const validate = new Ajv().compile(unsafeJsonSchemaFor(schema))
    expect(validate(1)).toEqual(true)
    expect(validate(2)).toEqual(true)

    expect(validate(0)).toEqual(false)
  })

  it.skip("max", () => {
    const schema = pipe(S.number, S.max(1))
    const validate = new Ajv().compile(unsafeJsonSchemaFor(schema))
    expect(validate(0)).toEqual(true)
    expect(validate(1)).toEqual(true)

    expect(validate(2)).toEqual(false)
  })
})
