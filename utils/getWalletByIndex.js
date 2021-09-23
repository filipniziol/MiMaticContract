'use strict';

const fs = require('fs');
const { ethers } = require("ethers");

function getWalletByIndex(index,fileName){

    let mnemonic = fs.readFileSync(fileName).toString().trim();
    //if (fileName) {
    //    mnemonic = fs.readFileSync(fileName).toString().trim();
    //}
    return ethers.Wallet.fromMnemonic(mnemonic, `m/44'/60'/0'/0/${index.toString()}`);
}

module.exports = getWalletByIndex;