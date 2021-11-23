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
		await interaction.reply((`🏓Latency is ${interaction.createdTimestamp - Date.now()}ms. API Latency is ${Math.round(interaction.client.ws.ping)}ms`));
	},
	async execute(message, args) {
		await message.reply((`🏓Latency is ${message.createdTimestamp - Date.now()}ms. API Latency is ${Math.round(message.client.ws.ping)}ms`));
	},
};