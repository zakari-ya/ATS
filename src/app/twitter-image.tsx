import { renderSocialImage, SOCIAL_IMAGE_SIZE } from "@/lib/seo/render-social-image";

export const runtime = "nodejs";
export const alt = "CVMatch – free ATS-style CV and job match checker";
export const size = SOCIAL_IMAGE_SIZE;
export const contentType = "image/png";

export default function TwitterImage() {
  return renderSocialImage();
}
