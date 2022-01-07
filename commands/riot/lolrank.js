const { SlashCommandBuilder} = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');

module.exports = {
    command: "lolrank",
	name: "Lolrank",
	category: "Riot",
	description: "Get league rank by summoner name and region (Default region: OC1)",
	usage: "lolrank <summoner name> <region>",
	accessible: "Members",
	aliases: [""],
    data: new SlashCommandBuilder()
        .setName('lolrank')
        .setDescription('Get league rank by summoner name and region (Default region: OC1)')
        .addStringOption(option => 
            option.setName('summoner_name')
                  .setDescription('Enter summoner name')
                  .setRequired(true))
        .addStringOption(option =>
            option.setName('region')
                  .setDescription('Enter a region (Default region: OC1)')
                  .setRequired(false)
            ),
    async execute(interaction, args) {
        const rAPI = interaction.client.rAPI;
        const message = await interaction.reply({ content: "...", fetchReply: true });

        // Args
        if (args == undefined) {
            args = [];
            args.push(interaction.options.getString('summoner_name'));
            args.push(interaction.options.getString('region'));
        }

        if (args.length == 0) {
            return await message.edit("Enter a name...");
        }

        const summonerName = args[0];

        let region = "oc1";
        if (args[1] != null) {
            region = args[1];
        }

        // Get Summoner info
        let summoner;
        try {
            summoner = await rAPI.summoner.getBySummonerName({
                region: region,
                summonerName: summonerName,
            });
        } catch (error) {
            return await message.edit("Can't find...");
        }

        // Get league account info
        let leagueInfo;
        try {
            leagueInfo = await rAPI.league.getEntriesBySummonerId({
                region: region,
                summonerId: summoner.id,
            })
        } catch (error) {
            console.log(error);
        }
        
        // Get solo/duo ranked stats
        let i = 0;
        if (leagueInfo[0] != undefined && leagueInfo[0].queueType == 'RANKED_SOLO_5x5') {
            i = 0;
        } else if (leagueInfo[1] != undefined && leagueInfo[1].queueType == 'RANKED_SOLO_5x5') {
            i = 1;
        } else {
            const embed = new MessageEmbed()
            .setAuthor(summoner.name)
            .setDescription("The kid is too scared")
            .setColor(0xFD0061);
            return await message.edit({ content: " ", embeds: [embed] })
        }
        const rankedStats = leagueInfo[i];

        emblems = {
            'IRON': 'https://lolg-cdn.porofessor.gg/img/league-icons-v2/160/1-1.png',
            'BRONZE': 'https://lolg-cdn.porofessor.gg/img/league-icons-v2/160/2-1.png',
            'SILVER': 'https://lolg-cdn.porofessor.gg/img/league-icons-v2/160/3-1.png',
            'GOLD': 'https://lolg-cdn.porofessor.gg/img/league-icons-v2/160/4-1.png',
            'PLATINUM': 'https://lolg-cdn.porofessor.gg/img/league-icons-v2/160/5-1.png',
            'DIAMOND': 'https://lolg-cdn.porofessor.gg/img/league-icons-v2/160/6-1.png',
            'MASTER': 'https://lolg-cdn.porofessor.gg/img/league-icons-v2/160/7-1.png',
            'GRANDMASTER': 'https://lolg-cdn.porofessor.gg/img/league-icons-v2/160/8-1.png',
            'CHALLENGER': 'https://lolg-cdn.porofessor.gg/img/league-icons-v2/160/9-1.png',
        }

        const embed = new MessageEmbed()
        .setAuthor(`${rankedStats.summonerName} - Solo/Duo`)
        .setThumbnail(emblems[rankedStats.tier])
        .addField('Tier', rankedStats.tier, true)
        .addField('Rank', rankedStats.rank, true)
        .addField('LP', `${rankedStats.leaguePoints}`, true)
        .addField('Wins/Losses', `${rankedStats.wins}/${rankedStats.losses}`, true)
        .setColor(0xFD0061);
        
        if (rankedStats.miniSeries) {
            let progress = rankedStats.miniSeries.progress
            let promo = "";
            for (let i = 0; i < progress.length; i++) {
                console.log(progress[i])
                if ((progress[i] == 'W')) {
                    promo += "✅";
                } else if (progress[i] == 'L') {
                    promo += "❌";
                } else {
                    promo += "☐";
                }
            }
            embed.addField('Promos', promo, true);
        }

        await message.edit({ content: " " ,embeds: [embed] })
    },
}