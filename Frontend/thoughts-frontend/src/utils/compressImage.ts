/**
 * Compresses an image file natively via an HTML5 Canvas to drastically reduce upload payloads.
 */
export const compressImage = async (
  file: File,
  options = { maxWidth: 1920, quality: 0.8 }
): Promise<File> => {
  if (!file.type.startsWith("image/")) return file; // Ignore video

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        if (width > options.maxWidth) {
          height = Math.round((height * options.maxWidth) / width);
          width = options.maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) return resolve(file);

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) return resolve(file);
            resolve(
              new File([blob], file.name, {
                type: file.type || "image/jpeg",
                lastModified: Date.now(),
              })
            );
          },
          file.type || "image/jpeg",
          options.quality
        );
      };
      img.onerror = () => resolve(file);
    };
    reader.onerror = () => resolve(file);
  });
};
