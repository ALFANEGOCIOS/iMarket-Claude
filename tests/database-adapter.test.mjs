import test from "node:test";
import assert from "node:assert/strict";
import {
  mapListing,
  listingPayload,
  createRepository,
  uploadDataImages,
} from "../lib/database.mjs";
const contract = {
  conditions: ["like_new", "excellent", "good"],
  originalBattery: "original",
  genericBattery: "generic",
  published: "published",
  pending: "pending_review",
  verified: "approved",
  sold: "sold",
  photoBucket: "listing-photos",
  identityBucket: "identity-documents",
};
const imageClient = {
  storage: {
    from: (bucket) => ({
      getPublicUrl: (path) => ({
        data: { publicUrl: `https://synthetic.example/${bucket}/${path}` },
      }),
    }),
  },
};
test("maps owner schema, image order and unconfirmed reputation without inventing values", () => {
  const item = mapListing(
    {
      id: "test",
      seller_id: "owner",
      model: "iPhone 15",
      storage_gb: 256,
      price_usd: "540.50",
      aesthetic_condition: "excellent",
      battery_health: null,
      battery_type: "unknown",
      includes_cable: true,
      includes_charger: false,
      has_warranty: false,
      warranty_days: 15,
      municipality: "Playa",
      status: "published",
      created_at: "2026-09-29T12:00:00Z",
      seller: {
        id: "owner",
        display_name: "Ana",
        verification_status: "approved",
        total_reviews: 0,
        rating: "0",
        total_sales: 0,
        created_at: "2026-01-01T00:00:00Z",
      },
      listing_images: [
        { storage_path: "second", position: 2 },
        { storage_path: "first", position: 1 },
      ],
    },
    imageClient,
    contract,
    Date.parse("2026-09-30T12:00:00Z"),
  );
  assert.equal(item.price, 540.5);
  assert.equal(item.battery, null);
  assert.equal(item.rating, null);
  assert.equal(item.sales, 0);
  assert.equal(item.condition, "Excelente");
  assert.equal(item.verified, true);
  assert.equal(item.warrantyDays, 0);
  assert.equal(item.accessories, false);
  assert.equal(item.includesCable, true);
  assert.equal(item.includesCharger, false);
  assert.equal(item.image, "https://synthetic.example/listing-photos/first");
  assert.equal(item.hours, 24);
});
test("writes exact schema fields with separate accessories and ownership confirmation", () => {
  const item = listingPayload(
    {
      id: "id",
      owner: true,
      model: "iPhone 15",
      condition: "Como nuevo",
      storage: 128,
      originalBattery: false,
      includesCable: true,
      includesCharger: false,
      warrantyDays: 7,
      faceId: true,
      trueTone: false,
      price: 500,
      details: "Marca en el marco",
      location: "Playa",
      negotiable: true,
      acceptsTrade: true,
    },
    "authenticated-owner",
    contract,
  );
  assert.equal(item.seller_id, "authenticated-owner");
  assert.equal(item.ownership_confirmed, true);
  assert.equal(item.battery_type, "generic");
  assert.equal(item.aesthetic_condition, "like_new");
  assert.equal(item.includes_cable, true);
  assert.equal(item.includes_charger, false);
  assert.equal(item.true_tone_working, false);
  assert.equal(item.has_details, true);
  assert.equal(item.has_warranty, true);
  assert.equal(Object.hasOwn(item, "status"), false);
  assert.equal(Object.hasOwn(item, "verification_status"), false);
});
test("upload failure removes only successfully uploaded objects from that batch", async () => {
  const uploaded = [],
    removed = [];
  const client = {
    storage: {
      from: () => ({
        upload: async (path) => {
          if (uploaded.length) return { error: new Error("Simulated failure") };
          uploaded.push(path);
          return { data: { path } };
        },
        remove: async (paths) => {
          removed.push(...paths);
          return { data: paths };
        },
      }),
    },
  };
  await assert.rejects(
    uploadDataImages(client, "listing-photos", "owner/listing", [
      "data:image/webp;base64,UklGRg==",
      "data:image/webp;base64,UklGRg==",
    ]),
    /Simulated failure/,
  );
  assert.equal(uploaded.length, 1);
  assert.deepEqual(removed, uploaded);
});
test("a transport failure after commit does not delete photos belonging to a saved listing", async () => {
  const removed = [];
  let attempts = 0;
  const lookup = {
    select() {
      return this;
    },
    eq() {
      return this;
    },
    async maybeSingle() {
      return {
        data:
          ++attempts === 1
            ? null
            : { id: "id", seller_id: "owner", status: "pending_review" },
        error: null,
      };
    },
  };
  const client = {
    rpc: async (name) =>
      name === "imarket_contract"
        ? { data: contract, error: null }
        : { error: new Error("Connection lost after commit") },
    from: () => lookup,
    storage: {
      from: () => ({
        upload: async (path) => ({ data: { path } }),
        remove: async (paths) => {
          removed.push(...paths);
          return { data: paths };
        },
      }),
    },
  };
  const repository = createRepository(client);
  const result = await repository.publish(
    {
      id: "id",
      owner: true,
      condition: "Excelente",
      photos: ["data:image/webp;base64,UklGRg=="],
    },
    "owner",
  );
  assert.equal(result.id, "id");
  assert.deepEqual(removed, []);
});

test("retry of an existing owned listing avoids duplicate writes/uploads and rejects another owner", async () => {
  let row = { id: "saved", seller_id: "owner", status: "pending_review" };
  const lookup = {
    select() {
      return this;
    },
    eq() {
      return this;
    },
    async maybeSingle() {
      return { data: row, error: null };
    },
  };
  const client = {
    rpc: async () => ({ data: contract, error: null }),
    from: () => lookup,
    storage: {
      from() {
        throw new Error("Must not upload on retry");
      },
    },
  };
  const repository = createRepository(client);
  assert.deepEqual(await repository.publish({ id: "saved" }, "owner"), {
    id: "saved",
    status: "pending_review",
  });
  row = { ...row, seller_id: "someone-else" };
  await assert.rejects(
    repository.publish({ id: "saved" }, "owner"),
    /IMARKET_FORBIDDEN/,
  );
});
