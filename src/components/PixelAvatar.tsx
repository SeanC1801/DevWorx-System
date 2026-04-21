import { cn } from "@/lib/utils";
import type { ReactElement } from "react";

export type PixelAvatarSpec = {
  skin: string;
  hair: string;
  hairColor: string;
  shirt: string;
  accessory: string;
};

export const HAIR_STYLES = ["bald", "short", "spiky", "long", "ponytail"] as const;
export const HAIR_COLORS = ["#2B1B0E", "#7A4B22", "#DAB060", "#DE3335", "#5B2A86", "#E5E5E5"];
export const SKIN_TONES = ["#F8D7B5", "#F1C27D", "#D9A066", "#A87149", "#6B4423"];
export const SHIRT_COLORS = ["#DE3335", "#3B82F6", "#22C55E", "#F59E0B", "#A855F7", "#15151B", "#E5E5E5"];
export const ACCESSORIES = ["none", "glasses", "headband", "earring"] as const;

/**
 * Stardew-style 16x16 pixel avatar drawn as an inline SVG so it scales
 * crisply at any size. Layers are composed but never overlap visually:
 * each pixel belongs to exactly one feature (skin, hair, shirt, accessory).
 */
export function PixelAvatar({
  spec,
  size = 64,
  className,
}: {
  spec: PixelAvatarSpec;
  size?: number;
  className?: string;
}) {
  const { skin, hair, hairColor, shirt, accessory } = spec;

  // 16x16 grid coords. Each rect is 1 unit.
  const px = (x: number, y: number, fill: string, w = 1, h = 1) => (
    <rect key={`${x}-${y}-${fill}`} x={x} y={y} width={w} height={h} fill={fill} />
  );

  // ---- Head base (rows 3-9) ----
  const head: ReactElement[] = [];
  for (let y = 3; y <= 9; y++) {
    for (let x = 5; x <= 10; x++) head.push(px(x, y, skin));
  }
  // Eyes (row 6)
  head.push(px(6, 6, "#15151B"));
  head.push(px(9, 6, "#15151B"));
  // Mouth
  head.push(px(7, 8, "#7a2a2a", 2, 1));

  // ---- Hair ----
  const hairCells: Array<[number, number]> = [];
  if (hair === "short") {
    for (let x = 5; x <= 10; x++) hairCells.push([x, 3]);
    hairCells.push([5, 4], [10, 4]);
  } else if (hair === "spiky") {
    hairCells.push([5, 3], [7, 2], [9, 2], [10, 3], [6, 3], [8, 3]);
    hairCells.push([5, 4], [10, 4]);
  } else if (hair === "long") {
    for (let x = 5; x <= 10; x++) hairCells.push([x, 3]);
    hairCells.push([5, 4], [10, 4], [5, 5], [10, 5], [5, 6], [10, 6]);
  } else if (hair === "ponytail") {
    for (let x = 5; x <= 10; x++) hairCells.push([x, 3]);
    hairCells.push([5, 4], [10, 4], [11, 4], [11, 5], [11, 6]);
  }
  // bald => no cells
  const hairEls = hairCells.map(([x, y]) => px(x, y, hairColor));

  // ---- Body / shirt (rows 10-13) ----
  const body: ReactElement[] = [];
  for (let y = 10; y <= 13; y++) {
    for (let x = 4; x <= 11; x++) body.push(px(x, y, shirt));
  }
  // arms (skin) at row 10-11 outer
  body.push(px(4, 10, skin), px(11, 10, skin));
  body.push(px(4, 11, skin), px(11, 11, skin));
  // pants (rows 14-15)
  for (let x = 5; x <= 10; x++) body.push(px(x, 14, "#2A2630"));
  body.push(px(5, 15, "#15151B"), px(6, 15, "#15151B"));
  body.push(px(9, 15, "#15151B"), px(10, 15, "#15151B"));

  // ---- Accessory (overrides existing pixel only at its own cells) ----
  const accessoryEls: ReactElement[] = [];
  if (accessory === "glasses") {
    accessoryEls.push(px(6, 6, "#E5E5E5"));
    accessoryEls.push(px(9, 6, "#E5E5E5"));
    accessoryEls.push(px(7, 6, "#15151B"));
    accessoryEls.push(px(8, 6, "#15151B"));
  } else if (accessory === "headband") {
    for (let x = 5; x <= 10; x++) accessoryEls.push(px(x, 5, "#DE3335"));
  } else if (accessory === "earring") {
    accessoryEls.push(px(4, 7, "#DAB060"));
    accessoryEls.push(px(11, 7, "#DAB060"));
  }

  return (
    <svg
      viewBox="0 0 16 16"
      width={size}
      height={size}
      shapeRendering="crispEdges"
      className={cn("pixelated", className)}
      role="img"
      aria-label="pixel avatar"
    >
      {head}
      {hairEls}
      {body}
      {accessoryEls}
    </svg>
  );
}