module.exports = {
    name: 'messageUpdate',
    execute(oldMessage, newMessage) {
        if (oldMessage.author.bot) return;

        oldMessage.client.esnipes.set(
            oldMessage.channel.id, {
                content: oldMessage.content,
                author: oldMessage.author.tag,
                member: oldMessage.member,
                image: oldMessage.attachments.first() ? oldMessage.attachments.first().proxyURL : null,
                timeStamp: oldMessage.createdTimestamp,
            }
        )
    }
};