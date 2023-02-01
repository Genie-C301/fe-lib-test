import { AptosClient as Aptos, Types, HexString, AptosAccount } from "aptos";
import {
  AccountInfo,
  NetworkInfo,
  WalletName,
  WalletInfo,
  Wallet,
  SignMessagePayload,
  SignMessageResponse,
} from "@aptos-labs/wallet-adapter-core";
import { getErrorMessage } from "../utils";

// const DEVNET_NODE_URL = "https://fullnode.mainnet.aptoslabs.com/v1";
export const DEVNET_NODE_URL = "https://fullnode.devnet.aptoslabs.com";
const NETWORK_GRAPHQL_ENDPOINT =
  "https://indexer-devnet.staging.gcp.aptosdev.com/v1/graphql";

interface WalletContextState {
  connected: boolean;
  account: AccountInfo | null;
  network: NetworkInfo | null;
  connect(walletName: WalletName): void;
  disconnect(): void;
  wallet: WalletInfo | null;
  wallets: Wallet[];
  signAndSubmitTransaction<T extends Types.TransactionPayload, V>(
    transaction: T,
    options?: V
  ): Promise<any>;
  signTransaction<T extends Types.TransactionPayload, V>(
    transaction: T,
    options?: V
  ): Promise<any>;
  signMessage(message: SignMessagePayload): Promise<SignMessageResponse | null>;
  signMessageAndVerify(message: SignMessagePayload): Promise<boolean>;
}

export default class Client {
  aptosClient: Aptos;
  wallet: WalletContextState;

  constructor(wallet: WalletContextState) {
    this.aptosClient = new Aptos(DEVNET_NODE_URL, {
      WITH_CREDENTIALS: false,
    });
    this.wallet = wallet;
  }

  shift(value: string, shift: number): string {
    // value is string with or without 1 decimal point
    let origin = value.indexOf(".");
    if (origin == -1) {
      value = value + ".";
      origin = value.indexOf(".");
    }

    let zeros = "0".repeat(Math.abs(shift)).split("");
    let temp = zeros.concat(value.split("")).concat(zeros);
    let newOrigin = temp.indexOf(".");
    temp.splice(newOrigin, 1);

    temp.splice(newOrigin - shift, 0, ".");
    temp.splice(temp.indexOf("."));
    while (temp[0] == "0") temp.shift();
    return temp.length == 0 ? "0" : temp.join("");
  }

  async accountTransactions() {
    const accountAddress = this.wallet.account?.address;
    try {
      const data = await this.aptosClient.getAccountTransactions(
        //@ts-ignore
        accountAddress
      );
      const transactions = data.map((item: { [key: string]: any }) => ({
        data: item.payload,
        from: item.sender,
        gas: item.gas_used,
        gasPrice: item.gas_unit_price,
        hash: item.hash,
        success: item.success,
        timestamp: item.timestamp,
        toAddress: item.payload.arguments[0],
        price: item.payload.arguments[1],
        type: item.type,
        version: item.version,
        vmStatus: item.vm_status,
      }));
      return { success: true, transactions };
    } catch (err) {
      return {
        success: false,
        err,
      };
    }
  }

  async fetchCoins() {
    const address = this.wallet.account?.address || "";
    try {
      if (address !== "") {
        let coinStoreType = "0x1::coin::CoinStore";
        let balances: { [key: string]: any }[] = [];
        let resources = await this.aptosClient.getAccountResources(address);
        let coinResources = resources.filter((r) =>
          r.type.startsWith(coinStoreType)
        );
        coinResources.forEach((resource) =>
          balances.push({
            coin: resource?.type,
            //@ts-ignore
            value: resource?.data?.coin?.value,
          })
        );
        return {
          success: true,
          balances,
        };
      }
    } catch (err) {
      return {
        success: false,
        err,
      };
    }
  }

