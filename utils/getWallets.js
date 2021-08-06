'use strict';

const getWalletByIndex = require("./../utils/getWalletByIndex.js");

function getWallets(startingIndex, numberOfWallets){
    return (new Array(numberOfWallets)).fill(null).map( (value,index) =>{
        return getWalletByIndex(index + startingIndex);
    });
}

module.exports = getWallets;