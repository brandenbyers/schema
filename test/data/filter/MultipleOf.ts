import { pipe } from "@fp-ts/core/Function"
import * as _ from "@fp-ts/schema/data/Number"
import { minLength } from "@fp-ts/schema/data/String"
import * as P from "@fp-ts/schema/Parser"
import * as S from "@fp-ts/schema/Schema"
import * as Util from "@fp-ts/schema/test/util"

describe.concurrent("multipleOf", () => {
  it("property tests", () => {
    Util.property(minLength(0)(S.string))
  })

  it("Guard", () => {
    const schema = pipe(S.number, _.multipleOf(-.2))
    const is = P.is(schema)
    expect(is(-2.8)).toEqual(true)
    expect(is(-2)).toEqual(true)
    expect(is(-1.5)).toEqual(false)
    expect(is(0)).toEqual(true)
    expect(is(1)).toEqual(true)
    expect(is(2.6)).toEqual(true)
    expect(is(3.1)).toEqual(false)
  })

  it("Decoder", () => {
    const schema = _.multipleOf(2)(S.number)
    Util.expectDecodingSuccess(schema, -4)
    Util.expectDecodingFailure(
      schema,
      -3,
      `Expected a number divisible by 2, actual -3`
    )
    Util.expectDecodingSuccess(schema, 0)
    Util.expectDecodingSuccess(schema, 2)
    Util.expectDecodingFailure(
      schema,
      2.5,
      `Expected a number divisible by 2, actual 2.5`
    )
    Util.expectDecodingFailure(
      schema,
      "",
      `Expected number, actual ""`
    )
  })
})
