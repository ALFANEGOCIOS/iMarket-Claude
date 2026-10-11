import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { databaseFixture, asUser } from "./helpers/database-fixture.mjs";
const bundle = await readFile(
  new URL("../supabase/project-migration.sql", import.meta.url),
  "utf8",
);
const triggers = await readFile(
  new URL("./helpers/project-triggers.sql", import.meta.url),
  "utf8",
);
const snapshot = "2e968a8572dad26bc8d98c2efaced3a3";
const seller = "10000000-0000-4000-8000-000000000001",
  buyer = "10000000-0000-4000-8000-000000000002",
  admin = "10000000-0000-4000-8000-000000000003";
const listing = "20000000-0000-4000-8000-000000000001";
const payload = {
  id: listing,
  ownership_confirmed: true,
  model: "iPhone 15",
  storage_gb: 128,
  color: "Verde",
  price_usd: 520,
  negotiable: false,
  accepts_trade: false,
  aesthetic_condition: "excellent",
  battery_health: 95,
  battery_type: "original",
  factory_unlocked: true,
  face_id_working: true,
  true_tone_working: true,
  includes_cable: true,
  includes_charger: false,
  has_details: false,
  details: null,
  has_warranty: true,
  warranty_days: 7,
  municipality: "Playa",
  description: "iPhone personal cuidado siempre con funda y protector.",
};

