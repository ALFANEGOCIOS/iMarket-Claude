"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getSupabase, isLiveMode } from "../lib/supabase";
import { createRepository, publicError } from "../lib/database.mjs";

export default function useRemoteMarketplace(filters, limit) {
  const live = isLiveMode();
  const [configurationError, setConfigurationError] = useState("");
  const client = useMemo(() => {
    try {
      return getSupabase();
    } catch {
      return null;
    }
  }, []);
  const repository = useMemo(
    () => (client ? createRepository(client) : null),
    [client],
  );
  const [user, setUser] = useState(null),
    [owned, setOwned] = useState([]),
    [favorites, setFavorites] = useState([]),
    [sales, setSales] = useState([]),
    [unread, setUnread] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [colorCatalog, setColorCatalog] = useState(null);
  const [storageCatalog, setStorageCatalog] = useState(null);
  const [catalog, setCatalog] = useState({ items: [], total: 0 }),
    [contract, setContract] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false),
    [loading, setLoading] = useState(live),
    [error, setError] = useState("");
  const [refreshToken, setRefreshToken] = useState(0),
    [authReady, setAuthReady] = useState(!live);
  const authVersion = useRef(0);
  const pages = useRef({ key: "", limit: 0, items: [] });
  const [verification, setVerification] = useState(null);
  const [authError, setAuthError] = useState("");
  const refresh = useCallback(
    () => setRefreshToken((current) => current + 1),
    [],
  );
  const refreshUnread = useCallback(async () => {
    if (!repository || !user?.id) return;
    try {
      setUnread(await repository.unreadMessages(user.id));
    } catch {
      /* el contador se reintenta en el siguiente ciclo */
    }
  }, [repository, user?.id]);
  useEffect(() => {
    if (!live) return;
    let active = true;
    if (!repository) {
      queueMicrotask(() => {
        if (active) {
          setConfigurationError(
            "El servicio aún no está configurado. Inténtalo más tarde.",
          );
          setLoading(false);
        }
      });
      return () => {
        active = false;
      };
    }
    const version = ++authVersion.current;
    async function load(session) {
      const request = ++authVersion.current;
      setAuthReady(false);
      setVerification(null);
      setUser(null);
      setOwned([]);
      setFavorites([]);
      setSales([]);
      setUnread([]);
      setIsAdmin(false);
      try {
        const config = await repository.contract();
        if (!active || request !== authVersion.current) return;
        setContract(config);
        if (session?.user) {
          const profile = await repository.profile(session.user);
          const [mine, saved, roles, latest, myStake, pending] =
            await Promise.all([
              repository.owned(profile.id),
              repository.favorites(profile.id),
              repository.roles(),
              repository.latestVerification(profile.id),
              repository.mySales(profile.id),
              repository.unreadMessages(profile.id),
            ]);
          if (!active || request !== authVersion.current) return;
          setUser(profile);
          setVerification(latest);
          setOwned(mine);
          setFavorites(saved);
          setSales(myStake);
          setUnread(pending);
          setIsAdmin(roles.some((row) => row.role === config.adminRole));
        }
        setAuthError("");
      } catch (failure) {
        if (active && request === authVersion.current) {
          setAuthError(publicError(failure));
          setLoading(false);
        }
      } finally {
        if (active && request === authVersion.current) setAuthReady(true);
      }
    }
    // Supabase queries run outside the Auth callback to avoid the SDK auth lock.
    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, session) => {
      if (_event === "TOKEN_REFRESHED") return;
      setTimeout(() => {
        if (active) void load(session);
      }, 0);
    });
    client.auth.getSession().then(({ data, error: failure }) => {
      if (active && authVersion.current === version) {
        if (failure) {
          {
            setAuthError(publicError(failure));
            setLoading(false);
          }
          setAuthReady(true);
        } else void load(data.session);
      }
    });
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [live, repository, client, refreshToken]);
  useEffect(() => {
    if (!live || !client || !user?.id) return;
    const channel = client
      .channel(`imarket-messages-${user.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          if (payload.new?.sender_id && payload.new.sender_id !== user.id) {
            refreshUnread();
          }
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "messages" },
        () => refreshUnread(),
      )
      .subscribe();
    // Respaldo si Realtime falla: al volver a la pestaña y cada 30 s.
    const onVisible = () => {
      if (document.visibilityState === "visible") refreshUnread();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    const timer = setInterval(refreshUnread, 30000);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
      clearInterval(timer);
      client.removeChannel(channel);
    };
  }, [live, client, user?.id, refreshUnread]);
  const filterKey = JSON.stringify({
    account: user?.id || null,
    refreshToken,
    ...filters,
    favorites: filters.favoritesOnly ? favorites : undefined,
  });
  useEffect(() => {
    if (!repository || !authReady || !contract) return;
    let active = true;
    // Catálogo de colores por modelo; si la tabla aún no existe se usa el local.
    repository
      .colors()
      .then((catalog) => {
        if (active && Object.keys(catalog).length) setColorCatalog(catalog);
      })
      .catch(() => {});
    repository
      .storages()
      .then((catalog) => {
        if (active && Object.keys(catalog).length) setStorageCatalog(catalog);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [repository, authReady, contract]);
  useEffect(() => {
    if (!repository || !authReady || !contract) return;
    let active = true;
    repository
      .featured(6)
      .then((items) => {
        if (active) setFeatured(items);
      })
      .catch(() => {
        if (active) setFeatured([]);
      });
    return () => {
      active = false;
    };
  }, [repository, authReady, contract, refreshToken]);
  useEffect(() => {
    if (!repository || !authReady || !contract) return;
    let active = true;
    const timeout = setTimeout(() => {
      setLoading(true);
      const offset =
        pages.current.key === filterKey && limit > pages.current.limit
          ? pages.current.limit
          : 0;
      repository
        .catalog(JSON.parse(filterKey), limit, offset)
        .then((result) => {
          if (active) {
            const items = offset
              ? [
                  ...pages.current.items,
                  ...result.items.filter(
                    (item) =>
                      !pages.current.items.some(
                        (previous) => previous.id === item.id,
                      ),
                  ),
                ]
              : result.items;
            pages.current = { key: filterKey, limit, items };
            setCatalog({ ...result, items });
            setError("");
          }
        })
        .catch((failure) => {
          if (active) {
            setCatalog({ items: [], total: 0 });
            {
              setError(publicError(failure));
              setLoading(false);
            }
          }
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }, 200);
    return () => {
      active = false;
      clearTimeout(timeout);
    };
  }, [repository, authReady, contract, filterKey, limit, refreshToken]);
  const requireUser = () => {
    if (!user) throw new Error("IMARKET_UNAUTHENTICATED");
    if (user.is_banned || user.is_suspended)
      throw new Error("IMARKET_ACCOUNT_RESTRICTED");
    return user;
  };
  return {
    live,
    client,
    repository,
    user,
    owned,
    favorites,
    sales,
    unread,
    items: catalog.items,
    total: catalog.total,
    featured,
    colorCatalog,
    storageCatalog,
    contract,
    isAdmin,
    loading,
    verification,
    error: configurationError || authError || error,
    authReady,
    refresh,
    refreshUnread,
    async registerView(id) {
      if (!repository) return null;
      try {
        let viewer = "";
        try {
          viewer = localStorage.getItem("imarket-viewer") || "";
          if (!viewer) {
            viewer = crypto.randomUUID();
            localStorage.setItem("imarket-viewer", viewer);
          }
        } catch {}
        return await repository.registerView(id, viewer);
      } catch {
        return null;
      }
    },
    async favorite(id) {
      const current = requireUser();
      await repository.favorite(current.id, id, !favorites.includes(id));
      setFavorites((previous) =>
        previous.includes(id)
          ? previous.filter((x) => x !== id)
          : [...previous, id],
      );
    },
    async publish(item) {
      const current = requireUser();
      const result = await repository.publish(item, current.id);
      refresh();
      return result;
    },
    async reportSale(id) {
      requireUser();
      const result = await repository.reportSale(id);
      refresh();
      return result;
    },
    async confirmSale(id) {
      requireUser();
      const result = await repository.confirmSale(id);
      refresh();
      return result;
    },
    async review(saleId, rating, comment) {
      requireUser();
      await repository.review(saleId, rating, comment);
    },
    async sendMessage(id, content) {
      requireUser();
      return repository.sendMessage(id, content);
    },
  };
}
