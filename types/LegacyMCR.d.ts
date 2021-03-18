/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import BN from "bn.js";
import { EventData, PastEventOptions } from "web3-eth-contract";

export interface LegacyMCRContract extends Truffle.Contract<LegacyMCRInstance> {
  "new"(meta?: Truffle.TransactionDetails): Promise<LegacyMCRInstance>;
}

type AllEvents = never;

export interface LegacyMCRInstance extends Truffle.ContractInstance {
  _calVtpAndMCRtp(
    poolBalance: number | BN | string,
    txDetails?: Truffle.TransactionDetails
  ): Promise<[BN, BN]>;

  addLastMCRData: {
    (
      date: number | BN | string,
      txDetails?: Truffle.TransactionDetails
    ): Promise<Truffle.TransactionResponse<AllEvents>>;
    call(
      date: number | BN | string,
      txDetails?: Truffle.TransactionDetails
    ): Promise<void>;
    sendTransaction(
      date: number | BN | string,
      txDetails?: Truffle.TransactionDetails
    ): Promise<string>;
    estimateGas(
      date: number | BN | string,
      txDetails?: Truffle.TransactionDetails
    ): Promise<number>;
  };

  addMCRData: {
    (
      mcrP: number | BN | string,
      mcrE: number | BN | string,
      vF: number | BN | string,
      curr: string[],
      _threeDayAvg: (number | BN | string)[],
      onlyDate: number | BN | string,
      txDetails?: Truffle.TransactionDetails
    ): Promise<Truffle.TransactionResponse<AllEvents>>;
    call(
      mcrP: number | BN | string,
      mcrE: number | BN | string,
      vF: number | BN | string,
      curr: string[],
      _threeDayAvg: (number | BN | string)[],
      onlyDate: number | BN | string,
      txDetails?: Truffle.TransactionDetails
    ): Promise<void>;
    sendTransaction(
      mcrP: number | BN | string,
      mcrE: number | BN | string,
      vF: number | BN | string,
      curr: string[],
      _threeDayAvg: (number | BN | string)[],
      onlyDate: number | BN | string,
      txDetails?: Truffle.TransactionDetails
    ): Promise<string>;
    estimateGas(
      mcrP: number | BN | string,
      mcrE: number | BN | string,
      vF: number | BN | string,
      curr: string[],
      _threeDayAvg: (number | BN | string)[],
      onlyDate: number | BN | string,
      txDetails?: Truffle.TransactionDetails
    ): Promise<number>;
  };

  calVtpAndMCRtp(txDetails?: Truffle.TransactionDetails): Promise<[BN, BN]>;

  calculateStepTokenPrice(
    curr: string,
    mcrtp: number | BN | string,
    txDetails?: Truffle.TransactionDetails
  ): Promise<BN>;

  calculateTokenPrice(
    curr: string,
    txDetails?: Truffle.TransactionDetails
  ): Promise<BN>;

  calculateVtpAndMCRtp(
    poolBalance: number | BN | string,
    txDetails?: Truffle.TransactionDetails
  ): Promise<[BN, BN]>;

  changeDependentContractAddress: {
    (txDetails?: Truffle.TransactionDetails): Promise<
      Truffle.TransactionResponse<AllEvents>
    >;
    call(txDetails?: Truffle.TransactionDetails): Promise<void>;
    sendTransaction(txDetails?: Truffle.TransactionDetails): Promise<string>;
    estimateGas(txDetails?: Truffle.TransactionDetails): Promise<number>;
  };

  dynamicMincapIncrementx100(
    txDetails?: Truffle.TransactionDetails
  ): Promise<BN>;

  dynamicMincapThresholdx100(
    txDetails?: Truffle.TransactionDetails
  ): Promise<BN>;

  getAllSumAssurance(txDetails?: Truffle.TransactionDetails): Promise<BN>;

  getMaxSellTokens(txDetails?: Truffle.TransactionDetails): Promise<BN>;

  getThresholdValues(
    vtp: number | BN | string,
    vF: number | BN | string,
    totalSA: number | BN | string,
    minCap: number | BN | string,
    txDetails?: Truffle.TransactionDetails
  ): Promise<[BN, BN]>;

  getUintParameters(
    code: string,
    txDetails?: Truffle.TransactionDetails
  ): Promise<[string, BN]>;

  updateUintParameters: {
    (
      code: string,
      val: number | BN | string,
      txDetails?: Truffle.TransactionDetails
    ): Promise<Truffle.TransactionResponse<AllEvents>>;
    call(
      code: string,
      val: number | BN | string,
      txDetails?: Truffle.TransactionDetails
    ): Promise<void>;
    sendTransaction(
      code: string,
      val: number | BN | string,
      txDetails?: Truffle.TransactionDetails
    ): Promise<string>;
    estimateGas(
      code: string,
      val: number | BN | string,
      txDetails?: Truffle.TransactionDetails
    ): Promise<number>;
  };

  variableMincap(txDetails?: Truffle.TransactionDetails): Promise<BN>;

