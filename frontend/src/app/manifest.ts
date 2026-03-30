import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "CamChecklist",
    short_name: "CamChecklist",
    description: "Voice and photo-powered checklist management",
    start_url: "/projects",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#0040a1",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
