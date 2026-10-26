import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Svettebøtta",
    short_name: "Svettebøtta",
    description: "Familiens treningsutfordring",
    start_url: "/",
    display: "standalone",
    background_color: "#f4f1ea",
    theme_color: "#f4f1ea",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }, { src: "/icon-512.png", sizes: "512x512", type: "image/png" }],
  };
}
