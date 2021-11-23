module.exports = {
    name: 'messageCreate',
    execute(message) {
        if (message.author.bot || message.channel.type === "dm") return;
        message.react('🤔');
    }
};