// Require the necessary discord.js classes
require('dotenv').config();

const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const fs = require('fs');
const { Client, Collection, Intents } = require('discord.js');
const { token } = process.env.DISCORD_TOKEN;
const clientId = process.env.CLIENT_ID;
const guildId = process.env.GUILD_ID;

// Create a new client instance
const client = new Client({ 
	intents: [
		Intents.FLAGS.GUILDS, 
		Intents.FLAGS.GUILD_MESSAGES
	] 
});

// Command prefix
const PREFIX = "ex ";


// Events
const eventFiles = fs.readdirSync('./events').filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
	const event = require(`./events/${file}`);
	if (event.once) {
		client.once(event.name, (...args) => event.execute(...args));
	} else {
		client.on(event.name, (...args) => event.execute(...args));
	}
}


// Commands
client.commands = new Collection();
const commands = [];
const commandFolders = fs.readdirSync('./commands');

for (const folder of commandFolders) {
	const commandFiles = fs.readdirSync(`./commands/${folder}`).filter(file => file.endsWith('.js'));
	for (const file of commandFiles) {
		const command = require(`./commands/${folder}/${file}`);
		// Set a new item in the Collection
		// With the key as the command name and the value as the exported module
		client.commands.set(command.data.name, command);
		commands.push(command.data.toJSON());
	}
}


// Listens for interactions
client.on('interactionCreate', async interaction => {
	if (interaction.isCommand()) {
		const command = client.commands.get(interaction.commandName);

		if (!command) return;

		try {
			await command.execute(interaction);
		} catch (error) {
			console.error(error);
			await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
		}
	}
});


// Listens for messages
client.on('messageCreate', async message => {
	if (message.author.bot) return;

	if (message.content.toLowerCase().startsWith(PREFIX)) {
		const [commandName, ...args] = message.content.trim().substring(PREFIX.length).split(' ');
		const command = client.commands.get(commandName);

		if (!command) return;

		try {
			await command.execute(message, args);
		} catch (error) {
			console.error(error);
			await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
		}
	}
});


// Refresh slash commands for testing
const rest = new REST({ version: '9' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
	try {
		console.log('Started refreshing application (/) commands.');

		await rest.put(
			Routes.applicationGuildCommands(clientId, guildId),
			{ body: commands },
		);

		console.log('Successfully reloaded application (/) commands.');
	} catch (error) {
		console.error(error);
	}
})();

// Login to Discord with your client's token
client.login(token);