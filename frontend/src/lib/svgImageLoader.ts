// Rasterizes repository-owned SVG markup into an HTMLImageElement for canvas
// drawing. A data: URL is same-origin, so the canvas is never tainted and
// toBlob() keeps working. Remote artwork (e.g. iconUrl) must never be loaded
// here — it would risk a CORS-tainted, unexportable canvas.
export function loadSvgImage(svg: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  });
}
