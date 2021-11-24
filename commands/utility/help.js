const { SlashCommandBuilder} = require('@discordjs/builders');
const { MessageEmbed, MessageActionRow, MessageSelectMenu } = require('discord.js');

module.exports = {
	command: "help",
	name: "Help",
	category: "Utility",
	description: "Help list",
	usage: "help | help <command>",
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
        sendEmbed(interaction, args);
        
	},
};

async function sendEmbed(interaction, args) {
	const client = interaction.client;
	const author = interaction.member;

	if (!args[0]) {
		let embed = new MessageEmbed()
        .setTitle(`List of available commands (${client.commands.size})`)
		.setColor(0xFD0061);

		const categories = [
			...new Set(client.commands.map(command => command.category))
		];

		const commands = categories.map((category) => {
			const getCommands = client.commands.filter(
				(command) => command.category == category
			).map(command => {
				return {
					name: command.name || 'No name :|',
					description: command.description || 'No description :|',
					usage: command.usage || `¯\\_(ツ)_/¯`,
				};
			});
			return {
				category : category,
				commands: getCommands,
			}
		});

		const selectMenu = new MessageActionRow()
			.addComponents(
				new MessageSelectMenu()
					.setCustomId('help-menu')
					.setPlaceholder('Select a category')
					.addOptions(
						commands.map((command) => {
							return {
								label: command.category,
								value: command.category,
								description: `Commands from ${command.category} category`,
							};
						})
					)
			);

		// Initial message
		const message = await interaction.reply({ embeds: [embed], components: [selectMenu], fetchReply: true });


		const filter = (interaction) => interaction.user.id === author.id;

		const collector = message.createMessageComponentCollector({
			filter,
			componentType: 'SELECT_MENU',
			time: 15000,
		});

		collector.on('collect', async (collected) => {
			if (collected.customId === 'help-menu') {
				const [ value ] = collected.values;
				const category = commands.find(
					(x) => x.category === value
				);

				//console.log(collected);
				//if (!category) return;

				const categoryEmbed = new MessageEmbed()
					.setTitle(`${value} commands`)
					.addFields(
						category.commands.map((command) => {
							return {
								name: `\`${command.name}\``,
								value: `${command.description}\nUsage: ${command.usage}`,
								inline: false,
							}
						})
					);
				await collected.update({ embeds: [categoryEmbed] })
			}
		});

		collector.on('end', () => {
			interaction.editReply({ components: []})
		})

	} else {
		const command = client.commands.find(command => command.name.toLowerCase() === args[0].toLowerCase());

		if (!command) return await interaction.reply('???');

		let embed = new MessageEmbed()
			.setTitle(`${command.name}`)
			.setColor(0xFD0061)
			.setDescription(`${command.description}\nUsage: ${command.usage}`);
		await interaction.reply({ embeds: [embed] })
	}

}