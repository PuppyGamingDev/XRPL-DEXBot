const { SlashCommandBuilder, EmbedBuilder, Colors } = require('discord.js');
const mongoConnect = require('../mongo-connect.js')
const { getxumm, getXRPClient, getToken, getTokensAutocomplete } = require('../Utilities.js')
const xrpl = require('xrpl')
require('dotenv/config')


module.exports = {
    data: new SlashCommandBuilder()
        .setName('buy')
        .setDescription('Buy a Token at market rates')
        .addStringOption(option => option.setName('currency').setDescription('Currency to buy').setAutocomplete(true).setRequired(true))
        .addStringOption(option => option.setName('amount').setDescription('Amount of XRP to spend').setRequired(true)),
    async autocomplete(interaction) {
        const focusedOption = interaction.options.getFocused(true);
        if (focusedOption.name === "currency") {
            let choices = [{ name: "None", hex: "None" }];
            var tokens = getTokensAutocomplete();
            if (tokens || tokens !== undefined) choices = [...choices, ...tokens];

            const filtered = choices.filter((choice) => choice.name.startsWith(focusedOption.value));
            await interaction.respond(filtered.map((choice) => ({ name: choice.name, value: choice.code })));
        }
    },
    async execute(interaction) {
        if (interaction.options.getString("currency") === "None") {
            await interaction.reply({ content: `Sorry but 'None' is just a placeholder and not an actual Token choice`, ephemeral: true })
            return
        }
        await interaction.deferReply({ ephemeral: true })
        await mongoConnect()

        var amount = parseFloat(interaction.options.getString('amount'))
        const token = getToken(interaction.options.getString("currency"));

        // Check open offers
        const xrplclient = await getXRPClient()
        var we_want = {
            currency: token.code,
            issuer: token.issuer,
            value: "0"
        }
        const we_spend = {
            currency: "XRP",
            value: xrpl.xrpToDrops(amount).toString()
        }

        var orderbook
        try {
            orderbook = await xrplclient.request({
                "command": "book_offers",
                "ledger_index": "current",
                "taker_gets": we_want,
                "taker_pays": we_spend
            })
            await xrplclient.disconnect()
        } catch (err) {
            await xrplclient.disconnect()
            await interaction.editReply({ content: `Sorry but there was either an error or there are no open orders` })
            return
        }

        // Calculate total XRP to buy requested amount
        const orders = orderbook.result.offers
        if (orders[0] === undefined) {
            await interaction.editReply({ content: `Sorry but there were no open offers`, ephemeral: true })
            return
        }
        var buyingTotal = 0
        var xrpCost = 0
        var xrpLimit = parseFloat(xrpl.xrpToDrops(amount))
        for (const order of orders) {
            if (order === undefined) break
            if (xrpCost + parseFloat(order.TakerPays) > xrpLimit) {
                const tokenstotal = parseFloat(order.TakerGets.value)
                const xrptotal = parseFloat(order.TakerPays)
                const price = tokenstotal / xrptotal
                const difference = xrpLimit - xrpCost
                const available = difference * price.toFixed(6)
                buyingTotal += available
                break
            }
            buyingTotal += parseFloat(order.TakerGets.value)
            xrpCost += parseFloat(order.TakerPays)
        }
        we_want.value = buyingTotal.toFixed(6)



        try {
            const xumm = getxumm()
            // Build XUMM Payload and subscribe to it
            const request = {
                "TransactionType": "OfferCreate",
                "Flags": 524288,
                "TakerGets": xrpl.xrpToDrops(amount),
                "TakerPays": we_want,
                "Memos": [
                    {
                        "Memo": {
                            "MemoData": Buffer.from(`DEX order using XRPL-DEXBot`).toString('hex')
                        }
                    }
                ]
            }

            const subscription = await xumm.payload.createAndSubscribe(request, async event => {
                // console.log('New payload event:', event.data)

                if (event.data.signed === true) {
                    // No need to console.log here, we'll do that below
                    return event.data

                }

                if (event.data.signed === false) {
                    // No need to console.log here, we'll do that below
                    return false
                }
            })
            
            // Send the payload URL and QR Code to the user along with their estimates
            const transactEmbed = new EmbedBuilder()
                .setTitle(`Pay for your DEX transaction`)
                .setDescription(`We found you can get approximately\n\n**${we_want.value}** ${token.name}\nin exchange for a maximum of\n**${amount}** XRP\n\nContinue with the transaction if you wish to purchase`)
                .setColor(Colors.Blue)
                .setFields(
                    { name: `Transaction Link`, value: `[Click Here](${subscription.created.next.always})` }
                )
                .setImage(subscription.created.refs.qr_png)
                .setFooter({ text: `XRPL-DEXBot | powered by puppy.tools`, iconURL: interaction.client.user.avatarURL() })

            await interaction.editReply({ embeds: [transactEmbed], ephemeral: true })

            const resolveData = await subscription.resolved
            if (resolveData === false) {
                await interaction.editReply({ content: `The transaction signing was rejected or failed`, embeds: [], ephemeral: true })
                return
            }
            const result = await xumm.payload.get(resolveData.payload_uuidv4)

            if (result.response.dispatched_nodetype === 'MAINNET' && result.meta.resolved === true) {
                await interaction.editReply({ content: `Succesfully submitted market order, You should receive your ${token.name} very shortly when orders are fulfilled`, embeds: [], ephemeral: true })
                return
            }
            else {
                await interaction.editReply({ content: `There seems to have been an issue verifying the transaction. Your order may still have been placed, please check your wallet and any available DEX`, embeds: [], ephemeral: true })
                return
            }

        } catch (err) {
            console.log(err)
            await interaction.editReply({ content: `There seems to have been an issue verifying the transaction. Please check you wallet and a DEX to see if your order was still placed`, embeds: [], ephemeral: true })
            return
        }

    },
};
