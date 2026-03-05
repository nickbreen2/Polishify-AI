import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Polishify — Polish your writing with AI";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#3254F9",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 24,
        }}
      >
        <div
          style={{
            color: "white",
            fontSize: 72,
            fontWeight: 700,
            letterSpacing: "-2px",
          }}
        >
          Polishify
        </div>
        <div
          style={{
            color: "rgba(255,255,255,0.75)",
            fontSize: 28,
            fontWeight: 400,
            textAlign: "center",
            maxWidth: 640,
          }}
        >
          Polish your writing with AI — select text on any site and improve it
          in-place.
        </div>
      </div>
    ),
    size
  );
}
