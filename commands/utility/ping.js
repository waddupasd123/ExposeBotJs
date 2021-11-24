const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
	command: "ping",
	name: "Ping",
	category: "Utility",
	description: "Pong!",
	usage: "ping",
	accessible: "Members",
	aliases: [""],
	data: new SlashCommandBuilder()
		.setName('ping')
		.setDescription('Replies with Pong!'),
	async execute(interaction) {
		await interaction.reply((`🏓 Latency is ${Date.now() - interaction.createdTimestamp}ms. API Latency is ${Math.round(interaction.client.ws.ping)}ms`));
	},
};