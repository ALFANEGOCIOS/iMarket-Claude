// Resizes photos before storage. WebP at 85% preserves visual detail, but is lossy.
export async function compressPhoto(file) {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type))
    throw new Error("Usa fotos JPG, PNG o WebP.");
  if (file.size > 15 * 1024 * 1024)
    throw new Error("Cada foto debe pesar menos de 15 MB.");
  const image = await createImageBitmap(file);
  try {
    const ratio = Math.min(1, 1600 / Math.max(image.width, image.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.width * ratio));
    canvas.height = Math.max(1, Math.round(image.height * ratio));
    canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise((resolve) =>
      canvas.toBlob(resolve, "image/webp", 0.85),
    );
    if (!blob)
      throw new Error("No pudimos procesar esta foto. Prueba con otra.");
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error("No pudimos leer esta foto."));
      reader.readAsDataURL(blob);
    });
  } finally {
    image.close();
  }
}
