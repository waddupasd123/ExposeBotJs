const { SlashCommandBuilder} = require('@discordjs/builders');
const { MessageEmbed, SnowflakeUtil } = require('discord.js');

module.exports = {
    command: "quote",
	name: "Quote",
	category: "Fun",
	description: "Get a random quote in this channel",
	usage: "quote",
	accessible: "Members",
	aliases: [""],
    data: new SlashCommandBuilder()
        .setName('quote')
        .setDescription('Get a random quote in this channel'),
    async execute(interaction) {
        const startTime = interaction.channel.createdTimestamp;
        const endTime = Date.now();
        const date = new Date(startTime + Math.random() * (endTime - startTime));
        const fetchMessages = await interaction.channel.messages.fetch({ around: SnowflakeUtil.generate(date), limit: 100 });

        let message = fetchMessages.random();
        if (!message) return await interaction.reply('get talking fool');
        for (let i = 0; i < 100; i++) {
            if (!message.author.bot) break;
            prevMessage = message;
            while (prevMessage.id == message.id) {
                message = fetchMessages.random();
            }
        }

        if (message.author.bot) return await interaction.reply('get talking fool');
        const embed = new MessageEmbed()
        .setAuthor(message.author.tag, message.author.displayAvatarURL())
        .setDescription(message.content)
        .addField(`\_ \_`,`[Context](https://discordapp.com/channels/${message.guildId}/${message.channelId}/${message.id})`)
        .setTimestamp(message.createdTimestamp)
        .setImage(message.attachments.first() ? message.attachments.first().proxyURL : null,)
        .setColor(0xFD0061);
        await interaction.reply({ embeds: [embed] })
    },
}