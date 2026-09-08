export interface TaskAttachment {
  id: string;
  url: string; // Data URL or image link
  name: string;
  size?: number;
  type?: string;
  createdAt?: number;
}

/**
 * Format bytes to readable string (e.g. 150 KB, 1.2 MB)
 */
export const formatFileSize = (bytes?: number): string => {
  if (!bytes || isNaN(bytes)) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

/**
 * Compresses an image file to an optimized Base64 data URL using HTML5 canvas.
 */
export const compressImageFile = (
  file: File,
  maxWidth = 1600,
  maxHeight = 1600,
  quality = 0.82
): Promise<TaskAttachment> => {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      return reject(new Error("File is not an image"));
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate scaling
        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");

        if (!ctx) {
          return resolve({
            id: `att_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
            url: event.target?.result as string,
            name: file.name,
            size: file.size,
            type: file.type,
            createdAt: Date.now(),
          });
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Keep PNG if transparent or small, else use jpeg for high compression
        const outputType = file.type === "image/png" ? "image/png" : "image/jpeg";
        const compressedDataUrl = canvas.toDataURL(outputType, quality);

        // Estimate size from data url
        const sizeInBytes = Math.round((compressedDataUrl.length * 3) / 4);

        resolve({
          id: `att_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
          url: compressedDataUrl,
          name: file.name,
          size: sizeInBytes,
          type: outputType,
          createdAt: Date.now(),
        });
      };

      img.onerror = () => {
        reject(new Error("Failed to load image for processing"));
      };

      img.src = event.target?.result as string;
    };

    reader.onerror = () => {
      reject(new Error("Failed to read file"));
    };

    reader.readAsDataURL(file);
  });
};
