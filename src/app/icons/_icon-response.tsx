import { ImageResponse } from "next/og";

type IconVariant = "regular" | "maskable";

export function createIconResponse(size: number, variant: IconVariant = "regular") {
  const inset = variant === "maskable" ? Math.round(size * 0.16) : Math.round(size * 0.1);
  const markSize = size - inset * 2;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          alignItems: "center",
          background: "#166b43",
          display: "flex",
          justifyContent: "center"
        }}
      >
        <div
          style={{
            width: markSize,
            height: markSize,
            alignItems: "center",
            background: "#f8f6f0",
            borderRadius: Math.round(size * 0.12),
            color: "#166b43",
            display: "flex",
            flexDirection: "column",
            fontFamily: "Arial, sans-serif",
            justifyContent: "center"
          }}
        >
          <div
            style={{
              fontSize: Math.round(size * 0.26),
              fontWeight: 800,
              letterSpacing: 0,
              lineHeight: 1
            }}
          >
            FP
          </div>
          <div
            style={{
              background: "#e64b37",
              borderRadius: 999,
              height: Math.max(6, Math.round(size * 0.045)),
              marginTop: Math.round(size * 0.06),
              width: Math.round(size * 0.42)
            }}
          />
        </div>
      </div>
    ),
    {
      width: size,
      height: size
    }
  );
}
