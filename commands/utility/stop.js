const { SlashCommandBuilder} = require('@discordjs/builders');
const { joinVoiceChannel } = require('@discordjs/voice');

module.exports = {
	command: "stop",
	name: "Stop",
	category: "Utility",
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

        if (interaction.client.connection && interaction.client.connection.state.status != 'destroyed') {
            try {
                console.log("DESTROYED")
                interaction.client.connection.destroy();
            } catch (error) {
                console.log(error);
            }
        }

        await interaction.reply(';(')

	},
};
