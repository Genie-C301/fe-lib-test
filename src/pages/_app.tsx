import "../styles/globals.css";
import type { AppProps } from "next/app";
import { AppContext } from "../components/AppContext";
import React from "react";

export default function App({ Component, pageProps }: AppProps) {
  const [address, setAddress] = React.useState<string | null>(null);

  React.useEffect(() => {
    console.log("hi");
    init();
  }, []);
  /**
   * init function
   */
  const init = async () => {
    // connect
    const { address, publicKey } = await window.aptos.connect();
    setAddress(address);
  };
  return (
    <AppContext>
      <Component {...pageProps} />
    </AppContext>
  );
}
