/**
 * Compresses images as JPEG for consistent upload support across image formats.
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
            if (!blob || blob.type !== "image/jpeg") return resolve(file);
            const name = file.name.replace(/\.[^.]+$/, "") || file.name;
            resolve(
              new File([blob], `${name}.jpg`, {
                type: "image/jpeg",
                lastModified: Date.now(),
              })
            );
          },
          "image/jpeg",
          options.quality
        );
      };
      img.onerror = () => resolve(file);
    };
    reader.onerror = () => resolve(file);
  });
};