  /**
   * checks if the coinType is valid and return coinInfo
   * @param coinType Resource type
   * @returns coinInfo
   */
  async getCoinInfo(coinType: string) {
    try {
      let address = coinType.split("::")[0];
      let coinInfoType = `0x1::coin::CoinInfo<${coinType}>`;
      let resource = await this.aptosClient.getAccountResource(
        address,
        coinInfoType
      );
      return {
        success: true,
        coinInfo: resource.data,
      };
    } catch (err) {
      return {
        success: false,
        err,
      };
    }
  }

  async registerCoin(
    coinTypeAddress: string,
    coinType: string
  ): Promise<{ msg: string; success: boolean }> {
    try {
      const coinTypeAddressHex = new HexString(coinTypeAddress);
      const payload: Types.TransactionPayload = {
        type: "entry_function_payload",
        function: "0x1::managed_coin::register",
        type_arguments: [`${coinTypeAddressHex.hex()}::${coinType}`],
        arguments: [],
      };

      const response = await this.wallet.signAndSubmitTransaction(payload);
      await this.aptosClient.waitForTransaction(response?.hash || "");

      return {
        msg: `https://explorer.aptoslabs.com/txn/${response?.hash}`,
        success: true,
      };
    } catch (err) {
      const msg = getErrorMessage(err);
      return { msg: msg, success: false };
    }
  }

  async transferApt(
    amount: string,
    address: string
  ): Promise<{ msg: string; success: boolean }> {
    const payload: Types.TransactionPayload = {
      type: "entry_function_payload",
      function: "0x1::aptos_account::transfer",
      type_arguments: [],
      arguments: [address, Number(this.shift(amount, -8))],
    };
    try {
      const response = await this.wallet.signAndSubmitTransaction(payload);
      await this.aptosClient.waitForTransaction(response?.hash || "");
      return {
        msg: `https://explorer.aptoslabs.com/txn/${response?.hash}`,
        success: true,
      };
    } catch (error: any) {
      const msg = getErrorMessage(error);
      return { msg: msg, success: false };
    }
  }

  async transfer(
    coinTypeAddress: string,
    coinType: string,
    recipient_address: string,
    amount: string,
    decimal: string
  ) {
    try {
      const coinTypeAddressHex = new HexString(coinTypeAddress);
      if (
        recipient_address ===
        //@ts-ignore
        this.wallet.account?.address
      ) {
        return new Error("cannot transfer coins to self");
      }

      const payload: Types.TransactionPayload = {
        function: "0x1::coin::transfer",
        type: "entry_function_payload",
        type_arguments: [`${coinTypeAddressHex.hex()}::${coinType}`],
        arguments: [
          recipient_address,
          Number(this.shift(amount, Number("-" + decimal))),
        ],
      };

      const response = await this.wallet.signAndSubmitTransaction(payload);
      await this.aptosClient.waitForTransaction(response?.hash || "");
      return {
        msg: `https://explorer.aptoslabs.com/txn/${response?.hash}`,
        success: true,
      };
    } catch (err) {
      const msg = getErrorMessage(err);
      return { msg: msg, success: false };
    }
  }

  async fetchGraphQL(
    operationsDoc: string,
    operationName: string,
    variables: any
  ) {
    const result = await fetch(NETWORK_GRAPHQL_ENDPOINT, {
      method: "POST",
      body: JSON.stringify({
        query: operationsDoc,
        variables: variables,
        operationName: operationName,
      }),
    });

    return await result.json();
  }

