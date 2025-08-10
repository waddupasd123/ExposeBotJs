const fetch = require("node-fetch");
const { SlashCommandBuilder} = require('@discordjs/builders');
const { RiotAPI } = require('@fightmegg/riot-api');
const { MessageEmbed } = require('discord.js');

module.exports = {
    command: "tftrank",
	name: "Tftrank",
	category: "Riot",
	description: "Get tft rank by summoner name and region (Default region: OC1)",
	usage: "tftrank <summoner name> <region>",
	accessible: "Members",
	aliases: [""],
    data: new SlashCommandBuilder()
        .setName('tftrank')
        .setDescription('Get league flex rank by summoner name and region (Default region: OC1)')
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
        const tAPI = interaction.client.tAPI;
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

        const riotId = args[0];
        var nameString = riotId.split('#');
        const gameName = nameString[0];
        const tagLine = nameString[1];

        let region = "oc1";
        if (args[1] != null) {
            region = args[1];
            let lolRegions = ["br1", "eun1", "euw1", "jp1", "kr", "la1", "la2", "na1", "oc1", "ru", "tr1", "ph2", "sg2", "th2", "tw2", "vn2"]
            if (!lolRegions.includes(region)) {
                return await message.edit(`Available regions: ${lolRegions}`);
            }
        }

        // Get summoner info by riot id
        let account;
        try {
            account = await tAPI.account.getByRiotId({
                region: "americas",
                gameName: gameName,
                tagLine: tagLine,
            });
        } catch (error) {
            return await message.edit("Can't find...");
        }
        let name = account.gameName + '#' + account.tagLine;

        // Get ranked stats
        async function getTFTRank(puuid) {
            const url = `https://${region}.api.riotgames.com/tft/league/v1/by-puuid/${puuid}`;
            const res = await fetch(url, {
                headers: { "X-Riot-Token": process.env.TFT_KEY }
            });
            if (!res.ok) throw new Error(`Error fetching TFT rank: ${res.status}`);
            const data = await res.json();
            return data;
        }

        let tftrank;
        try {
            tftrank = await getTFTRank(account.puuid);
        } catch (error) {
            console.error(error.message);
            return await message.edit("Can't find...");
        }


        // try {
        //     tftrank = await tAPI.tftLeague.getEntriesByPUUID({
        //         region: region,
        //         puuid: account.puuid,
        //     })
        // } catch (error) {
        //     console.log(error);
        //     return await message.edit("Can't find...");
        // }

        // This step doesn't really work
        if (tftrank == undefined) {
            const embed = new MessageEmbed()
                .setAuthor({ name: name })
                .setDescription("The kid is too scared")
                .setColor(0xFD0061);
            return await message.edit({ content: " ", embeds: [embed] })
        }

        let i = -1;
        for (let j = 0; j < tftrank.length; j++) {
            if (tftrank[j].queueType == 'RANKED_TFT') {
                i = j;
                break;
            }
        }
        if (i == -1) {
            const embed = new MessageEmbed()
                .setAuthor({ name: name })
                .setDescription("The kid is too scared")
                .setColor(0xFD0061);
            return await message.edit({ content: " ", embeds: [embed] })
        }
        const rankedStats = tftrank[i];

        emblems = {
            'IRON': 'https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-static-assets/global/default/ranked-emblem/emblem-iron.png',
            'BRONZE': 'https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-static-assets/global/default/ranked-emblem/emblem-bronze.png',
            'SILVER': 'https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-static-assets/global/default/ranked-emblem/emblem-silver.png',
            'GOLD': 'https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-static-assets/global/default/ranked-emblem/emblem-gold.png',
            'PLATINUM': 'https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-static-assets/global/default/ranked-emblem/emblem-platinum.png',
            'EMERALD': 'https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-static-assets/global/default/ranked-emblem/emblem-emerald.png',
            'DIAMOND': 'https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-static-assets/global/default/ranked-emblem/emblem-diamond.png',
            'MASTER': 'https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-static-assets/global/default/ranked-emblem/emblem-master.png',
            'GRANDMASTER': 'https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-static-assets/global/default/ranked-emblem/emblem-grandmaster.png',
            'CHALLENGER': 'https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-static-assets/global/default/ranked-emblem/emblem-challenger.png',
        }

        const embed = new MessageEmbed()
        .setAuthor({ name: `${name} - TFT` })
            .setThumbnail(emblems[rankedStats.tier])
            .addFields(
                { name: 'Tier', value: rankedStats.tier, inline: true },
                { name: 'Rank', value: rankedStats.rank, inline: true },
                { name: 'LP', value: `${rankedStats.leaguePoints}`, inline: true },
                { name: 'Wins/Losses', value: `${rankedStats.wins}/${rankedStats.losses}`, inline: true },
            )
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