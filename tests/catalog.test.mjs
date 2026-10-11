import test from "node:test";
import assert from "node:assert/strict";
import {
  filterListings,
  demoListings,
  defaultFilters,
} from "../lib/catalog.mjs";
const run = (patch) =>
  filterListings(demoListings, { ...defaultFilters, ...patch });
test("combines family, storage, minimum battery and municipality filters", () => {
  assert.deepEqual(
    run({
      models: ["iPhone 16"],
      storage: [256],
      minBattery: 100,
      location: "Plaza de la Revolución",
    }).map((x) => x.id),
    ["demo-1"],
  );
});
test("search is case insensitive and supports device colors", () => {
  assert.deepEqual(
    run({ query: "ROSA" }).map((x) => x.id),
    ["demo-6"],
  );
});
test("honors price bounds and sorts without changing source data", () => {
  assert.deepEqual(
    run({ minPrice: 530, maxPrice: 800, sort: "price-desc" }).map(
      (x) => x.price,
    ),
    [790, 580, 540],
  );
  assert.equal(demoListings[0].id, "demo-1");
});
test("favorites are scoped by id; sold listings are removed from results", () => {
  assert.deepEqual(
    run({ favoritesOnly: true, favorites: ["demo-3"] }).map((x) => x.id),
    ["demo-3"],
  );
  assert.equal(
    filterListings([{ ...demoListings[0], sold: true }], defaultFilters).length,
    0,
  );
});
test("verified and warranty filters exclude ineligible listings", () => {
  assert.equal(
    run({ warranty: true }).some((x) => !x.warrantyDays),
    false,
  );
  assert.equal(
    filterListings([{ ...demoListings[0], verified: false }], {
      ...defaultFilters,
      verified: true,
    }).length,
    0,
  );
});
