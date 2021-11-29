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
                  .setDescription('Enter a region (Default region: OC1)')
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
        let matchId = await getMatchId(summoner, index, rAPI);
        

        await message.edit({ content: " " , embeds: await getEmbeds(matchId, rAPI), components: getButtons(index) })


        const filter = (interaction) => interaction.user.id === author.id;

        const collector = message.createMessageComponentCollector({
            filter,
            time: 10000,
        })

        collector.on('collect', async (collected) => {
            if (collected.customId === 'backward') {
                index++;
                matchId = await getMatchId(summoner, index, rAPI);
                collector.resetTimer();
                await collected.update({ embeds: await getEmbeds(matchId, rAPI), components: getButtons(index) })
            } else if (collected.customId === 'forward') {
                index--;
                if (index <= 0) {
                    index = 0;
                }
                matchId = await getMatchId(summoner, index, rAPI);
                collector.resetTimer();
                await collected.update({ embeds: await getEmbeds(matchId, rAPI), components: getButtons(index) })
            }
        })

        collector.on('end', async (collected) => {
            await message.edit({ components: [] })
        })
    },

}


async function getEmbeds(matchId, rAPI) {
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
            cluster: "AMERICAS",
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
        if(teamId == 100) {
            blue.addField(summonerName, `${championName}: ${kills}/${deaths}/${assists}\n\`Damage: ${damage}\``, true);
        } else {
            red.addField(summonerName, `${championName}: ${kills}/${deaths}/${assists}\n\`Damage: ${damage}\``, true);
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

async function getMatchId(summoner, index, rAPI) {
    let matchId;
    try {
        matchId = await rAPI.matchV5.getIdsbyPuuid({
            cluster: "AMERICAS",
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