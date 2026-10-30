// Borrador del anuncio: se guarda en el navegador (IndexedDB, que admite fotos)
// para no perder lo escrito si se cierra la ventana o la página.
const DB = "imarket-drafts";
const STORE = "drafts";

function open() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") return reject(new Error("sin IndexedDB"));
    const request = indexedDB.open(DB, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
async function run(mode, action) {
  const db = await open();
  try {
    return await new Promise((resolve, reject) => {
      const request = action(db.transaction(STORE, mode).objectStore(STORE));
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } finally {
    db.close();
  }
}
export async function loadDraft(key) {
  try {
    return (await run("readonly", (store) => store.get(key))) || null;
  } catch {
    return null;
  }
}
export async function saveDraft(key, value) {
  try {
    await run("readwrite", (store) => store.put({ ...value, savedAt: Date.now() }, key));
  } catch {
    /* sin espacio o navegación privada: se ignora */
  }
}
export async function clearDraft(key) {
  try {
    await run("readwrite", (store) => store.delete(key));
  } catch {}
}
