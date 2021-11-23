module.exports = {
    name: 'messageCreate',
    execute(message) {
        if (message.author.bot || message.channel.type === "dm") return;

        if (Math.random() < 0.06) {
            emojis = message.guild.emojis.cache;
            message.react(emojis.random().id);
        }
    }
};