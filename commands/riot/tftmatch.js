const { SlashCommandBuilder} = require('@discordjs/builders');
const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');


module.exports = {
    command: "tftmatch",
	name: "Tftmatch",
	category: "Riot",
	description: "Get league match by summoner name and region (Default region: OC1)",
	usage: "tftmatch <summoner name> <region>",
	accessible: "Members",
	aliases: [""],
    data: new SlashCommandBuilder()
        .setName('tftmatch')
        .setDescription('Get tft match by summoner name and region (Default region: OC1)')
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
        const tAPI = interaction.client.tAPI;
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

        // SHARDS TO REGION
        let shard = "sea";
        const americas = ["br1", "la1", "la2", "na1"];
        const asia = ["jp1", "kr",];
        const europe = ["eun1", "euw1", "ru", "tr1"];
        if (americas.includes(region.toLowerCase())) {
            shard = "americas";
        } else if (asia.includes(region.toLowerCase())) {
            shard = "asia";
        } else if (europe.includes(region.toLowerCase())) {
            shard = "europe";
        } else {
            shard = "sea";
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
        // Get Summoner info
        let summoner;
        try {
            summoner = await tAPI.tftSummoner.getByPUUID({
                region: region,
                puuid: account.puuid,
            });
        } catch (error) {
            return await message.edit("Can't find...");
        }

        // Get match id
        let index = 0;
        let matchId = await getMatchId(summoner, index, tAPI, shard);

        await message.edit({ content: " " , embeds: await getEmbeds(matchId, tAPI, shard, summoner), components: getButtons(index) })


        const filter = (interaction) => interaction.user.id === author.id;

        const collector = message.createMessageComponentCollector({
            filter,
            time: 10000,
        })

        collector.on('collect', async (collected) => {
            await collected.deferUpdate();
            if (collected.customId === 'backward') {
                index++;
                matchId = await getMatchId(summoner, index, tAPI, shard);
                await collected.editReply({ embeds: await getEmbeds(matchId, tAPI, shard, summoner), components: getButtons(index) })
                collector.resetTimer();
            } else if (collected.customId === 'forward') {
                index--;
                if (index <= 0) {
                    index = 0;
                }
                matchId = await getMatchId(summoner, index, tAPI, shard);
                await collected.editReply({ embeds: await getEmbeds(matchId, tAPI, shard, summoner), components: getButtons(index) })
                collector.resetTimer();
            }
        })

        collector.on('end', async (collected) => {
            await message.edit({ components: [] })
        })
    },

}


async function getEmbeds(matchId, tAPI, shard, summoner) {
    let embed;
    if (!matchId) {
        embed = new MessageEmbed().setTitle('...the end?').setColor(0x0000FF);
        return [embed];
    } 

    // Get match
    let match;
    try {
        match = await tAPI.tftMatch.getById({
            region: shard,
            matchId: matchId[0],
        })
    } catch (error) {
        embed = new MessageEmbed().setTitle('...the end?').setColor(0x0000FF);
        return [embed];
    }

    embed = new MessageEmbed().setAuthor({ name: `TFT Match - ${matchId}`});
    embed.setTitle(summoner.name)

    // Participants
    for (let i = 0; i < match.info.participants.length; i++) {
        let participant = match.info.participants[i];
        if (participant.puuid == summoner.puuid) {
            if (participant.placement == 1) {
                embed.addFields(
                    { name: `Placement: ${participant.placement}`, value: 'DAYUM' }
                )
            } else {
                embed.addFields(
                    { name: `Placement: ${participant.placement}`, value: 'HOT TRASH' }
                )
            }
            break;
        }
    }

    let time = match.info.game_length;
    let hours = Math.floor(time / 60 / 60);
    let minutes = Math.floor(time / 60) - (hours * 60);
    let seconds = Math.round(time - (minutes * 60) - (hours * 60 * 60));
    if (hours == 0) {
        embed.setFooter({
            text: `Duration - ${minutes}m ${seconds}s`
        });
    } else {
        embed.setFooter({
            text: `Duration - ${hours}h ${minutes}m ${seconds}s`
        })
    }

    embed.setTimestamp(match.info.game_datetime).setColor(0x0000FF);
    return [embed];
}

async function getMatchId(summoner, index, tAPI, shard) {
    let matchId;
    try {
        matchId = await tAPI.tftMatch.getMatchIdsByPUUID({
            region: shard,
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