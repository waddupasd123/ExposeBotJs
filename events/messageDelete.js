module.exports = {
    name: 'messageDelete',
    execute(message) {
        if (message.author.bot) return;

        message.client.snipes.set(
            message.channel.id, {
                content: message.content,
                author: message.author.tag,
                member: message.member,
                image: message.attachments.first() ? message.attachments.first().proxyURL : null,
                timeStamp: message.createdTimestamp,
            }
        )
    }
};