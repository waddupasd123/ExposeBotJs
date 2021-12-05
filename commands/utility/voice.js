const { SlashCommandBuilder} = require('@discordjs/builders');
const { joinVoiceChannel, VoiceConnectionStatus, entersState } = require('@discordjs/voice');

module.exports = {
	command: "voice",
	name: "Voice",
	category: "Utility",
	description: "speak up...",
	usage: "voice",
	accessible: "the creator",
	aliases: [""],
	data: new SlashCommandBuilder()
		.setName('voice')
		.setDescription('speak up...'),
	async execute(interaction) {
        var ids = process.env.ADMIN_IDS.split('.');

        if (!ids.includes(interaction.member.id)) {
            interaction.reply('only god can use this command...')
            return;
        }

        const { channel } = interaction.member.voice;

        if (!channel) {
            interaction.reply('Join channel first...')
            return;
        }

        if (interaction.client.connection) {
            try {
                interaction.client.connection.destroy();
            } catch (error) {
               // console.log(error);
            }
        }

        const connection = joinVoiceChannel({
            channelId: channel.id,
            guildId: channel.guild.id,
            selfDeaf: true,
            selfMute: false,
            adapterCreator: channel.guild.voiceAdapterCreator,
        });

        interaction.client.connection = connection;

        connection.on(VoiceConnectionStatus.Disconnected, async (oldState, newState) => {
            try {
                await Promise.race([
                    entersState(connection, VoiceConnectionStatus.Signalling, 5_000),
                    entersState(connection, VoiceConnectionStatus.Connecting, 5_000),
                ]);
                // Seems to be reconnecting to a new channel - ignore disconnect
            } catch (error) {
                // Seems to be a real disconnect which SHOULDN'T be recovered from
                connection.destroy();
            }
        })


        setInterval(check, 5000);


        connection.receiver.speaking.on('start', userId => console.log(`User ${userId} started speaking`));
        connection.receiver.speaking.on('end', userId => console.log(`User ${userId} stopped speaking`));

	},
};

function check() {
    console.log('check')
    
}