  /**
   * returns a list of token IDs of the tokens in a user's account
   * (including the tokens that were minted)
   *
   * @param address address of the desired account
   * @returns list of token IDs
   */
  async fetchTokens() {
    const address = this.wallet.account?.address;
    try {
      const countDeposit: { [key: string]: string | object | any } = {};
      const countWithdraw: { [key: string]: string | object | any } = {};
      const elementsFetched = new Set<string>();
      const tokenIds: any[] = [];

      const depositEvents = await this.getEventStream(
        address,
        "0x3::token::TokenStore",
        "deposit_events"
      );

      const withdrawEvents = await this.getEventStream(
        address,
        "0x3::token::TokenStore",
        "withdraw_events"
      );

      let maxDepositSequenceNumber = -1;
      let maxWithdrawSequenceNumber = -1;

      depositEvents.forEach(
        (element: { [key: string]: string | object | any }) => {
          const elementString = JSON.stringify(element.data.id);
          elementsFetched.add(elementString);
          countDeposit[elementString] = countDeposit[elementString]
            ? {
                count: countDeposit[elementString].count + 1,
                sequence_number: element.sequence_number,
                data: element.data.id,
              }
            : {
                count: 1,
                sequence_number: element.sequence_number,
                data: element.data.id,
              };

          maxDepositSequenceNumber = Math.max(
            maxDepositSequenceNumber,
            parseInt(element.sequence_number, 10)
          );
        }
      );

      withdrawEvents.forEach(
        (element: { [key: string]: string | object | any }) => {
          const elementString = JSON.stringify(element.data.id);
          elementsFetched.add(elementString);
          countWithdraw[elementString] = countWithdraw[elementString]
            ? {
                count: countWithdraw[elementString].count + 1,
                sequence_number: element.sequence_number,
                data: element.data.id,
              }
            : {
                count: 1,
                sequence_number: element.sequence_number,
                data: element.data.id,
              };

          maxWithdrawSequenceNumber = Math.max(
            maxWithdrawSequenceNumber,
            parseInt(element.sequence_number, 10)
          );
        }
      );

      if (elementsFetched) {
        Array.from(elementsFetched).forEach((elementString) => {
          const depositEventCount = countDeposit[elementString]
            ? countDeposit[elementString].count
            : 0;
          const withdrawEventCount = countWithdraw[elementString]
            ? countWithdraw[elementString].count
            : 0;
          tokenIds.push({
            data: countDeposit[elementString]
              ? countDeposit[elementString].data
              : countWithdraw[elementString].data,
            deposit_sequence_number: countDeposit[elementString]
              ? countDeposit[elementString].sequence_number
              : "-1",
            withdraw_sequence_number: countWithdraw[elementString]
              ? countWithdraw[elementString].sequence_number
              : "-1",
            difference: depositEventCount - withdrawEventCount,
          });
        });
      }
      const tokenDetails = await Promise.all(
        tokenIds.map((v) => {
          return this.getTokenDetails(v.data.token_data_id);
        })
      );
      return tokenDetails;
    } catch (err) {
      return {
        success: false,
        err,
      };
    }
  }

  async getTokenDetails(token_data_id: {
    collection: string;
    creator: string;
    name: string;
  }) {
    try {
      let accountResource;

      const resources = await this.aptosClient.getAccountResources(
        token_data_id.creator
      );
      accountResource = resources.find(
        (r) => r.type === "0x3::token::Collections"
      );

      const tableItemRequest = {
        key_type: "0x3::token::TokenDataId",
        value_type: "0x3::token::TokenData",
        key: token_data_id,
      };
      const token = await this.aptosClient.getTableItem(
        //@ts-ignore
        accountResource?.data?.token_data.handle,
        tableItemRequest
      );
      token.collection = token_data_id.collection;
      return token;
    } catch (err) {
      return null;
    }
  }

  // get NFT IDs of the address
  async getEventStream(
    address: string | undefined,
    eventHandleStruct: string,
    fieldName: string,
    limit?: string,
    start?: string
  ) {
    let endpointUrl = `${DEVNET_NODE_URL}/accounts/${address}/events/${eventHandleStruct}/${fieldName}`;
    if (limit) {
      endpointUrl += `?limit=${limit}`;
    }

    if (start) {
      endpointUrl += limit ? `&start=${start}` : `?start=${start}`;
    }
    const response = await fetch(endpointUrl, {
      method: "GET",
    });

    if (response.status === 404) {
      return [];
    }

    return response.json();
  }
}
