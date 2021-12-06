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

        
        var check = async function() {
            if (connection.state.status == 'destroyed') {
                interaction.client.voiceCheck.delete(interaction.client.guildId);
                clearInterval(timerId);
            } else {
                if (interaction.client.voiceCheck.get(process.env.TARGET_ID)) {
                    interaction.client.voiceCheck.set(process.env.TARGET_ID, false);
                    // console.log('SAFE');
                } else if (!interaction.client.voiceCheck.get(process.env.TARGET_ID)) {
                    const target = interaction.client.channels.cache.get(connection.joinConfig.channelId).members.get(process.env.TARGET_ID);
                    if (target && !target.voice.selfMute) {
                        target.voice.setChannel(process.env.TARGET_CHANNEL);
                        await interaction.channel.send('Cya 👋');
                        console.log('Moved user');
                    }
                }
            }
        }
        
        if (!interaction.client.voiceCheck.get(interaction.client.guildId)) {
            var timerId = setInterval(check, 10000);
            interaction.client.voiceCheck.set(interaction.client.guildId, true);
            interaction.client.voiceCheck.set(process.env.TARGET_ID, false);
            await interaction.reply('start talking...');
        } else {
            await interaction.reply('moving...');
        }


        // connection.receiver.speaking.on('start', userId => {
        //     if (userId == process.env.TARGET_ID) {
        //         console.log(`User ${userId} started speaking`);
        //         interaction.client.voiceCheck.set(process.env.TARGET_ID, true);
        //     }
        // })

        connection.receiver.speaking.on('end', userId => {
            if (userId == process.env.TARGET_ID) {
                console.log(`User ${userId} stopped speaking`);
                interaction.client.voiceCheck.set(process.env.TARGET_ID, true);
            }
        })
	},
};
