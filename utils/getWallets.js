'use strict';

const getWalletByIndex = require("./../utils/getWalletByIndex.js");

function getWallets(startingIndex, numberOfWallets, fileName){
    return (new Array(numberOfWallets)).fill(null).map( (value,index) =>{
        return getWalletByIndex(index + startingIndex, fileName);
    });
}

module.exports = getWallets;