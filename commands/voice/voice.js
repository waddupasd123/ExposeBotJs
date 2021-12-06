const { SlashCommandBuilder} = require('@discordjs/builders');
const { joinVoiceChannel, VoiceConnectionStatus, entersState, getVoiceConnection } = require('@discordjs/voice');

module.exports = {
	command: "voice",
	name: "Voice",
	category: "Voice",
	description: "speak up...",
	usage: "voice",
	accessible: "the creator",
	aliases: [""],
	data: new SlashCommandBuilder()
		.setName('voice')
		.setDescription('speak up...'),
	async execute(interaction) {
        var ids = process.env.ADMIN_IDS.split('.');
        console.log(interaction.member.voice)

        if (!ids.includes(interaction.member.id)) {
            await interaction.reply('only god can use this command...')
            return;
        }

        const { channel } = interaction.member.voice;

        if (!channel) {
            return await interaction.reply('Join channel first...');
        }

        if (getVoiceConnection(interaction.guildId) && getVoiceConnection(interaction.guildId).joinConfig.channelId == channel.id) {
            return await interaction.reply('Already here...');
        }


        const connection = joinVoiceChannel({
            channelId: channel.id,
            guildId: channel.guild.id,
            selfDeaf: true,
            selfMute: false,
            adapterCreator: channel.guild.voiceAdapterCreator,
        });

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

        
        var check = function() {
            if (connection.state.status == 'destroyed') {
                interaction.client.voiceCheck.delete(interaction.client.guildId);
                clearInterval(timerId);
            } else {
                console.log(connection.joinConfig.channelId);
            }
        }
        
        if (!interaction.client.voiceCheck.get(interaction.client.guildId)) {
            var timerId = setInterval(check, 5000);
            interaction.client.voiceCheck.set(interaction.client.guildId, true);
            await interaction.reply('start talking...');
        } else {
            await interaction.reply('moving...');
        }



        connection.receiver.speaking.on('start', userId => console.log(`User ${userId} started speaking`));
        connection.receiver.speaking.on('end', userId => console.log(`User ${userId} stopped speaking`));

	},
};
