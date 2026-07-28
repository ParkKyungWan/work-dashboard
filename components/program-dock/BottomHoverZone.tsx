"use client";

type BottomHoverZoneProps = {
  onEnter: () => void;
};

export default function BottomHoverZone({ onEnter }: BottomHoverZoneProps) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-auto fixed inset-x-0 bottom-0 z-[80] h-6"
      onPointerEnter={onEnter}
    />
  );
}
