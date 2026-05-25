import { describe, expect, it } from "vitest";

import { extractCityCandidates } from "../../../src/weather/cityCandidates.js";

describe("extractCityCandidates", () => {
  it("extracts the first city-like phrase after location prepositions", () => {
    expect(extractCityCandidates("Book tickets for London")).toEqual(["London"]);
    expect(extractCityCandidates("Plan my trip to New York next week")).toEqual([
      "New York",
    ]);
    expect(extractCityCandidates("book tickets for london")).toEqual(["london"]);
    expect(
      extractCityCandidates(
        "I need to travel to london and then from london to paris",
      ),
    ).toEqual(["london"]);
    expect(extractCityCandidates("Book tickets for London next week")).toEqual([
      "London",
    ]);
  });

  it("does not infer cities without location context or useful candidates", () => {
    expect(extractCityCandidates("Book London ticket")).toEqual([]);
    expect(extractCityCandidates("book london ticket")).toEqual([]);
    expect(extractCityCandidates("prepare meals for the whole week")).toEqual([]);
  });
});
