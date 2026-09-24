import { ImageResponse } from "next/og";

export const SOCIAL_IMAGE_SIZE = {
  width: 1200,
  height: 630,
};

export function renderSocialImage() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          padding: "64px 72px",
          alignItems: "center",
          justifyContent: "space-between",
          backgroundColor: "#f8f7f3",
          color: "#183f3a",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            width: 760,
            flexDirection: "column",
            alignItems: "flex-start",
          }}
        >
          <div
            style={{
              display: "flex",
              marginBottom: 28,
              borderRadius: 999,
              padding: "10px 17px",
              backgroundColor: "#e5eee9",
              color: "#315e55",
              fontSize: 18,
              fontWeight: 700,
              letterSpacing: 2,
            }}
          >
            CV + JOB DESCRIPTION
          </div>
          <div
            style={{
              display: "flex",
              maxWidth: 760,
              fontSize: 62,
              fontWeight: 700,
              lineHeight: 1.08,
              letterSpacing: -2.5,
            }}
          >
            Know how your CV matches the job.
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 25,
              color: "#5c6f69",
              fontSize: 23,
              lineHeight: 1.4,
            }}
          >
            ATS-style score · missing skills · clear next steps
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 42,
              fontSize: 25,
              fontWeight: 700,
            }}
          >
            CVMatch
            <span style={{ color: "#71857f", fontWeight: 400 }}>
              {" "}· Free ATS CV Checker
            </span>
          </div>
        </div>
        <div
          style={{
            display: "flex",
            width: 252,
            height: 252,
            marginLeft: 18,
            flexShrink: 0,
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 38,
            backgroundColor: "#183f3a",
          }}
        >
          <div
            style={{
              display: "flex",
              width: 194,
              height: 194,
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              borderRadius: 30,
              backgroundColor: "#f8f7f3",
            }}
          >
            <div
              style={{
                display: "flex",
                width: 120,
                height: 54,
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 14,
                backgroundColor: "#e5eee9",
                color: "#183f3a",
                fontSize: 25,
                fontWeight: 700,
              }}
            >
              CV
            </div>
            <div
              style={{
                display: "flex",
                height: 24,
                alignItems: "center",
                justifyContent: "center",
                color: "#315e55",
                fontSize: 25,
                fontWeight: 700,
              }}
            >
              ↔
            </div>
            <div
              style={{
                display: "flex",
                width: 120,
                height: 54,
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 14,
                backgroundColor: "#e5eee9",
                color: "#183f3a",
                fontSize: 25,
                fontWeight: 700,
              }}
            >
              JOB
            </div>
          </div>
        </div>
      </div>
    ),
    SOCIAL_IMAGE_SIZE,
  );
}
