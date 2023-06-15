require('dotenv/config');
const mongoConnect = require('./mongo-connect.js');
const tokenSchema = require('./schemas/tokenSchema.js');
const schedule = require('node-schedule');

// XUMM & XRPL
const { XummSdk } = require('xumm-sdk');
const xumm = new XummSdk(process.env.XUMMAPIKEY, process.env.XUMMAPISECRET);
const xrpl = require("xrpl");

const getxumm = () => {
    return xumm
}

const getXRPClient = async () => {
    var XRPLclient = new xrpl.Client(process.env.NETWORK);
    await XRPLclient.connect();
    return XRPLclient
}

// Token management
let Tokens = new Map()
// Update local token list every 30 minutes incase of database changes while bot is running
var s = schedule.scheduleJob('*/30 * * * *', async function() {
    await reloadTokens()
});

// Refresh Tokens Map
const reloadTokens = async () => {
    const tokens = await tokenSchema.find()
    if (tokens.length < 1) return
    Tokens = new Map()
    for (const token of tokens) {
        Tokens.set(token._id, { name: token.name, issuer: token.issuer, code: token._id })
    }
}

// Return a token by its Currency Code
const getToken = (id) => {
    return Tokens.get(id)
}

const addToken = (code, name, issuer) => {
    Tokens.set(code, { name: name, issuer: issuer, code: code })
}

// Used for Autocomplete in Slash Commands to return available Tokens
const getTokensAutocomplete = () => {
    const tokens = []
    Tokens.forEach((token) => {
        tokens.push({ name: token.name, code: token.code })
    })
    return tokens
}

module.exports = { getxumm, getXRPClient, getToken, getTokensAutocomplete, reloadTokens, addToken }