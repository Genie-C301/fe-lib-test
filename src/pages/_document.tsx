import { Html, Head, Main, NextScript } from "next/document";

declare global {
  interface Window {
    aptos: any;
  }
}

export default function Document() {
  return (
    <Html lang="en">
      <Head />
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
