import img1 from "../assets/1.jpg";
import img2 from "../assets/2.jpg";
import img3 from "../assets/3.jpg";
import img4 from "../assets/4.jpg";
import img5 from "../assets/5.jpg";
import img6 from "../assets/6.jpg";
import img7 from "../assets/7.jpg";
import img8 from "../assets/8.jpg";
import img9 from "../assets/9.jpg";
import img10 from "../assets/10.jpg";

const THUMB_BY_CATEGORY = {
  IT: img1,
  ELECTRICAL: img2,
  CLEANING: img3,
  FACILITY: img4,
  SECURITY: img5,
  BOOKING: img6,
  EQUIPMENT: img7,
  TRANSPORT: img8,
  ACADEMIC: img9,
  OTHER: img10,
};

/**
 * Thumbnail for a ticket row based on the parent category name (seeded uppercase names).
 */
export function getTicketThumbnailForCategory(categoryName) {
  const key = String(categoryName || "")
    .trim()
    .toUpperCase();
  return THUMB_BY_CATEGORY[key] ?? img10;
}
