const Discord = require('discord.js');
const ytdl = require('ytdl-core');

const { YTSearcher } = require('ytsearcher');

const searcher = new YTSearcher({
    key: "AIzaSyCMZgx9vrTu_r4_GPpYKWtLAQ6Ng_R3qMs",
    revealed: true
});

const client = new Discord.Client();

const queue= new Map();

client.on("ready", () => {
    console.log ("I am online!")
})

client.on("message", async(message) => {
    const prefix = '!';

    const serverQueue = queue.get(message.guild.id);

    const args = message.content.slice(prefix.length).trim().split(/ +/g)
    const command = args.shift().toLowerCase();

    switch(command){
        case 'play':
            execute(message, serverQueue);
            break;
        case 'stop':
            stop(message, serverQueue);
            break;
        case 'skip':
            skip(message, serverQueue);
            break;
    }

    async function execute(message, serverQueue){
        let vc = message.member.voice.channel;
        if(!vc){
            return message.channel.send("Join a vc first idiot");
        }else{
            let result = await searcher.search(args.join(" "), { type: "video" })
            const songInfo = await ytdl.getInfo(result.first.url)

            let song = {
                title: songInfo.videoDetails.title,
                url: songInfo.videoDetails.video_url
            };

            if(!serverQueue){
                const queueConstructor = {
                    txtChannel: message.channel,
                    vChannel: vc,
                    connection: null,
                    songs: [],
                    volume: 10,
                    playing: true

                };
                queue.set(message.guild.id, queueConstructor);

                queueConstructor.songs.push(song);

                try{
                    let connection = await vc.join();
                    queueConstructor.connection = connection;
                    play(message.guild, queueConstructor.songs[0]);
                }catch (err){
                       console.error(err);
                       queue.delete(message.guild.id);
                       return message.channel.send('Unable to join')
                }
            }else{
                serverQueue.songs.push(song);
                return message.channel.send('A song has been added');
            }
        }
    }
    function play(guild, song){
        const serverQueue = queue.get(guild.id);
        if(!song){
            queue.delete(guild.id);
            return;
        }
        const dispatcher = serverQueue.connection
            .play(ytdl(song.url))
            .on('finish', () =>{
                serverQueue.songs.shift();
                play(guild, serverQueue.songs[0]);
               
            })
            serverQueue.txtChannel.send('Now playing a song')
    }
    function stop (message, serverQueue){
        if(!message.member.voice.channel)
            return message.channel.send("You're not in a vc dumbass")
        serverQueue.songs = [];
        serverQueue.connection.dispatcher.end();
    }
    function skip (message, serverQueue){
        if(!message.member.voice.channel)
            return message.channel.send("You need to be in vc to skip songs idiot");
        if(!serverQueue)
            return message.channel.send("There is nothing to skip stupid");
            serverQueue.connection.dispatcher.end(); 
    }
})

client.login("ODgwOTI4ODg2NDUwNDM0MDc4.YSla9Q.0t-9UdMWDA4ZsKsOFRwfX0YdnYk")