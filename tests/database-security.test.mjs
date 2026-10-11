import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { databaseFixture, asUser } from "./helpers/database-fixture.mjs";
const migration = await readFile(
  new URL("../supabase/integration.sql", import.meta.url),
  "utf8",
);
const seller = "10000000-0000-4000-8000-000000000001",
  buyer = "10000000-0000-4000-8000-000000000002",
  admin = "10000000-0000-4000-8000-000000000003",
  stranger = "10000000-0000-4000-8000-000000000004";
const listingId = "20000000-0000-4000-8000-000000000001";
const payload = {
  id: listingId,
  owner: true,
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

test("existing-table integration enforces permissions and transactional workflows", async (t) => {
  const db = await databaseFixture();
  try {
    await db.exec(
      "grant update(verification_status) on public.profiles to authenticated;",
    );
    await db.exec(migration);
    await db.exec(migration); // Rerun must be safe.
    for (const [id, name] of [
      [seller, "Vendedor"],
      [buyer, "Comprador"],
      [admin, "Revisor"],
      [stranger, "Otro usuario"],
    ]) {
      await db.query("insert into auth.users(id) values($1)", [id]);
      await db.query(
        "insert into public.profiles(id,display_name) values($1,$2)",
        [id, name],
      );
    }
    await db.query(
      "insert into public.user_roles(user_id,role) values($1,'admin')",
      [admin],
    );
    await t.test(
      "client cannot self-verify, change sales totals or assign administrator role",
      async () => {
        await assert.rejects(
          asUser(
            db,
            seller,
            "update public.profiles set verification_status='approved' where id=$1",
            [seller],
          ),
          /permission denied/,
        );
        await assert.rejects(
          asUser(
            db,
            seller,
            "update public.profiles set total_sales=999 where id=$1",
            [seller],
          ),
          /permission denied/,
        );
        await assert.rejects(
          asUser(
            db,
            seller,
            "insert into public.user_roles(user_id,role) values($1,'admin')",
            [seller],
          ),
          /permission denied/,
        );
        await assert.rejects(
          asUser(
            db,
            seller,
            "select public.imarket_review_verification(gen_random_uuid(),true,null)",
          ),
          /IMARKET_FORBIDDEN/,
        );
      },
    );
    await t.test("exact address is visible only to its owner", async () => {
      await asUser(
        db,
        seller,
        "select public.imarket_save_private_profile('+5300000000','Dirección sintética de prueba')",
      );
      assert.equal(
        (await asUser(db, stranger, "select * from public.profile_private"))
          .rows.length,
        0,
      );
      assert.equal(
        (await asUser(db, seller, "select * from public.profile_private")).rows
          .length,
        1,
      );
      await assert.rejects(
        asUser(db, null, "select * from public.profile_private"),
        /permission denied/,
      );
    });
    await t.test(
      "public/private profile updates are atomic on failure",
      async () => {
        await assert.rejects(
          asUser(
            db,
            seller,
            "select public.imarket_save_profile($1,$2,$3,$4)",
            ["Nombre nuevo", "Playa", "+5300000000", "x".repeat(301)],
          ),
          /IMARKET_INVALID_PROFILE/,
        );
        assert.equal(
          (
            await asUser(
              db,
              seller,
              "select display_name from public.profiles where id=$1",
              [seller],
            )
          ).rows[0].display_name,
          "Vendedor",
        );
      },
    );
    await t.test(
      "unverified owner cannot publish and private identity is isolated",
      async () => {
        await assert.rejects(
          asUser(
            db,
            seller,
            "select public.imarket_create_listing($1::jsonb,$2::text[])",
            [
              JSON.stringify(payload),
              [seller + "/" + listingId + "/photo.webp"],
            ],
          ),
          /IMARKET_VERIFICATION_REQUIRED/,
        );
        for (const name of ["selfie", "document"])
          await asUser(
            db,
            seller,
            "insert into storage.objects(bucket_id,name,owner_id) values('verification-private',$1,$2)",
            [seller + "/request/" + name + ".webp", seller],
          );
        assert.equal(
          (
            await asUser(
              db,
              stranger,
              "select * from storage.objects where bucket_id='verification-private'",
            )
          ).rows.length,
          0,
        );
        const request = (
          await asUser(
            db,
            seller,
            "select public.imarket_request_verification($1,$2) as id",
            [
              seller + "/request/selfie.webp",
              seller + "/request/document.webp",
            ],
          )
        ).rows[0].id;
        await assert.rejects(
          asUser(
            db,
            seller,
            "select public.imarket_request_verification($1,$2)",
            [
              seller + "/request/selfie.webp",
              seller + "/request/document.webp",
            ],
          ),
          /IMARKET_VERIFICATION_PENDING/,
        );
        await asUser(
          db,
          admin,
          "select public.imarket_review_verification($1,true,null)",
          [request],
        );
        assert.equal(
          (
            await asUser(
              db,
              seller,
              "select verification_status from public.profiles where id=$1",
              [seller],
            )
          ).rows[0].verification_status,
          "approved",
        );
      },
    );
    await t.test(
      "legacy verification requests without both private images cannot be approved",
      async () => {
        await db.exec("reset role");
        const id = (
          await db.query(
            "insert into public.verification_requests(user_id) values($1) returning id",
            [stranger],
          )
        ).rows[0].id;
        await assert.rejects(
          asUser(
            db,
            admin,
            "select public.imarket_review_verification($1,true,null)",
            [id],
          ),
          /IMARKET_INVALID_PHOTOS/,
        );
        await db.exec("reset role");
        await db.query("delete from public.verification_requests where id=$1", [
          id,
        ]);
      },
    );
    await t.test(
      "publication binds the owner and images, starts pending and requires moderation",
      async () => {
        const path = seller + "/" + listingId + "/photo.webp";
        await asUser(
          db,
          seller,
          "insert into storage.objects(bucket_id,name,owner_id) values('listing-images',$1,$2)",
          [path, seller],
        );
        await assert.rejects(
          asUser(
            db,
            seller,
            "select public.imarket_create_listing($1::jsonb,$2::text[])",
            [
              JSON.stringify({
                ...payload,
                id: "20000000-0000-4000-8000-000000000002",
              }),
              [buyer + "/someone-else/photo.webp"],
            ],
          ),
          /IMARKET_INVALID_PHOTOS/,
        );
        await asUser(
          db,
          seller,
          "select public.imarket_create_listing($1::jsonb,$2::text[])",
          [JSON.stringify({ ...payload, seller_id: buyer }), [path]],
        );
        assert.equal(
          (await asUser(db, null, "select * from public.listings")).rows.length,
          0,
        );
        assert.equal(
          (
            await asUser(
              db,
              seller,
              "select seller_id from public.listings where id=$1",
              [listingId],
            )
          ).rows[0].seller_id,
          seller,
        );
        assert.equal(
          (
            await asUser(
              db,
              seller,
              "select count(*)::int n from public.listing_images where listing_id=$1",
              [listingId],
            )
          ).rows[0].n,
          1,
        );
        await asUser(
          db,
          admin,
          "select public.imarket_review_listing($1,true,null)",
          [listingId],
        );
        assert.equal(
          (await asUser(db, null, "select * from public.listings")).rows.length,
          1,
        );
        assert.equal(
          (await asUser(db, null, "select * from public.listing_images")).rows
            .length,
          1,
        );
        await assert.rejects(
          asUser(
            db,
            seller,
            "update public.listings set seller_id=$1 where id=$2",
            [buyer, listingId],
          ),
          /permission denied/,
        );
        await asUser(
          db,
          seller,
          "delete from storage.objects where bucket_id='listing-images' and name=$1",
          [path],
        );
        assert.equal(
          (
            await asUser(
              db,
              seller,
              "select * from storage.objects where name=$1",
              [path],
            )
          ).rows.length,
          1,
        );
      },
    );
    await t.test("favorites cannot be assigned to another user", async () => {
      await asUser(
        db,
        buyer,
        "insert into public.favorites(user_id,listing_id) values($1,$2)",
        [buyer, listingId],
      );
      await assert.rejects(
        asUser(
          db,
          buyer,
          "insert into public.favorites(user_id,listing_id) values($1,$2)",
          [stranger, listingId],
        ),
        /row-level security/,
      );
      assert.equal(
        (await asUser(db, stranger, "select * from public.favorites")).rows
          .length,
        0,
      );
    });
    let conversation;
    await t.test(
      "conversation participants can exchange messages; outsiders cannot read or spoof them",
      async () => {
        conversation = (
          await asUser(
            db,
            buyer,
            "select public.imarket_send_message($1,$2) id",
            [listingId, "¿Sigue disponible?"],
          )
        ).rows[0].id;
        await asUser(db, seller, "select public.imarket_reply($1,$2)", [
          conversation,
          "Sí, puedes revisarlo en persona.",
        ]);
        assert.equal(
          (await asUser(db, stranger, "select * from public.messages")).rows
            .length,
          0,
        );
        assert.equal(
          (await asUser(db, buyer, "select * from public.messages")).rows
            .length,
          2,
        );
        await assert.rejects(
          asUser(db, stranger, "select public.imarket_reply($1,$2)", [
            conversation,
            "Mensaje de intruso",
          ]),
          /IMARKET_FORBIDDEN/,
        );
        await assert.rejects(
          asUser(
            db,
            buyer,
            "insert into public.messages(conversation_id,sender_id,content) values($1,$2,$3)",
            [conversation, seller, "Suplantación"],
          ),
          /permission denied/,
        );
        await asUser(
          db,
          seller,
          "select public.imarket_read_conversation($1)",
          [conversation],
        );
        assert.ok(
          (
            await asUser(
              db,
              buyer,
              "select read_at from public.messages where sender_id=$1",
              [buyer],
            )
          ).rows[0].read_at,
        );
        await asUser(
          db,
          seller,
          "insert into public.user_blocks(blocker_id,blocked_id) values($1,$2)",
          [seller, buyer],
        );
        await assert.rejects(
          asUser(db, buyer, "select public.imarket_reply($1,$2)", [
            conversation,
            "Otro mensaje",
          ]),
          /IMARKET_BLOCKED/,
        );
      },
    );
    await t.test(
      "sale reporting is owner-only, atomic and does not create reputation",
      async () => {
        await assert.rejects(
          asUser(db, buyer, "select public.imarket_report_sale($1)", [
            listingId,
          ]),
          /IMARKET_FORBIDDEN/,
        );
        const receipt = (
          await asUser(
            db,
            seller,
            "select public.imarket_report_sale($1) receipt",
            [listingId],
          )
        ).rows[0].receipt;
        assert.ok(receipt.sale_id);
        await assert.rejects(
          asUser(db, seller, "select public.imarket_report_sale($1)", [
            listingId,
          ]),
          /IMARKET_ALREADY_SOLD/,
        );
        assert.equal(
          (await asUser(db, null, "select * from public.listings")).rows.length,
          0,
        );
        const sale = (
          await asUser(db, seller, "select * from public.sales where id=$1", [
            receipt.sale_id,
          ])
        ).rows[0];
        assert.equal(sale.status, "reported");
        assert.equal(sale.buyer_confirmed, false);
        assert.equal(sale.seller_confirmed, true);
        assert.equal(
          (
            await asUser(
              db,
              seller,
              "select total_sales from public.profiles where id=$1",
              [seller],
            )
          ).rows[0].total_sales,
          0,
        );
        await assert.rejects(
          asUser(db, buyer, "select public.imarket_platform_review($1,5,$2)", [
            receipt.sale_id,
            "Intento de reseña ajena",
          ]),
          /IMARKET_FORBIDDEN/,
        );
        await asUser(
          db,
          seller,
          "select public.imarket_platform_review($1,5,$2)",
          [receipt.sale_id, "La plataforma fue sencilla de usar."],
        );
        await assert.rejects(
          asUser(db, seller, "select public.imarket_platform_review($1,5,$2)", [
            receipt.sale_id,
            "Intento de reseña duplicada",
          ]),
          /IMARKET_REVIEW_EXISTS/,
        );
        const review = (
          await asUser(db, seller, "select * from public.platform_feedback")
        ).rows[0];
        assert.equal(review.user_id, seller);
        assert.equal(review.sale_id, receipt.sale_id);
        assert.equal(
          (await asUser(db, seller, "select * from public.platform_reviews"))
            .rows.length,
          0,
        );
        assert.equal(
          (
            await asUser(
              db,
              seller,
              "select rating,total_reviews from public.profiles where id=$1",
              [seller],
            )
          ).rows[0].total_reviews,
          0,
        );
        assert.equal(
          (await asUser(db, buyer, "select * from public.platform_feedback"))
            .rows.length,
          0,
        );
      },
    );
  } finally {
    await db.close();
  }
});

test("migration refuses to combine with an unknown permissive policy", async () => {
  const db = await databaseFixture();
  try {
    await db.exec(
      "alter table public.profile_private enable row level security;create policy imarket_legacy_open on public.profile_private for select using(true);",
    );
    await assert.rejects(db.exec(migration), /IMARKET_EXISTING_POLICIES/);
    await db.exec("rollback");
    assert.equal(
      (
        await db.query(
          "select policyname from pg_policies where policyname='imarket_legacy_open'",
        )
      ).rows.length,
      1,
    );
  } finally {
    await db.close();
  }
});

test("unsupported enum labels abort configuration rather than guessing a write status", async () => {
  const db = await databaseFixture();
  try {
    await db.exec(
      "alter type public.listing_status rename value 'active' to 'custom_visible';",
    );
    await assert.rejects(db.exec(migration), /IMARKET_ENUM/);
    await db.exec("rollback");
  } finally {
    await db.close();
  }
});
