const selection = `*,seller:profiles!listings_seller_id_fkey!inner(id,display_name,created_at,verification_status,total_sales,total_reviews,rating),listing_images(storage_path,position)`;
const conditions = ["Como nuevo", "Excelente", "Buen estado"];
export function publicError(error) {
  const message = error?.message || "";
  const codes = {
    IMARKET_VERIFICATION_REQUIRED: "Verifica tu identidad antes de publicar.",
    IMARKET_ACCOUNT_RESTRICTED:
      "Tu cuenta no puede realizar esta acción. Contacta al administrador.",
    IMARKET_ALREADY_SOLD:
      "El anuncio ya no está disponible para marcarlo como vendido.",
    IMARKET_BLOCKED: "No se puede iniciar esta conversación.",
    IMARKET_OWN_LISTING: "Este anuncio es tuyo.",
    IMARKET_VERIFICATION_PENDING:
      "Ya tienes una solicitud de verificación pendiente.",
    IMARKET_REVIEW_EXISTS: "Ya dejaste una reseña sobre esta venta.",
    IMARKET_UNAUTHENTICATED: "Inicia sesión para continuar.",
    IMARKET_FORBIDDEN: "No tienes permiso para realizar esta acción.",
  };
  for (const [code, text] of Object.entries(codes))
    if (message.includes(code)) return text;
  if (message.includes("IMARKET_ENUM"))
    return "La configuración de la base de datos requiere revisión. Contacta al administrador.";
  return "No se pudo completar la operación. Revisa tu conexión e inténtalo de nuevo.";
}
function checked(result) {
  if (result.error) throw result.error;
  return result.data;
}
export function mapProfile(profile, sessionUser) {
  return {
    ...profile,
    name: profile.display_name,
    email: sessionUser.email,
    authenticated: true,
  };
}
export function mapListing(row, client, contract, now = Date.now()) {
  const seller = row.seller || {};
  const photos = [...(row.listing_images || [])]
    .sort((a, b) => a.position - b.position)
    .map(
      (photo) =>
        client.storage
          .from(contract.photoBucket)
          .getPublicUrl(photo.storage_path).data.publicUrl,
    );
  const published = row.published_at || row.created_at;
  return {
    id: row.id,
    sellerId: row.seller_id,
    model: row.model,
    storage: row.storage_gb,
    color: row.color,
    price: Number(row.price_usd),
    negotiable: row.negotiable,
    acceptsTrade: row.accepts_trade,
    battery: row.battery_health,
    condition:
      conditions[contract.conditions.indexOf(row.aesthetic_condition)] ||
      row.aesthetic_condition,
    batteryType: row.battery_type,
    originalBattery: row.battery_type === contract.originalBattery,
    factoryUnlocked: row.factory_unlocked,
    faceId: row.face_id_working,
    trueTone: row.true_tone_working,
    warrantyDays: row.has_warranty ? row.warranty_days || 0 : 0,
    includesCable: row.includes_cable,
    includesCharger: row.includes_charger,
    accessories: row.includes_cable && row.includes_charger,
    location: row.municipality,
    neighborhood: row.neighborhood,
    description: row.description || "",
    details: row.has_details ? row.details : "",
    image: photos[0] || "/images/placeholder.svg",
    photos,
    seller: seller.display_name || "Propietario",
    initials: (seller.display_name || "P").slice(0, 2).toUpperCase(),
    avatar: "#dfe6d7",
    rating: seller.total_reviews > 0 ? Number(seller.rating) : null,
    sales: seller.total_sales || 0,
    joined: seller.created_at
      ? new Intl.DateTimeFormat("es", {
          month: "long",
          year: "numeric",
        }).format(new Date(seller.created_at))
      : "hace poco",
    hours: Math.max(
      0,
      Math.floor((now - new Date(published).getTime()) / 3600000),
    ),
    verified: seller.verification_status === contract.verified,
    sold: row.status === contract.sold,
    status: row.status,
    createdAt: row.created_at,
    publishedAt: row.published_at,
    featured: Boolean(row.featured_at),
  };
}
export function listingPayload(item, userId, contract) {
  const condition = contract.conditions[conditions.indexOf(item.condition)];
  if (!condition) throw new Error("IMARKET_ENUM_CONDITION");
  return {
    id: item.id,
    seller_id: userId,
    ownership_confirmed: item.owner === true,
    model: item.model,
    storage_gb: item.storage,
    color: item.color,
    price_usd: item.price,
    negotiable: !!item.negotiable,
    accepts_trade: !!item.acceptsTrade,
    aesthetic_condition: condition,
    battery_health: item.battery,
    battery_type: item.originalBattery
      ? contract.originalBattery
      : contract.genericBattery,
    factory_unlocked: item.factoryUnlocked,
    face_id_working: item.faceId,
    true_tone_working: item.trueTone,
    includes_cable: item.includesCable ?? item.accessories,
    includes_charger: item.includesCharger ?? item.accessories,
    has_details: !!item.details,
    details: item.details || null,
    has_warranty: item.warrantyDays > 0,
    warranty_days: item.warrantyDays || null,
    municipality: item.location,
    neighborhood: item.neighborhood || null,
    title: item.model,
    description: item.description,
  };
}
export async function uploadDataImages(client, bucket, folder, dataImages) {
  const paths = [];
  try {
    for (const image of dataImages) {
      const blob = await (await fetch(image)).blob();
      if (blob.type !== "image/webp" || blob.size > 5 * 1024 * 1024)
        throw new Error("Invalid processed image");
      const path = `${folder}/${crypto.randomUUID()}.webp`;
      checked(
        await client.storage
          .from(bucket)
          .upload(path, blob, { contentType: "image/webp", upsert: false }),
      );
      paths.push(path);
    }
    return paths;
  } catch (error) {
    if (paths.length) await client.storage.from(bucket).remove(paths);
    throw error;
  }
}
export function createRepository(client) {
  let contract;
  const rpc = async (name, args) => checked(await client.rpc(name, args));
  return {
    async contract() {
      contract ??= await rpc("imarket_contract");
      return contract;
    },
    async profile(sessionUser) {
      let profile = checked(
        await client
          .from("profiles")
          .select("*")
          .eq("id", sessionUser.id)
          .maybeSingle(),
      );
      if (!profile) {
        const name = String(
          sessionUser.user_metadata?.name ||
            sessionUser.user_metadata?.display_name ||
            sessionUser.email?.split("@")[0] ||
            "Propietario",
        )
          .trim()
          .slice(0, 60);
        const result = await client.from("profiles").insert({
          id: sessionUser.id,
          display_name: name.length >= 2 ? name : "Propietario",
        });
        if (result.error && result.error.code !== "23505") throw result.error;
        profile = checked(
          await client
            .from("profiles")
            .select("*")
            .eq("id", sessionUser.id)
            .single(),
        );
      }
      return mapProfile(profile, sessionUser);
    },
    async roles() {
      return checked(await client.from("user_roles").select("role")) || [];
    },
    async catalog(filters, limit = 24, offset = 0) {
      const config = await this.contract();
      if (filters.favoritesOnly && !filters.favorites?.length)
        return { items: [], total: 0 };
      let query = client
        .from("listings")
        .select(selection, { count: "exact" })
        .eq("status", config.published)
        .eq("seller.verification_status", config.verified)
        .eq("seller.is_suspended", false)
        .eq("seller.is_banned", false)
        .eq("seller.account_type", "individual");
      if (filters.query) {
        const search = filters.query.replace(/[%,()."'\\]/g, " ").trim();
        if (search)
          query = query.or(
            ["model", "color", "municipality"]
              .map((field) => `${field}.ilike.%${search}%`)
              .join(","),
          );
      }
      if (filters.models?.length)
        query = query.or(
          filters.models
            .flatMap((model) => [
              `model.eq.${model}`,
              `model.like.${model} %`,
              ...(model === "iPhone X" ? ["model.like.iPhone XS%", "model.like.iPhone XR%"] : []),
            ])
            .join(","),
        );
      if (filters.storage?.length)
        query = query.in("storage_gb", filters.storage);
      if (filters.conditions?.length)
        query = query.in(
          "aesthetic_condition",
          filters.conditions.map(
            (condition) => config.conditions[conditions.indexOf(condition)],
          ),
        );
      if (filters.minPrice !== "")
        query = query.gte("price_usd", Number(filters.minPrice));
      if (filters.maxPrice !== "")
        query = query.lte("price_usd", Number(filters.maxPrice));
      if (filters.minBattery)
        query = query.gte("battery_health", filters.minBattery);
      if (filters.location) query = query.eq("municipality", filters.location);
      if (filters.warranty)
        query = query.eq("has_warranty", true).gt("warranty_days", 0);
      if (filters.favoritesOnly) query = query.in("id", filters.favorites);
      const sort =
        filters.sort === "price-asc" || filters.sort === "price-desc"
          ? "price_usd"
          : filters.sort === "battery"
            ? "battery_health"
            : "published_at";
      const result = await query
        .order(sort, {
          ascending: filters.sort === "price-asc",
          nullsFirst: false,
        })
        .order("id")
        .range(offset, Math.max(offset + 1, limit) - 1);
      const rows = checked(result) || [];
      return {
        items: rows.map((row) => mapListing(row, client, config)),
        total: result.count || 0,
      };
    },
    async featured(limit = 6) {
      const config = await this.contract();
      const rows =
        checked(
          await client
            .from("listings")
            .select(selection)
            .eq("status", config.published)
            .eq("seller.verification_status", config.verified)
            .eq("seller.is_suspended", false)
            .eq("seller.is_banned", false)
            .not("featured_at", "is", null)
            .order("featured_at", { ascending: false })
            .limit(limit),
        ) || [];
      return rows.map((row) => mapListing(row, client, config));
    },
    async adminListings() {
      const config = await this.contract();
      return (
        checked(
          await client
            .from("listings")
            .select(
              "id,model,storage_gb,color,price_usd,status,featured_at,seller:profiles!listings_seller_id_fkey(display_name)",
            )
            .eq("status", config.published)
            .order("featured_at", { ascending: false, nullsFirst: false })
            .order("published_at", { ascending: false })
            .limit(100),
        ) || []
      );
    },
    adminSetFeatured(listingId, featured) {
      return rpc("imarket_admin_set_featured", {
        p_listing_id: listingId,
        p_featured: featured,
      });
    },
    async owned(userId) {
      const config = await this.contract();
      return (
        checked(
          await client
            .from("listings")
            .select(selection)
            .eq("seller_id", userId)
            .order("created_at", { ascending: false })
            .limit(100),
        ) || []
      ).map((row) => mapListing(row, client, config));
    },
    async favorites(userId) {
      return (
        checked(
          await client
            .from("favorites")
            .select("listing_id")
            .eq("user_id", userId),
        ) || []
      ).map((row) => row.listing_id);
    },
    async favorite(userId, listingId, add) {
      checked(
        await (add
          ? client
              .from("favorites")
              .insert({ user_id: userId, listing_id: listingId })
          : client
              .from("favorites")
              .delete()
              .eq("user_id", userId)
              .eq("listing_id", listingId)),
      );
    },
    async publish(item, userId) {
      const config = await this.contract();
      const previous = checked(
        await client
          .from("listings")
          .select("id,seller_id,status")
          .eq("id", item.id)
          .maybeSingle(),
      );
      if (previous) {
        if (previous.seller_id !== userId) throw new Error("IMARKET_FORBIDDEN");
        return { id: previous.id, status: previous.status };
      }
      const paths = await uploadDataImages(
        client,
        config.photoBucket,
        `${userId}/${item.id}`,
        item.photos,
      );
      try {
        return await rpc("imarket_create_listing", {
          p_payload: listingPayload(item, userId, config),
          p_photo_paths: paths,
        });
      } catch (error) {
        // A transport timeout can happen after the transaction commits. Keep photos
        // when existence cannot be determined; never break a committed listing.
        const result = await client
          .from("listings")
          .select("id")
          .eq("id", item.id)
          .maybeSingle();
        if (!result.error && !result.data)
          await client.storage.from(config.photoBucket).remove(paths);
        if (result.data) return { id: item.id, status: config.pending };
        throw error;
      }
    },
    reportSale(listingId) {
      return rpc("imarket_report_sale", { p_listing_id: listingId });
    },
    assignSaleBuyer(saleId, buyerId) {
      return rpc("imarket_assign_sale_buyer", {
        p_sale_id: saleId,
        p_buyer_id: buyerId,
      });
    },
    confirmSale(saleId) {
      return rpc("imarket_confirm_sale", { p_sale_id: saleId });
    },
    async mySales(userId) {
      return (
        checked(
          await client
            .from("sales")
            .select(
              "*,listing:listings(model,price_usd),seller:profiles!sales_seller_id_fkey(display_name)",
            )
            .or(`seller_id.eq.${userId},buyer_id.eq.${userId}`)
            .order("created_at", { ascending: false }),
        ) || []
      );
    },
    review(saleId, rating, comment) {
      return rpc("imarket_platform_review", {
        p_sale_id: saleId,
        p_rating: Number(rating),
        p_comment: comment,
      });
    },
    async verification(userId, selfie, document) {
      const config = await this.contract();
      const paths = await uploadDataImages(
        client,
        config.identityBucket,
        `${userId}/${crypto.randomUUID()}`,
        [selfie, document],
      );
      try {
        return await rpc("imarket_request_verification", {
          p_selfie_path: paths[0],
          p_document_path: paths[1],
        });
      } catch (error) {
        const result = await client
          .from("verification_requests")
          .select("id")
          .eq("user_id", userId)
          .eq("selfie_path", paths[0])
          .maybeSingle();
        if (!result.error && !result.data)
          await client.storage.from(config.identityBucket).remove(paths);
        if (result.data) return result.data;
        throw error;
      }
    },
    async privateProfile(userId) {
      return checked(
        await client
          .from("profile_private")
          .select("phone,exact_address")
          .eq("user_id", userId)
          .maybeSingle(),
      );
    },
    saveProfile(userId, displayName, municipality, phone, address) {
      // The server binds both updates to auth.uid(); no caller-supplied owner.
      return rpc("imarket_save_profile", {
        p_name: displayName,
        p_municipality: municipality,
        p_phone: phone,
        p_address: address,
      });
    },
    sendMessage(listingId, content) {
      return rpc("imarket_send_message", {
        p_listing_id: listingId,
        p_content: content,
      });
    },
    reply(conversationId, content) {
      return rpc("imarket_reply", {
        p_conversation_id: conversationId,
        p_content: content,
      });
    },
    async conversations() {
      return (
        checked(
          await client
            .from("conversations")
            .select(
              "*,listing:listings(model),buyer:profiles!conversations_buyer_id_fkey(display_name),seller:profiles!conversations_seller_id_fkey(display_name)",
            )
            .order("last_message_at", { ascending: false })
            .limit(100),
        ) || []
      );
    },
    async unreadMessages(userId) {
      return (
        checked(
          await client
            .from("messages")
            .select(
              "id,conversation_id,sender_id,content,created_at,conversation:conversations(listing_id,buyer_id,seller_id,listing:listings(model))",
            )
            .neq("sender_id", userId)
            .is("read_at", null)
            .order("created_at", { ascending: false })
            .limit(50),
        ) || []
      ).filter(
        (m) =>
          m.conversation?.buyer_id === userId ||
          m.conversation?.seller_id === userId,
      );
    },
    async messages(conversationId) {
      return (
        checked(
          await client
            .from("messages")
            .select("*")
            .eq("conversation_id", conversationId)
            .order("created_at", { ascending: false })
            .limit(100),
        )?.reverse() || []
      );
    },
    read(conversationId) {
      return rpc("imarket_read_conversation", {
        p_conversation_id: conversationId,
      });
    },
    async report(userId, listingId, reportedUserId, reason, description) {
      checked(
        await client.from("reports").insert({
          reporter_id: userId,
          listing_id: listingId,
          reported_user_id: reportedUserId,
          reason,
          description,
        }),
      );
    },
    async block(userId, blockedId) {
      checked(
        await client
          .from("user_blocks")
          .insert({ blocker_id: userId, blocked_id: blockedId }),
      );
    },
    async latestVerification(userId) {
      return checked(
        await client
          .from("verification_requests")
          .select("status,rejection_reason,created_at")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
      );
    },
    async verificationQueue() {
      return (
        checked(
          await client
            .from("verification_requests")
            .select(
              "*,profile:profiles!verification_requests_user_id_fkey(display_name)",
            )
            .eq("status", "pending")
            .order("created_at"),
        ) || []
      );
    },
    async listingQueue() {
      const config = await this.contract();
      return (
        checked(
          await client
            .from("listings")
            .select(selection)
            .eq("status", config.pending)
            .order("created_at"),
        ) || []
      ).map((row) => mapListing(row, client, config));
    },
    async adminMetrics() {
      return checked(await client.rpc("imarket_admin_metrics"));
    },
    async adminUsers() {
      return (
        checked(
          await client
            .from("profiles")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(200),
        ) || []
      );
    },
    adminSetAccountStatus(userId, isSuspended, isBanned) {
      return rpc("imarket_admin_set_account_status", {
        p_user_id: userId,
        p_is_suspended: isSuspended,
        p_is_banned: isBanned,
      });
    },
    adminSetRole(userId, role, grant) {
      return rpc("imarket_admin_set_role", {
        p_user_id: userId,
        p_role: role,
        p_grant: grant,
      });
    },
    async adminReports() {
      return (
        checked(
          await client
            .from("reports")
            .select(
              "*,reporter:profiles!reports_reporter_id_fkey(display_name),reported:profiles!reports_reported_user_id_fkey(display_name),listing:listings(model)",
            )
            .order("created_at", { ascending: false })
            .limit(200),
        ) || []
      );
    },
    adminResolveReport(reportId, approve, notes) {
      return rpc("imarket_admin_resolve_report", {
        p_report_id: reportId,
        p_approve: approve,
        p_notes: notes,
      });
    },
    async adminSales() {
      return (
        checked(
          await client
            .from("sales")
            .select(
              "*,listing:listings(model),seller:profiles!sales_seller_id_fkey(display_name),buyer:profiles!sales_buyer_id_fkey(display_name)",
            )
            .order("created_at", { ascending: false })
            .limit(200),
        ) || []
      );
    },
    async signedIdentity(path) {
      const config = await this.contract();
      return checked(
        await client.storage
          .from(config.identityBucket)
          .createSignedUrl(path, 60),
      ).signedUrl;
    },
    reviewVerification(id, approve, reason) {
      return rpc("imarket_review_verification", {
        p_request_id: id,
        p_approve: approve,
        p_reason: reason,
      });
    },
    reviewListing(id, approve, reason) {
      return rpc("imarket_review_listing", {
        p_listing_id: id,
        p_approve: approve,
        p_reason: reason,
      });
    },
  };
}
