const { SlashCommandBuilder} = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');

module.exports = {
    command: "snipe",
	name: "Snipe",
	category: "Utility",
	description: "Sniped!",
	usage: "snipe",
	accessible: "Members",
	aliases: [""],
    data: new SlashCommandBuilder()
        .setName('snipe')
        .setDescription('Snipe!'),
    async execute(interaction) {
        const snipe = interaction.client.snipes.get(interaction.channel.id);
        if (!snipe) return await interaction.reply('nothing deleted here...');

        const embed = new MessageEmbed()
        .setAuthor(snipe.author, snipe.member.displayAvatarURL())
        .setDescription(snipe.content)
        .setFooter({ text: 'Sniped!' })
        .setTimestamp(snipe.timeStamp)
        .setImage(snipe.image)
        .setColor(0xFD0061);
        await interaction.reply({ embeds: [embed] })
    },
}