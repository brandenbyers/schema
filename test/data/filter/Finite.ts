import * as _ from "@fp-ts/schema/data/filter/Finite"
import * as D from "@fp-ts/schema/Decoder"
import * as G from "@fp-ts/schema/Guard"
import * as P from "@fp-ts/schema/Pretty"
import * as S from "@fp-ts/schema/Schema"
import * as Util from "@fp-ts/schema/test/util"

describe.concurrent("Finite", () => {
  it("property tests", () => {
    Util.property(_.schema(S.number))
  })

  it("Guard", () => {
    const guard = G.guardFor(_.schema(S.number))
    expect(guard.is(1)).toEqual(true)
    expect(guard.is(Infinity)).toEqual(false)
    expect(guard.is(-Infinity)).toEqual(false)
  })

  it("Decoder", () => {
    const decoder = D.decoderFor(_.schema(S.number))
    Util.expectSuccess(decoder, 1)
    Util.expectFailure(decoder, Infinity, `Infinity did not satisfy refinement({"type":"Finite"})`)
    Util.expectFailure(
      decoder,
      -Infinity,
      `-Infinity did not satisfy refinement({"type":"Finite"})`
    )
  })

  it("Pretty", () => {
    const pretty = P.prettyFor(_.schema(S.number))
    expect(pretty.pretty(1)).toEqual("1")
    expect(pretty.pretty(NaN)).toEqual("NaN")
    expect(pretty.pretty(Infinity)).toEqual("Infinity")
    expect(pretty.pretty(-Infinity)).toEqual("-Infinity")
  })
})