test("project migration preserves Auth/guard/reputation triggers with the observed enum and constraint contract", async (t) => {
  const db = await databaseFixture();
  try {
    await db.exec(triggers);
    // Synthetic local baseline: deliberately not claimed as the remote policy snapshot.
    await db.exec(
      "alter table public.listings enable row level security;create policy legacy_fixture_owner on public.listings for all to authenticated using(seller_id=auth.uid());grant all on public.listings,public.messages,public.conversations to authenticated;",
    );
    const fixtureHash = (
      await db.query(
        "select md5(jsonb_agg(to_jsonb(p) order by schemaname,tablename,policyname)::text) hash from pg_policies p",
      )
    ).rows[0].hash;
    await db.exec(bundle.replace(snapshot, fixtureHash));
    await db.exec(bundle.replace(snapshot, fixtureHash));
    for (const id of [seller, buyer, admin])
      await db.query("insert into auth.users(id) values($1)", [id]);
    await db.query(
      "insert into public.user_roles(user_id,role) values($1,'admin')",
      [admin],
    );
    await db.exec("begin;select public._begin_internal_op()");
    await db.query(
      "update public.profiles set verification_status='approved' where id=$1",
      [seller],
    );
    await db.exec("select set_config('app.internal_token','',true);commit");
    await t.test(
      "Auth trigger still creates the public and private profile",
      async () => {
        assert.equal(
          (await db.query("select count(*)::integer n from public.profiles"))
            .rows[0].n,
          3,
        );
        assert.equal(
          (
            await db.query(
              "select count(*)::integer n from public.profile_private",
            )
          ).rows[0].n,
          3,
        );
        const contract = (
          await asUser(db, null, "select public.imarket_contract() c")
        ).rows[0].c;
        assert.equal(contract.published, "active");
        assert.equal(contract.photoBucket, "listing-images");
        assert.equal(contract.identityBucket, "verification-private");
      },
    );
    await t.test(
      "internal helper is unavailable to public clients and message/conversation writes are revoked",
      async () => {
        await assert.rejects(
          asUser(db, null, "select public._begin_internal_op()"),
          /permission denied/,
        );
        await assert.rejects(
          asUser(db, buyer, "select public._begin_internal_op()"),
          /permission denied/,
        );
        await assert.rejects(
          asUser(db, buyer, "update public.messages set sender_id=$1", [buyer]),
          /permission denied/,
        );
        await assert.rejects(
          asUser(db, buyer, "update public.conversations set seller_id=$1", [
            buyer,
          ]),
          /permission denied/,
        );
      },
    );
    await t.test(
      "UUID photos work with the existing image-path trigger and protected lifecycle",
      async () => {
        const path = `${seller}/${listing}/30000000-0000-4000-8000-000000000001.webp`;
        await asUser(
          db,
          seller,
          "insert into storage.objects(bucket_id,name,owner_id) values('listing-images',$1,$2)",
          [path, seller],
        );
        await asUser(
          db,
          seller,
          "select public.imarket_create_listing($1,$2)",
          [payload, [path]],
        );
        await asUser(
          db,
          admin,
          "select public.imarket_review_listing($1,true,null)",
          [listing],
        );
        await asUser(
          db,
          buyer,
          "insert into public.favorites(user_id,listing_id) values($1,$2)",
          [buyer, listing],
        );
        assert.equal(
          (
            await asUser(
              db,
              null,
              "select favorites_count from public.listings",
            )
          ).rows[0].favorites_count,
          1,
        );
        const result = (
          await asUser(
            db,
            buyer,
            "select public.imarket_send_message($1,$2) c",
            [listing, "Hola, ¿sigue disponible este iPhone?"],
          )
        ).rows[0].c;
        assert.ok(result);
      },
    );
    await t.test(
      "sale uses the internal guard safely and platform feedback does not modify user reputation",
      async () => {
        const receipt = (
          await asUser(db, seller, "select public.imarket_report_sale($1) r", [
            listing,
          ])
        ).rows[0].r;
        assert.ok(receipt.sale_id);
        assert.equal(
          (
            await asUser(
              db,
              seller,
              "select current_setting('app.internal_token',true) token",
            )
          ).rows[0].token,
          "",
        );
        await db.exec("reset role;begin;select public._begin_internal_op()");
        await db.query(
          "insert into public.platform_reviews(user_id,reviewer_id,sale_id,rating,comment) values($1,$2,$3,4,'Reseña histórica entre usuarios')",
          [buyer, seller, receipt.sale_id],
        );
        await db.exec("select set_config('app.internal_token','',true);commit");
        const before = (
          await db.query(
            "select rating,total_reviews from public.profiles where id=$1",
            [buyer],
          )
        ).rows[0];
        await asUser(
          db,
          seller,
          "select public.imarket_platform_review($1,5,$2)",
          [receipt.sale_id, "La plataforma me permitió vender mi teléfono."],
        );
        assert.equal(
          (await asUser(db, seller, "select * from public.platform_feedback"))
            .rows.length,
          1,
        );
        assert.equal(
          (await asUser(db, seller, "select * from public.platform_reviews"))
            .rows.length,
          1,
        );
        await db.exec("reset role");
        assert.deepEqual(
          (
            await db.query(
              "select rating,total_reviews from public.profiles where id=$1",
              [buyer],
            )
          ).rows[0],
          before,
        );
        assert.equal(
          (
            await db.query(
              "select total_sales from public.profiles where id=$1",
              [seller],
            )
          ).rows[0].total_sales,
          0,
        );
      },
    );
    await t.test(
      "rejected verification can be resubmitted without bypassing the protected-profile trigger",
      async () => {
        const paths = [
          `${buyer}/request/selfie.webp`,
          `${buyer}/request/document.webp`,
        ];
        for (const path of paths)
          await asUser(
            db,
            buyer,
            "insert into storage.objects(bucket_id,name,owner_id) values('verification-private',$1,$2)",
            [path, buyer],
          );
        const request = (
          await asUser(
            db,
            buyer,
            "select public.imarket_request_verification($1,$2) id",
            paths,
          )
        ).rows[0].id;
        await asUser(
          db,
          admin,
          "select public.imarket_review_verification($1,false,$2)",
          [request, "Fotografía demasiado oscura"],
        );
        await asUser(
          db,
          buyer,
          "select public.imarket_request_verification($1,$2)",
          paths,
        );
        assert.equal(
          (
            await asUser(
              db,
              buyer,
              "select verification_status from public.profiles where id=$1",
              [buyer],
            )
          ).rows[0].verification_status,
          "pending",
        );
        assert.equal(
          (
            await asUser(
              db,
              buyer,
              "select current_setting('app.internal_token',true) token",
            )
          ).rows[0].token,
          "",
        );
      },
    );
  } finally {
    await db.close();
  }
});

test("project migration aborts before changing an unexpected policy snapshot", async () => {
  const db = await databaseFixture();
  try {
    await db.exec(
      "alter table public.profiles enable row level security;create policy unexpected_policy on public.profiles for select using(true)",
    );
    await assert.rejects(db.exec(bundle), /IMARKET_POLICY_SNAPSHOT_CHANGED/);
    await db.exec("rollback");
    assert.equal(
      (
        await db.query(
          "select policyname from pg_policies where policyname='unexpected_policy'",
        )
      ).rows.length,
      1,
    );
    assert.equal(
      (await db.query("select to_regclass('public.platform_feedback') name"))
        .rows[0].name,
      null,
    );
  } finally {
    await db.close();
  }
});
