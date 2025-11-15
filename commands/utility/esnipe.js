const { SlashCommandBuilder} = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');

module.exports = {
    command: "esnipe",
	name: "Esnipe",
	category: "Utility",
	description: "Edit sniped!",
	usage: "esnipe",
	accessible: "Members",
	aliases: [""],
    data: new SlashCommandBuilder()
        .setName('esnipe')
        .setDescription('Edit snipe!'),
    async execute(interaction) {
        const esnipe = interaction.client.esnipes.get(interaction.channel.id);
        if (!esnipe) return await interaction.reply('nothing deleted here...');

        const embed = new MessageEmbed()
        .setAuthor(esnipe.author, esnipe.member.displayAvatarURL())
        .setDescription(esnipe.content)
        .setFooter({ text: 'Edit sniped!' })
        .setTimestamp(esnipe.timeStamp)
        .setImage(esnipe.image)
        .setColor(0xFD0061);
        await interaction.reply({ embeds: [embed] })
    },
}