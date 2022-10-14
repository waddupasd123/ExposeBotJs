const { SlashCommandBuilder} = require('@discordjs/builders');
const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');


module.exports = {
    command: "lolmatch",
	name: "Lolmatch",
	category: "Riot",
	description: "Get league match by summoner name and region (Default region: OC1)",
	usage: "lolmatch <summoner name> <region>",
	accessible: "Members",
	aliases: [""],
    data: new SlashCommandBuilder()
        .setName('lolmatch')
        .setDescription('Get league match by summoner name and region (Default region: OC1)')
        .addStringOption(option => 
            option.setName('summoner_name')
                  .setDescription('Enter summoner name')
                  .setRequired(true))
        .addStringOption(option =>
            option.setName('region')
                  .setDescription('(Default region: OC1): BR1, EUN1, EUW1, JP1, KR, LA1, LA2, NA1, OC1, RU, TR1')
                  .setRequired(false)
            ),
    async execute(interaction, args) {
        const rAPI = interaction.client.rAPI;
        const author = interaction.member;
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

        // SHARDS TO REGION
        let shard = "SEA";
        const americas = ["br1", "la1", "la2", "na1"];
        const asia = ["jp1", "kr",];
        const europe = ["eun1", "euw1", "ru", "tr1"];
        const sea = ["oc1"];
        if (americas.includes(region.toLowerCase())) {
            shard = "AMERICAS";
        } else if (asia.includes(region.toLowerCase())) {
            shard = "ASIA";
        } else if (europe.includes(region.toLowerCase())) {
            shard = "EUROPE";
        } else {
            shard = "SEA";
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

        // Get match id
        let index = 0;
        let matchId = await getMatchId(summoner, index, rAPI, shard);
        

        await message.edit({ content: " " , embeds: await getEmbeds(matchId, rAPI, shard), components: getButtons(index) })


        const filter = (interaction) => interaction.user.id === author.id;

        const collector = message.createMessageComponentCollector({
            filter,
            time: 10000,
        })

        collector.on('collect', async (collected) => {
            if (collected.customId === 'backward') {
                collector.resetTimer();
                index++;
                matchId = await getMatchId(summoner, index, rAPI, shard);
                await collected.update({ embeds: await getEmbeds(matchId, rAPI, shard), components: getButtons(index) })
            } else if (collected.customId === 'forward') {
                collector.resetTimer();
                index--;
                if (index <= 0) {
                    index = 0;
                }
                matchId = await getMatchId(summoner, index, rAPI, shard);
                await collected.update({ embeds: await getEmbeds(matchId, rAPI, shard), components: getButtons(index) })
            }
        })

        collector.on('end', async (collected) => {
            await message.edit({ components: [] })
        })
    },

}


async function getEmbeds(matchId, rAPI, shard) {
    let blue, red;
    if (!matchId) {
        blue = new MessageEmbed().setTitle('...the end?').setColor(0x0000FF);
        red = new MessageEmbed().setTitle('...the end?').setColor(0xFF0000);
        return [blue, red];
    } 

    // Get match
    let match;
    try {
        match = await rAPI.matchV5.getMatchById({
            cluster: shard,
            matchId: matchId[0],
        })
    } catch (error) {
        console.log(error);
        blue = new MessageEmbed().setTitle('slow down...?').setColor(0x0000FF);
        red = new MessageEmbed().setTitle('slow down...?').setColor(0xFF0000);
        return [blue, red];
    }

    // teamId: 100
    blue = new MessageEmbed().setTitle('Blue Team');
    // teamId: 200
    red = new MessageEmbed().setTitle('Red Team');
    if (match.info.teams[0].teamId == 100) {
        if (match.info.teams[0].win) {
            blue.setAuthor(`${match.info.gameMode} - Victory`);
            red.setAuthor(`${match.info.gameMode} - Defeat`);
        } else {
            blue.setAuthor(`${match.info.gameMode} - Defeat`);
            red.setAuthor(`${match.info.gameMode} - Victory`);
        }
    } else {
        if (match.info.teams[0].win) {
            blue.setAuthor(`${match.info.gameMode} - Defeat`);
            red.setAuthor(`${match.info.gameMode} - Victory`);
        } else {
            blue.setAuthor(`${match.info.gameMode} - Victory`);
            red.setAuthor(`${match.info.gameMode} - Defeat`);
        }
    }

    // Participants
    for (let i = 0; i < 10; i++) {
        let participant = match.info.participants[i];
        let summonerName = participant.summonerName;
        let championName = participant.championName;
        let teamId = participant.teamId;
        let kills = participant.kills;
        let deaths = participant.deaths;
        let assists = participant.assists;
        let damage = participant.totalDamageDealtToChampions;
        let cs = participant.totalMinionsKilled;
        let csmin = cs / match.info.gameDuration
        csmin = Math.round(csmin * 10) / 10
        if(teamId == 100) {
            blue.addField(summonerName, `${championName}: ${kills}/${deaths}/${assists}\n\`Damage: ${damage}\`\nCS: \`${cs}(${csmin})\``, true);
        } else {
            red.addField(summonerName, `${championName}: ${kills}/${deaths}/${assists}\n\`Damage: ${damage}\`\nCS: \`${cs} (${csmin})\``, true);
        }
    }
    

    // Duration
    let time = match.info.gameDuration;
    let hours = Math.floor(time / 60 / 60);
    let minutes = Math.floor(time / 60) - (hours * 60);
    let seconds = time - (minutes * 60) - (hours * 60 * 60);
    if (hours == 0) {
        blue.setFooter(`Duration - ${minutes}m ${seconds}s`);
        red.setFooter(`Duration - ${minutes}m ${seconds}s`);
    } else {
        blue.setFooter(`Duration - ${hours}h ${minutes}m ${seconds}s`)
        red.setFooter(`Duration - ${hours}h ${minutes}m ${seconds}s`)
    }
    blue.setTimestamp(match.info.gameCreation).setColor(0x0000FF);
    red.setTimestamp(match.info.gameCreation).setColor(0xFF0000);
    return [blue, red];
}

async function getMatchId(summoner, index, rAPI, shard) {
    let matchId;
    try {
        matchId = await rAPI.matchV5.getIdsbyPuuid({
            cluster: shard,
            puuid: summoner.puuid,
            params: {
                start: index,
                count: 1,
            },
        })
    } catch (error) {
        console.log(error);
    }
    return matchId;
}

function getButtons(index) {
    let buttons;
    if (index <= 0) {
        buttons = new MessageActionRow()
        .addComponents(
            new MessageButton()
                .setCustomId('backward')
                .setLabel('<')
                .setStyle('PRIMARY')
                .setDisabled(false)
        )
        .addComponents(
            new MessageButton()
                .setCustomId('forward')
                .setLabel('>')
                .setStyle('PRIMARY')
                .setDisabled(true)
        );
    } else {
        buttons = new MessageActionRow()
        .addComponents(
            new MessageButton()
                .setCustomId('backward')
                .setLabel('<')
                .setStyle('PRIMARY')
                .setDisabled(false)
        )
        .addComponents(
            new MessageButton()
                .setCustomId('forward')
                .setLabel('>')
                .setStyle('PRIMARY')
                .setDisabled(false)
        );
    }


    return [buttons];
}