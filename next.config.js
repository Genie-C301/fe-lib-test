const isProd = process.env.NODE_ENV === "production";

module.exports = {
  reactStrictMode: true,
  images: { unoptimized: true },
  transpilePackages: [
    "wallet-adapter-core",
    "wallet-adapter-react",
    "wallet-adapter-plugin",
  ],
};
