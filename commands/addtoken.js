const { SlashCommandBuilder } = require('discord.js');
const mongoConnect = require('../mongo-connect.js');
const { addToken } = require('../Utilities.js');
const tokenSchema = require('../schemas/tokenSchema.js');
require('dotenv/config');


module.exports = {
    data: new SlashCommandBuilder()
        .setName('addtoken')
        .setDescription('Add a token to your database')
        .addStringOption(option => option.setName('name').setDescription('Name for the currency').setRequired(true))
        .addStringOption(option => option.setName('issuer').setDescription('Issuer of the currency').setRequired(true))
        .addStringOption(option => option.setName('code').setDescription('The currency code').setRequired(true)),
    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true })
        await mongoConnect()

        // Get input values
        const name = interaction.options.getString('name')
        const issuer = interaction.options.getString("issuer")
        const code = interaction.options.getString("code")

        // Add or update token in database
        await tokenSchema.findOneAndUpdate(
            {_id: code},
            { name: name, issuer: issuer },
            { upsert: true }
        );

        // Update local token map
        addToken(code, name, issuer)
        
        // Respond to finish
        await interaction.editReply({ content: `Token ${name} to database`})
        return
    },
};
