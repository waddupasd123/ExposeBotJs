const { SlashCommandBuilder} = require('@discordjs/builders');
const { getVoiceConnection } = require('@discordjs/voice');

module.exports = {
	command: "stop",
	name: "Stop",
	category: "Voice",
	description: "lucky today...",
	usage: "stop",
	accessible: "the creator",
	aliases: [""],
	data: new SlashCommandBuilder()
		.setName('stop')
		.setDescription('lucky today...'),
	async execute(interaction) {
        var ids = process.env.ADMIN_IDS.split('.');

        if (!ids.includes(interaction.member.id)) {
            interaction.reply('only god can use this command...')
            return;
        }

        const connection = getVoiceConnection(interaction.guildId);

        if (connection) {
            try {
                console.log("Connection destroyed")
                connection.destroy();
            } catch (error) {
                console.log(error);
            }
        }

        interaction.client.voiceCheck.delete(interaction.client.guildId);
        await interaction.reply(';(')

	},
};
