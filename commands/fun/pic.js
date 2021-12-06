const { SlashCommandBuilder} = require('@discordjs/builders');
const fs = require('fs');
const { unlink } =  require('fs/promises');

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
        const drive = interaction.client.drive;
        const message = await interaction.reply({ content: "Searching...", fetchReply: true });

        // File list
        const fileList = [];
        let nextPageToken = "";
        do {
            const res = await drive.files.list(
                {
                    q: `parents = '${process.env.FOLDER_ID}'`,
                    spaces: 'drive',
                    fields: 'nextPageToken, files(id, name)',
                    pageSize: 1000,
                }
            );
            Array.prototype.push.apply(fileList, res.data.files);
            nextPageToken = res.data.nextPageToken;
        } while (nextPageToken);

        // Download random file
        const fileData = fileList[Math.floor(Math.random()*fileList.length)]; 
        // Check if exists to prevent error
        const exists = interaction.client.pics.get(fileData.id);
        if (exists) return await message.reply('calm down...');
        interaction.client.pics.set(fileData.id, {
            name: fileData.name,
        })

        const isItDoneYet = drive.files
        .get({fileId: fileData.id, alt: 'media'}, {responseType: 'stream'})
        .then(res => {
            return new Promise((resolve, reject) => {
                console.log(`writing to ${fileData.name}`);
                const dest = fs.createWriteStream(fileData.name);
                let progress = 0;
        
                res.data
                    .on('end', () => {
                        console.log('Done downloading file.');
                        resolve(fileData.name);
                    })
                    .on('error', err => {
                        console.error('Error downloading file.');
                        reject(err);
                    })
                    .on('data', d => {
                        progress += d.length;
                        if (process.stdout.isTTY) {
                            process.stdout.clearLine();
                            process.stdout.cursorTo(0);
                            process.stdout.write(`Downloaded ${progress} bytes`);
                        }
                    })
                    .pipe(dest);
            });
        });

        // Send after download finish
        isItDoneYet
        .then(async ok => {
            console.log(ok);
            try {
                await message.edit({content: " ", files: [fileData.name]});
                try {
                    await unlink(fileData.name);
                    await interaction.client.pics.delete(fileData.id);
                    console.log(`Deleted ${fileData.name}`);
                } catch (error) {
                    await interaction.client.pics.delete(fileData.id);
                    console.log(error);
                }
            } catch (error) {
                console.log(error);
                try {
                    await unlink(fileData.name);
                    await interaction.client.pics.delete(fileData.id);
                    console.log(`Deleted ${fileData.name}`);
                } catch (error) {
                    await interaction.client.pics.delete(fileData.id);
                    console.log(error);
                }
            }
        })
        .catch(async err => {
            console.error(err)
            try {
                await message.edit("it no work ;(");
                try {
                    await unlink(fileData.name);
                    await interaction.client.pics.delete(fileData.id);
                    console.log(`Deleted ${fileData.name}`);
                } catch (error) {
                    await interaction.client.pics.delete(fileData.id);
                    console.log(error);
                }
            } catch (error) {
                console.log(error);
                try {
                    await unlink(fileData.name);
                    await interaction.client.pics.delete(fileData.id);
                    console.log(`Deleted ${fileData.name}`);
                } catch (error) {
                    await interaction.client.pics.delete(fileData.id);
                    console.log(error);
                }
            }
        })
    },
}