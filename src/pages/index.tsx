import Head from "next/head";
import Image from "next/image";
import { Inter } from "@next/font/google";
import Client from "../lib/aptos";
import styles from "../styles/Home.module.css";
import { AptosClient, Types } from "aptos";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { WalletSelector } from "@aptos-labs/wallet-adapter-ant-design";
import { useState } from "react";
import { ErrorAlert, SuccessAlert } from "../components/Alert";
import dynamic from "next/dynamic";
import { useAutoConnect } from "../components/AutoConnectProvider";

const inter = Inter({ subsets: ["latin"] });

const WalletButtons = dynamic(() => import("../components/WalletButtons"), {
  suspense: false,
  ssr: false,
});

export const DEVNET_NODE_URL = "https://fullnode.devnet.aptoslabs.com/v1";

const aptosClient = new AptosClient(DEVNET_NODE_URL, {
  WITH_CREDENTIALS: false,
});

export default function App() {
  const walletContext = useWallet();
  const {
    connected,
    disconnect,
    account,
    network,
    wallet,
    signAndSubmitTransaction,
    signTransaction,
    signMessage,
    signMessageAndVerify,
  } = walletContext;

  const { autoConnect, setAutoConnect } = useAutoConnect();
  const [successAlertMessage, setSuccessAlertMessage] = useState<string>("");
  const [errorAlertMessage, setErrorAlertMessage] = useState<string>("");

  const client = new Client(walletContext);

  const onSignAndSubmitTransaction = async () => {
    const msg = await client.transferApt(
      "0.1",
      "0xb30d58ea44961e0d004fa0d7df0459eb2cacfbbe32545dce923048360c518f58"
    );
    alert(msg.msg);
  };

  const fetchTxs = async () => {
    const txs = await client.accountTransactions();
    console.log(txs);
    alert(txs);
  };

  const fetchCoins = async () => {
    const coins = await client.fetchCoins();
    console.log(coins);
    alert(coins);
  };
  const fetchNfts = async () => {
    const nfts = await client.fetchTokens();
    console.log(nfts);
    alert(nfts);
  };
  const registerCoin = async () => {
    const msg = await client.registerCoin(
      "0xff523dac1ffe4762abc0ff7d9f27d5187dd0424d5da9e806d8a6dd9737a60b80",
      "moon_coin::MoonCoin"
    );
    console.log(msg);
    alert(msg);
  };
  const transferCoin = async () => {
    const msg = await client.transfer(
      "0xff523dac1ffe4762abc0ff7d9f27d5187dd0424d5da9e806d8a6dd9737a60b80",
      "moon_coin::MoonCoin",
      "0xb30d58ea44961e0d004fa0d7df0459eb2cacfbbe32545dce923048360c518f58",
      "0.00001",
      "6"
    );
    console.log(msg);
    alert(msg);
  };

  const onSignTransaction = async () => {
    const payload: Types.TransactionPayload = {
      type: "entry_function_payload",
      function: "0x1::coin::transfer",
      type_arguments: ["0x1::aptos_coin::AptosCoin"],
      arguments: [account?.address, 1], // 1 is in Octas
    };
    try {
      const response = await signTransaction(payload);
      setSuccessAlertMessage(JSON.stringify(response));
      console.log("response", response);
    } catch (error: any) {
      console.log("error", error);
      setErrorAlertMessage(error);
    }
  };

  const onSignMessage = async () => {
    const payload = {
      message: "Hello from Aptos Wallet Adapter",
      nonce: "random_string",
    };
    try {
      const response = await signMessage(payload);
      setSuccessAlertMessage(JSON.stringify(response));
      console.log("response", response);
    } catch (error: any) {
      console.log("error", error);
      setErrorAlertMessage(error);
    }
  };

  const onSignMessageAndVerify = async () => {
    const payload = {
      message: "Hello from Aptos Wallet Adapter",
      nonce: "random_string",
    };
    try {
      const response = await signMessageAndVerify(payload);
      setSuccessAlertMessage(
        JSON.stringify({ onSignMessageAndVerify: response })
      );
      console.log("response", response);
    } catch (error: any) {
      console.log("error", error);
      setErrorAlertMessage(JSON.stringify({ onSignMessageAndVerify: error }));
    }
  };

  const registerAndTransferCoin = async () => {
    const msg = await client.registerAndTransferCoin(
      "2473fa762bdb1f90612302f512f509e9c0bf1f171d1a54acea50b696c9ea327d",
      "ff523dac1ffe4762abc0ff7d9f27d5187dd0424d5da9e806d8a6dd9737a60b80",
      "moon_coin::MoonCoin",
      "1"
    );
    console.log(msg);
    alert(msg);
  };

  const createToken = async () => {
    const result = await client.createToken(
      "Fcollection2",
      "Ftoken2",
      "https://www.topaz.so/cdn-cgi/image/width=512,quality=90,fit=scale-down,anim=false,onerror=redirect/https://ipfs.topaz.so//ipfs/bafybeig6bepf5ci5fyysxlfefpjzwkfp7sarj6ed2f5a34kowgc6qenjfa/747.png"
    );
    console.log(result);
    alert(result);
  };

  const optInAndTransferToken = async () => {
    const result = await client.optInAndTransferToken(
      "2473fa762bdb1f90612302f512f509e9c0bf1f171d1a54acea50b696c9ea327d",
      "16dbde3b739446b612511af6bcf9682c121372fdbf30243403fd241149f0d38b",
      "Fcollection2",
      "Ftoken2",
      "0",
      "1"
    );
    console.log(result);
    alert(result);
  };

  const getTokenData = async () => {
    await client.getTokenData(
      "0x4948a44d308ebccfb26e541d7e0b444514435eb4501a8cbaa836be1129a2527b",
      "Fcollection1",
      "Ftoken1"
    );
  };

  const verify = async () => {
    const msg = await client.verify(
      false,
      "9ad829b327b5a280986517dae31a7c00e327d30d4e618b446a085f293b4e2258",
      "91D994FBF7DEB4C8541A7E5BF9E7C3EC89293FAEE6D5407FE8E90C4F7D9D6C74"
    );
    console.log(msg);
    alert(msg);
  };

  return (
    <div>
      {successAlertMessage.length > 0 && (
        <SuccessAlert text={successAlertMessage} />
      )}
      {errorAlertMessage.length > 0 && <ErrorAlert text={errorAlertMessage} />}
      <h1 className="flex justify-center mt-2 mb-4 text-4xl font-extrabold tracking-tight leading-none text-black">
        Aptos Wallet Adapter Demo (Devnet)
      </h1>
      <table className="table-auto w-full border-separate border-spacing-y-8 shadow-lg bg-white border-separate">
        <tbody>
          <tr>
            <td className="px-8 py-4 w-1/4">
              <h3>Connect a Wallet</h3>
            </td>
            <td className="px-8 py-4 w-3/4">
              <WalletButtons />
            </td>
          </tr>
          <tr>
            <td className="px-8 border-t py-4 w-1/4">
              <h3>Wallet Selector</h3>
            </td>
            <td className="px-8 py-4 border-t w-3/4">
              <WalletSelector />
            </td>
          </tr>
          <tr>
            <td className="px-8 py-4 border-t w-1/4">
              <h3>Actions</h3>
            </td>
            <td className="px-8 py-4 border-t break-all w-3/4">
              <div>
                <button
                  className={`bg-blue-500  text-white font-bold py-2 px-4 rounded mr-4 ${
                    !connected
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:bg-blue-700"
                  }`}
                  onClick={disconnect}
                  disabled={!connected}
                >
                  Disconnect
                </button>
                <button
                  className={`bg-blue-500  text-white font-bold py-2 px-4 rounded mr-4 ${
                    !connected
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:bg-blue-700"
                  }`}
                  onClick={onSignAndSubmitTransaction}
                  disabled={!connected}
                >
                  Sign and submit transaction
                </button>
                <button
                  className={`bg-blue-500  text-white font-bold py-2 px-4 rounded mr-4 ${
                    !connected
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:bg-blue-700"
                  }`}
                  onClick={onSignTransaction}
                  disabled={!connected}
                >
                  Sign transaction
                </button>
                <button
                  className={`bg-blue-500 text-white font-bold py-2 px-4 rounded mr-4 ${
                    !connected
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:bg-blue-700"
                  }`}
                  onClick={onSignMessage}
                  disabled={!connected}
                >
                  Sign Message
                </button>

                <button
                  className={`bg-orange-500 text-white font-bold py-2 px-4 rounded mr-4 ${
                    !connected
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:bg-orange-700"
                  }`}
                  onClick={onSignMessageAndVerify}
                  disabled={!connected}
                >
                  Sign Message and Verify
                </button>
                <button
                  className={`bg-orange-500 text-white font-bold py-2 px-4 rounded mr-4 ${
                    !connected
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:bg-orange-700"
                  }`}
                  onClick={fetchCoins}
                  disabled={!connected}
                >
                  fetch coins
                </button>
                <button
                  className={`bg-orange-500 text-white font-bold py-2 px-4 rounded mr-4 ${
                    !connected
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:bg-orange-700"
                  }`}
                  onClick={fetchNfts}
                  disabled={!connected}
                >
                  fetch Tokens
                </button>
              </div>
              <div>
                <button
                  className={`bg-orange-500 text-white font-bold py-2 px-4 rounded mr-4 ${
                    !connected
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:bg-orange-700"
                  }`}
                  onClick={fetchTxs}
                  disabled={!connected}
                >
                  fetch txs
                </button>
                <button
                  className={`bg-orange-500 text-white font-bold py-2 px-4 rounded mr-4 ${
                    !connected
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:bg-orange-700"
                  }`}
                  onClick={registerCoin}
                  disabled={!connected}
                >
                  register coin
                </button>
                <button
                  className={`bg-orange-500 text-white font-bold py-2 px-4 rounded mr-4 ${
                    !connected
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:bg-orange-700"
                  }`}
                  onClick={transferCoin}
                  disabled={!connected}
                >
                  transfer coin
                </button>
                <button
                  className={`bg-orange-500 text-white font-bold py-2 px-4 rounded mr-4 ${
                    !connected
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:bg-orange-700"
                  }`}
                  onClick={registerAndTransferCoin}
                  disabled={!connected}
                >
                  register and transfer coin
                </button>
                <button
                  className={`bg-orange-500 text-white font-bold py-2 px-4 rounded mr-4 ${
                    !connected
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:bg-orange-700"
                  }`}
                  onClick={createToken}
                  disabled={!connected}
                >
                  create token
                </button>
                <button
                  className={`bg-orange-500 text-white font-bold py-2 px-4 rounded mr-4 ${
                    !connected
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:bg-orange-700"
                  }`}
                  onClick={getTokenData}
                  disabled={!connected}
                >
                  get token data
                </button>

                <button
                  className={`bg-orange-500 text-white font-bold py-2 px-4 rounded mr-4 ${
                    !connected
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:bg-orange-700"
                  }`}
                  onClick={optInAndTransferToken}
                  disabled={!connected}
                >
                  transfer Token
                </button>
                <button
                  className={`bg-orange-500 text-white font-bold py-2 px-4 rounded mr-4 ${
                    !connected
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:bg-orange-700"
                  }`}
                  onClick={verify}
                  disabled={!connected}
                >
                  verify
                </button>
              </div>
            </td>
          </tr>
          <tr>
            <td className="px-8 py-4 border-t w-1/4">
              <h3>Wallet Name</h3>
            </td>
            <td className="px-8 py-4 border-t w-3/4">
              <div style={{ display: "flex" }}>
                {wallet && (
                  <Image
                    src={wallet.icon}
                    alt={wallet.name}
                    width={25}
                    height={25}
                  />
                )}
                {wallet?.name}
              </div>
              <div>
                <a
                  target="_blank"
                  className="text-sky-600"
                  rel="noreferrer"
                  href={wallet?.url}
                >
                  {wallet?.url}
                </a>
              </div>
            </td>
          </tr>
          <tr>
            <td className="px-8 py-4 border-t">
              <h3>Account</h3>
            </td>
            <td className="px-8 py-4 border-t break-all">
              <div>{account ? JSON.stringify(account) : ""}</div>
            </td>
          </tr>
          <tr>
            <td className="px-8 py-4 border-t">
              <h3>Network</h3>
            </td>
            <td className="px-8 py-4 border-t">
              <div>{network ? JSON.stringify(network) : ""}</div>
            </td>
          </tr>

          <tr>
            <td className="px-8 py-4 border-t">
              <h3>auto connect</h3>
            </td>
            <td className="px-8 py-4 border-t">
              <div className="relative flex flex-col overflow-hidden">
                <div className="flex">
                  <label className="inline-flex relative items-center mr-5 cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={autoConnect}
                      readOnly
                    />
                    <div
                      onClick={() => {
                        setAutoConnect(!autoConnect);
                      }}
                      className="w-11 h-6 bg-gray-200 rounded-full peer  peer-focus:ring-green-300  peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"
                    ></div>
                  </label>
                </div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
