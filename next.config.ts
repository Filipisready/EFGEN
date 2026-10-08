import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // PDF se čte z fontů uložených v repozitáři; Vercel je musí přibalit k serverové funkci.
  outputFileTracingIncludes: { '/api/export/pdf': ['./assets/fonts/**'], '/app/novy': ['./assets/fonts/**'] },
  /* config options here */
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
