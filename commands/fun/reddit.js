const { SlashCommandBuilder} = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');

module.exports = {
	command: "reddit",
	name: "Reddit",
	category: "Fun",
	description: "Get a reddit post\nTime ranges are: \`hot\` \`all\` \`year\` \`month\` \`week\` \`day\` \`hour\` \`new\` \nLeave blank for real random posts",
	usage: "reddit | reddit <time>",
	accessible: "Members",
	aliases: [""],
	data: new SlashCommandBuilder()
		.setName('reddit')
		.setDescription('Get a reddit post')
        .addStringOption(option => option.setName('subreddit').setDescription('Enter a subreddit name').setRequired(true))
        .addStringOption(option => option.setName('time').setDescription('Enter a time range')),
	async execute(interaction, args) {
		if (args == undefined) {
			args = [];
			args.push(interaction.options.getString('subreddit'));
			args.push(interaction.options.getString('time'));
		}
        
        if (!args[0]) {
            await interaction.reply('Type a subreddit name...')
            return;
        } 

        // let sub = await interaction.client.reddit.getSubreddit(args[0]).getTop({time: 'all'}).then(console.log);
        // console.log(sub)
        // if (!sub) {
        //     await interaction.reply("can't find...");
        // }

        let sub;
        if (args[1]) {
            switch(args[1].toLowerCase()) {
                case "hot":
                    sub = await interaction.client.reddit.getSubreddit(args[0]).getHot({ limit: 25 });
                    break;
                case "all":
                    sub = await interaction.client.reddit.getSubreddit(args[0]).getTop({ time: 'all', limit: 25 });
                    break;
                case "year":
                    sub = await interaction.client.reddit.getSubreddit(args[0]).getTop({ time: 'year', limit: 25 });
                    break;
                case "month":
                    sub = await interaction.client.reddit.getSubreddit(args[0]).getTop({ time: 'month', limit: 25 });
                    break;
                case "week":
                    sub = await interaction.client.reddit.getSubreddit(args[0]).getTop({ time: 'week', limit: 25 });
                    break;
                case "day":
                    sub = await interaction.client.reddit.getSubreddit(args[0]).getTop({ time: 'day', limit: 25 });
                    break;
                case "hour":
                    sub = await interaction.client.reddit.getSubreddit(args[0]).getTop({ time: 'hour', limit: 25 });
                    break;
                case "new":
                    sub = await interaction.client.reddit.getSubreddit(args[0]).getNew({ limit: 25 });
                    break;
                default:
                    let embed = new MessageEmbed()
                        .setColor(0xFD0061)
                        .setDescription("Time ranges are: \`hot\` \`all\` \`year\` \`month\` \`week\` \`day\` \`hour\` \nLeave blank for real random posts")
                    return await interaction.reply({ embeds: [embed] });
            }
        } else {
            sub = await interaction.client.reddit.getSubreddit(args[0]).getRandomSubmission();
        }

        if (sub.length == 0) {
            return await interaction.reply("Can't find...");
        }

        if (sub[0]) {
            let link = sub[Math.floor(Math.random()*sub.length)].permalink
            switch(args[1].toLowerCase()) {
                case "hot":
                    return await interaction.reply(`Here u go from hot\nhttps://www.reddit.com${link}`)
                case "new":
                    return await interaction.reply(`Here u go from new\nhttps://www.reddit.com${link}`)
                default: 
                    return await interaction.reply(`Here u go from top ${args[1]}\nhttps://www.reddit.com${link}`)
            }
            
        } else {
            return await interaction.reply(`Here's a random post\nhttps://www.reddit.com${sub.permalink}`)
        }

	},
};