function userError(message) {
  const error = new Error(message);
  error.userMessage = message;
  return error;
}
// Resizes photos before storage (WebP al 85 %, o JPEG si el navegador no soporta WebP).
export async function compressPhoto(file) {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type))
    throw userError("Usa fotos JPG, PNG o WebP.");
  if (file.size > 15 * 1024 * 1024)
    throw userError("Cada foto debe pesar menos de 15 MB.");
  let image;
  try {
    image = await createImageBitmap(file);
  } catch {
    throw userError("No pudimos abrir esta foto. Prueba con otra (JPG, PNG o WebP).");
  }
  try {
    const ratio = Math.min(1, 1600 / Math.max(image.width, image.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.width * ratio));
    canvas.height = Math.max(1, Math.round(image.height * ratio));
    canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);
    // Safari en iPhone no sabe codificar WebP y devuelve PNG (pesado, y el
    // servidor lo rechazaba). Si pasa, se usa JPEG, que sí admite.
    let blob = await new Promise((resolve) =>
      canvas.toBlob(resolve, "image/webp", 0.85),
    );
    if (!blob || blob.type !== "image/webp")
      blob = await new Promise((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", 0.85),
      );
    if (!blob)
      throw userError("No pudimos procesar esta foto. Prueba con otra.");
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(userError("No pudimos leer esta foto."));
      reader.readAsDataURL(blob);
    });
  } finally {
    image.close();
  }
}
