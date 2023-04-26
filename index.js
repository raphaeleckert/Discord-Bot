const { Client, Intents, GatewayIntentBits } = require('discord.js');
const { createAudioPlayer, createAudioResource, joinVoiceChannel } = require('@discordjs/voice');
const ytdl = require('ytdl-core');
const ytSearch = require('yt-search');
const { getInfo, validateURL } = require('ytdl-core');
const os = require('os');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// checks string for url pattern
const validURL = (str) =>{
    var regex = /(http|https):\/\/(\w+:{0,1}\w*)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%!\-\/]))?/;
    return(regex.test(str));
}

// checks url for timestamp and returns start time in seconds
const timestamp = (url) => {
    const regex = /(t=|start=)(?:\d+)/;
    if (regex.test(url)) {
        urlParams = url.split('=');
        const seconds = parseInt(urlParams[urlParams.length - 1], 10); // time = last parameter
        const starttime = new Date(seconds * 1000).toISOString().substr(11, 8);
        console.log(`${starttime}.000`);
        return `${starttime}.000`;
    }
    return '0s';
}

// handling the music queue
const loopHandler = (message, connection, voiceChannel) => {
    if (queue.length === 0) {
        connection.disconnect();
    } else {
        var currentSong = queue[0];
        message.channel.send(`Now Playing:   ${currentSong.title}`);
        stream = ytdl(currentSong.url, { quality: 'highestaudio', filter: 'audioonly'})
        connection
        .play(ytdl(currentSong.url, { quality: 'highestaudio', filter: 'audioonly'})) // , begin: currentSong.start 
        .on("finish", () => {
            queue.shift();
            loopHandler(message, connection, voiceChannel);
        });
    }
}

// plays first song in Queue
const playSong = (player, channel) => {
    if (queue.length === 0) {
        connection.disconnect();
    } else {
        const stream = ytdl(queue[0].url, { quality: 'highestaudio', filter: 'audioonly'})
        const resource = createAudioResource(stream);
        channel.send(`Now Playing:   ${currentSong.title}`);
        player.play(resource);
    }
}

// returns song queue in chat
const displayQueue = (channel, description) => {
    const titles = queue.map(a => a.title)
    channel.send(`${description}`);
    for (i in titles) {
        channel.send(`  ${parseInt(i) + 1} ${titles[i]}`);
    }    
}

//start up
const prefix = '!';
client.once('ready', () => {
    os.setPriority(-20);
    console.log(`Bot running on priority ${os.getPriority()}`);
});

var queue = []; // song queue
var connection; // joined voice channel
const subscriptions = new Map<import('discord.js').Snowflake

client.on('message', async message => {

    try {
        //command processing
        if(!message.content.startsWith(prefix) || message.author.bot) return;
        message.delete();
        const args = message.content.slice(prefix.length).split(/ +/);
        const command = args.shift().toLowerCase();

        //add to queue        
        if (command === 'q') {
            if (!message.member.voice.channel) return message.channel.send('Join a voice channel to listen to music');

            // link
            if (validURL(args[0])) {
                if (validateURL(args[0])) {
                    queue.push({url: args[0], title: (await getInfo(args[0])).videoDetails.title, start: '0s'}); 
                } else {
                    message.channel.send('No valid link');
                }

            // search
            } else {
                const videoFinder = async query => {
                    const videoResult = await ytSearch(query);
                    return (videoResult.videos.length > 1) ? videoResult.videos[0] : null
                }
                const video = await videoFinder(args.join(' '));
                if (video) {
                    queue.push({url: video.url, title: (await getInfo(video.url)).videoDetails.title, start: '0s'});
                } else {
                    message.channel.send('No Youtube results');
                }
            }
            message.channel.send(`Added to Queue:   ${queue[queue.length -1].title}`);

            // if nothing currently playing
            if (queue.length === 1) {
                const voiceChannel = message.member.voice.channel;
                connection = joinVoiceChannel({
                    channelId: voiceChannel.id,
                    guildId: voiceChannel.guild.id,
                    adapterCreator: voiceChannel.guild.voiceAdapterCreator
                })
                const player = createAudioPlayer();
                connection.subscribe(player);
                playSong(player, message.channel)
                player.on(AudioPlayerStatus.Idle, () => {
                    queue.shift();
                    playSong(player, message.channel);
                });
            }
        
        //stop    
        } else if (command === 'p') {
            const voiceChannel = message.member.voice.channel;
            if (!voiceChannel) return message.channel.send('You need to be in a voice channel to stop the bot');
            if (!queue.length === 0) return message.channel.send('No music to pause');
            queue = [];
            voiceChannel.leave();

        //skip
        } else if (command === 's') {
            if (queue.length < 2) {
                message.channel.send('No further songs in queue')
                return;
            }
            if (connection.dispatcher) {
                connection.dispatcher.end();
            }

        //shuffle
        } else if (command === 'x') {
            var restQueue = queue.slice(1);
            restQueue = restQueue.sort((a, b) => 0.5 - Math.random());
            queue = [queue.shift()].concat(restQueue);
            displayQueue(message.channel, 'New Queue:');

        //info
        } else if (command === 'i') {
            displayQueue(message.channel, 'Queue:');

        //help
        } else {
             message.channel.send(
                 `commands:
                    !q - add song to queue
                    !p - stop the music
                    !s - skip song
                    !x - shuffle queue
                    !i - queue info
                 `);
        };        
    } catch (error) {
        console.log(error);
        message.channel.send(`Something went wrong (${error})`);
    }

});

// last line of the file
client.login('ODY5OTAzMDA3OTUxNzU3MzYy.GAT3YB.BbrFHSAH_0WqR0Q7wdo3bRvo2sI_kHTozO94s4');
