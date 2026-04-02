export type PreparedUpload = {
  blob: Blob;
  contentType: string;
  /** Filename suffix without dot (e.g. webp, png). */
  objectExt: string;
};

/** Storage buckets with `allowed_mime_types` reject `application/octet-stream`; map extension to an image/* type. */
export function storageImageContentType(prepared: PreparedUpload): string {
  if (prepared.contentType.startsWith("image/")) {
    return prepared.contentType;
  }
  const map: Record<string, string> = {
    webp: "image/webp",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    svg: "image/svg+xml",
    bmp: "image/bmp",
    heic: "image/heic",
    heif: "image/heif",
  };
  return map[prepared.objectExt] ?? "image/jpeg";
}

function extensionFromFilename(name: string): string {
  const base = name.split(/[/\\]/).pop() ?? "";
  const i = base.lastIndexOf(".");
  if (i <= 0) return "bin";
  return base.slice(i + 1).toLowerCase().replace(/[^a-z0-9]/g, "") || "bin";
}

function mimeToExt(mime: string): string {
  const m = mime.toLowerCase();
  if (m.includes("jpeg") || m === "image/jpg") return "jpg";
  if (m === "image/png") return "png";
  if (m === "image/webp") return "webp";
  if (m === "image/gif") return "gif";
  if (m === "image/svg+xml") return "svg";
  if (m === "image/bmp") return "bmp";
  if (m === "image/heic" || m === "image/heif") return "heic";
  return "bin";
}

/**
 * When possible, draws the image to a canvas and exports WebP (smaller uploads).
 * Falls back to the original file if decoding or WebP encoding fails (e.g. some HEIC, very old Safari).
 */
export async function prepareImageForUpload(
  file: File,
  options: { preferWebp: boolean },
): Promise<PreparedUpload> {
  const ext = extensionFromFilename(file.name);
  const isSvg =
    ext === "svg" || file.type === "image/svg+xml" || file.name.toLowerCase().endsWith(".svg");

  if (isSvg) {
    return {
      blob: file,
      contentType: file.type || "image/svg+xml",
      objectExt: "svg",
    };
  }

  if (!options.preferWebp) {
    return {
      blob: file,
      contentType: file.type || "application/octet-stream",
      objectExt: mimeToExt(file.type) === "bin" ? ext.slice(0, 8) : mimeToExt(file.type),
    };
  }

  try {
    const bitmap = await createImageBitmap(file);
    try {
      const canvas = document.createElement("canvas");
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        return {
          blob: file,
          contentType: file.type || "application/octet-stream",
          objectExt: ext.slice(0, 8),
        };
      }
      ctx.drawImage(bitmap, 0, 0);
      const webp = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob((b) => resolve(b), "image/webp", 0.88);
      });
      if (webp && webp.size > 0) {
        return { blob: webp, contentType: "image/webp", objectExt: "webp" };
      }
    } finally {
      bitmap.close();
    }
  } catch {
    /* decode failed — upload original */
  }

  return {
    blob: file,
    contentType: file.type || "application/octet-stream",
    objectExt: mimeToExt(file.type) === "bin" ? ext.slice(0, 8) : mimeToExt(file.type),
  };
}
