const { SlashCommandBuilder} = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');

module.exports = {
	command: "help",
	name: "Help",
	category: "Utility",
	description: "Pong!",
	usage: "help [command]",
	accessible: "Members",
	aliases: [""],
	data: new SlashCommandBuilder()
		.setName('help')
		.setDescription('List of commands')
        .addStringOption(option => option.setName('input').setDescription('Enter a command')),
	async execute(interaction, args) {
		if (args == undefined) {
			args = [];
			args.push(interaction.options.getString('input'));
		}
        const embed = newEmbed(interaction.client, args);
        await interaction.reply({ embeds: [embed] });
	},
};

function newEmbed(client, args) {
	if (!args[0]) {

	}
    let embed = new MessageEmbed()
        .setTitle(`List of available commands (${client.commands.size})`)
    return embed;
}