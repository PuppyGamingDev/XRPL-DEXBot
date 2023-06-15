const { SlashCommandBuilder, EmbedBuilder, Colors } = require('discord.js');
const mongoConnect = require('../mongo-connect.js')
const { getxumm, getXRPClient, getToken, getTokensAutocomplete } = require('../Utilities.js')
const xrpl = require('xrpl')
require('dotenv/config')


module.exports = {
    data: new SlashCommandBuilder()
        .setName('tip')
        .setDescription('Tip the Developer of XRPL-DEXBot')
        .addStringOption(option => option.setName('amount').setDescription('Amount of XRP to tip').setRequired(true)),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true })
        var amount = parseFloat(interaction.options.getString('amount'))

        try {
            const xumm = getxumm()
            // Build XUMM Payload and subscribe to it
            const request = {
                "TransactionType": "Payment",
                "Destination": "rm2AEVUcxeYh6ZJUTkWUqVRPurWdn4E9W",
                "Amount": xrpl.xrpToDrops(amount),
                "Memos": [
                    {
                        "Memo": {
                            "MemoData": Buffer.from(`Tipping the Dev from XRPL-DEXBot`).toString('hex')
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
                .setTitle(`Tip the Developer`)
                .setDescription(`Sign your transaction to tip`)
                .setColor(Colors.Gold)
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
                await interaction.editReply({ content: `Succesfully tipped, I hugely appreciate it!`, embeds: [], ephemeral: true })
                return
            }
            else {
                await interaction.editReply({ content: `There seems to have been an issue verifying the transaction`, embeds: [], ephemeral: true })
                return
            }

        } catch (err) {
            console.log(err)
            await interaction.editReply({ content: `There seems to have been an issue verifying or creating the transaction.`, embeds: [], ephemeral: true })
            return
        }

    },
};