  methods: {
    _calVtpAndMCRtp(
      poolBalance: number | BN | string,
      txDetails?: Truffle.TransactionDetails
    ): Promise<[BN, BN]>;

    addLastMCRData: {
      (
        date: number | BN | string,
        txDetails?: Truffle.TransactionDetails
      ): Promise<Truffle.TransactionResponse<AllEvents>>;
      call(
        date: number | BN | string,
        txDetails?: Truffle.TransactionDetails
      ): Promise<void>;
      sendTransaction(
        date: number | BN | string,
        txDetails?: Truffle.TransactionDetails
      ): Promise<string>;
      estimateGas(
        date: number | BN | string,
        txDetails?: Truffle.TransactionDetails
      ): Promise<number>;
    };

    addMCRData: {
      (
        mcrP: number | BN | string,
        mcrE: number | BN | string,
        vF: number | BN | string,
        curr: string[],
        _threeDayAvg: (number | BN | string)[],
        onlyDate: number | BN | string,
        txDetails?: Truffle.TransactionDetails
      ): Promise<Truffle.TransactionResponse<AllEvents>>;
      call(
        mcrP: number | BN | string,
        mcrE: number | BN | string,
        vF: number | BN | string,
        curr: string[],
        _threeDayAvg: (number | BN | string)[],
        onlyDate: number | BN | string,
        txDetails?: Truffle.TransactionDetails
      ): Promise<void>;
      sendTransaction(
        mcrP: number | BN | string,
        mcrE: number | BN | string,
        vF: number | BN | string,
        curr: string[],
        _threeDayAvg: (number | BN | string)[],
        onlyDate: number | BN | string,
        txDetails?: Truffle.TransactionDetails
      ): Promise<string>;
      estimateGas(
        mcrP: number | BN | string,
        mcrE: number | BN | string,
        vF: number | BN | string,
        curr: string[],
        _threeDayAvg: (number | BN | string)[],
        onlyDate: number | BN | string,
        txDetails?: Truffle.TransactionDetails
      ): Promise<number>;
    };

    calVtpAndMCRtp(txDetails?: Truffle.TransactionDetails): Promise<[BN, BN]>;

    calculateStepTokenPrice(
      curr: string,
      mcrtp: number | BN | string,
      txDetails?: Truffle.TransactionDetails
    ): Promise<BN>;

    calculateTokenPrice(
      curr: string,
      txDetails?: Truffle.TransactionDetails
    ): Promise<BN>;

    calculateVtpAndMCRtp(
      poolBalance: number | BN | string,
      txDetails?: Truffle.TransactionDetails
    ): Promise<[BN, BN]>;

    changeDependentContractAddress: {
      (txDetails?: Truffle.TransactionDetails): Promise<
        Truffle.TransactionResponse<AllEvents>
      >;
      call(txDetails?: Truffle.TransactionDetails): Promise<void>;
      sendTransaction(txDetails?: Truffle.TransactionDetails): Promise<string>;
      estimateGas(txDetails?: Truffle.TransactionDetails): Promise<number>;
    };

    dynamicMincapIncrementx100(
      txDetails?: Truffle.TransactionDetails
    ): Promise<BN>;

    dynamicMincapThresholdx100(
      txDetails?: Truffle.TransactionDetails
    ): Promise<BN>;

    getAllSumAssurance(txDetails?: Truffle.TransactionDetails): Promise<BN>;

    getMaxSellTokens(txDetails?: Truffle.TransactionDetails): Promise<BN>;

    getThresholdValues(
      vtp: number | BN | string,
      vF: number | BN | string,
      totalSA: number | BN | string,
      minCap: number | BN | string,
      txDetails?: Truffle.TransactionDetails
    ): Promise<[BN, BN]>;

    getUintParameters(
      code: string,
      txDetails?: Truffle.TransactionDetails
    ): Promise<[string, BN]>;

    updateUintParameters: {
      (
        code: string,
        val: number | BN | string,
        txDetails?: Truffle.TransactionDetails
      ): Promise<Truffle.TransactionResponse<AllEvents>>;
      call(
        code: string,
        val: number | BN | string,
        txDetails?: Truffle.TransactionDetails
      ): Promise<void>;
      sendTransaction(
        code: string,
        val: number | BN | string,
        txDetails?: Truffle.TransactionDetails
      ): Promise<string>;
      estimateGas(
        code: string,
        val: number | BN | string,
        txDetails?: Truffle.TransactionDetails
      ): Promise<number>;
    };

    variableMincap(txDetails?: Truffle.TransactionDetails): Promise<BN>;
  };

  getPastEvents(event: string): Promise<EventData[]>;
  getPastEvents(
    event: string,
    options: PastEventOptions,
    callback: (error: Error, event: EventData) => void
  ): Promise<EventData[]>;
  getPastEvents(event: string, options: PastEventOptions): Promise<EventData[]>;
  getPastEvents(
    event: string,
    callback: (error: Error, event: EventData) => void
  ): Promise<EventData[]>;
}
