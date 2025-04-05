
import html2canvas from "html2canvas";

export const captureSelectedArea = async (
  element: HTMLElement,
  selectionRect: { left: number; top: number; width: number; height: number }
): Promise<string> => {
  try {
    // Capture the entire element
    const canvas = await html2canvas(element, {
      logging: false,
      useCORS: true,
      allowTaint: true,
      backgroundColor: null,
      scale: window.devicePixelRatio || 1,
    });

    // Create a new canvas for the cropped area
    const croppedCanvas = document.createElement("canvas");
    const ctx = croppedCanvas.getContext("2d");

    if (!ctx) {
      throw new Error("Failed to get canvas context");
    }

    // Set dimensions of the cropped canvas
    croppedCanvas.width = selectionRect.width;
    croppedCanvas.height = selectionRect.height;

    // Draw only the selected portion
    ctx.drawImage(
      canvas,
      selectionRect.left,
      selectionRect.top,
      selectionRect.width,
      selectionRect.height,
      0,
      0,
      selectionRect.width,
      selectionRect.height
    );

    // Convert to data URL (image)
    return croppedCanvas.toDataURL("image/png");
  } catch (error) {
    console.error("Error capturing screenshot:", error);
    throw new Error("Failed to capture screenshot");
  }
};
