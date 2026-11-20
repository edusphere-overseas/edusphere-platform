import { Image } from "next-sanity/image";
import type { SanityPhoto } from "@/lib/content";

type Props = {
  photo: SanityPhoto;
  className?: string;
  sizes: string;
  fill?: boolean;
  width?: number;
  height?: number;
  priority?: boolean;
};

/** Renders a photo from the Content area through Sanity's image CDN, respecting crop and focal point. */
export function SanityImage({ photo, className, sizes, fill, width, height, priority }: Props) {
  if (!photo.asset?.url) return null;
  const blur = photo.asset.metadata?.lqip;
  return (
    <Image
      // The query returns the full image object with asset URL, so project and dataset are inferred.
      src={photo as Parameters<typeof Image>[0]["src"]}
      alt={photo.alt || ""}
      sizes={sizes}
      className={className}
      fill={fill}
      width={fill ? undefined : width}
      height={fill ? undefined : height}
      preload={priority}
      placeholder={blur ? "blur" : undefined}
    />
  );
}
