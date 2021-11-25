const { SlashCommandBuilder} = require('@discordjs/builders');

module.exports = {
    command: "pic",
	name: "Pic",
	category: "Fun",
	description: "Get a pic 👀",
	usage: "pic",
	accessible: "Members",
	aliases: [""],
    data: new SlashCommandBuilder()
        .setName('pic')
        .setDescription('Get a pic 👀'),
    async execute(interaction) {
        interaction.client.drive.files.list({
            pageSize: 10,
            fields: 'nextPageToken, files(id, name)',
            
          }, (err, res) => {
            if (err) return console.log('The API returned an error: ' + err);
            const files = res.data.files;
            if (files.length) {
              console.log('Files:');
              files.map((file) => {
                console.log(`${file.name} (${file.id})`);
              });
            } else {
              console.log('No files found.');
            }
          });
        interaction.reply("...");
    },
}