/*Global variables */
var voiceChannel;
var savedConn;
var songQueueURL=[]; // For song URL
var songQueueTitle=[]; // For song Title
var currentPlaying;
var dispatcher;
/*
	We use the googleapis module in order to access the
	Youtube API and after authentication we can use their
	feature and functions.
*/
var {google} =require('googleapis');
var youtubeAPI=google.youtube({
	version:'v3',
	auth:'AIzaSyAwTEkSthr7S6OTApne9Jd9Qysfq3hVD5I'
});

console.log("Youtube API authentication has been made");

/*
	We usee the discord.js in order to access the API of the
	discord so we can use it to setup the music bot we want.
*/
var Discord=require('discord.js');
var client=new Discord.Client();
var ytdl=require('ytdl-core'); //To fetch the videos from youtube


/* We login to the discord service with the given token */
client.login('NDg5MDY1ODMwNDQxODExOTc5.DnqSdQ.i4Mb-CzKSLunqsepDhhSGBV9k_0');

/* When the bot is ready */
client.on('ready',()=>{
	console.log("Bot is active as "+client.user.tag+"!");
});

/* We print out the manual for our bot */
client.on('message',(message)=>{
	if(message.content==='help'){
		const embed = new Discord.RichEmbed()
		.setTitle("List of Commands: ")
		.setColor(0x00AE86)
		.setDescription("All the commands should start with ! ")
		.addField("play [SONG]","Plays a song with the given name.",false) //Done
		.addField("disconnect","Disconnect the bot from the voice channel it is in.",false) // Done
		.addField("np","Shows what song the bot is currently playing.",false) //Done
		.addField("skip","Skips the currently playing song.",false) //Done
		.addField("remove [NUMBER OF SONG]","Removes a certain entry from the queue.",false)
		.addField("join","Summons the bot to your voice channel.",false) // Done
		.addField("pause","Pauses the currently playing track.",false) //Done
		.addField("continue","Continue the currently playling track.",false) //Done
		.addField("volume [0-1]","Check or change the current volume.",false) //Done
		.addField("queue","View the queue.",false) // Done
		.addField("add [SONG]","Add a song to playlist",false) // Done
		message.channel.send({embed});

	}
});


/* Summons the bot to your voice channel */
client.on('message',(message)=>{
	if(message.content==='!join'){
		if(message.member.voiceChannel){

			/* Save globally the voice channel */
			voiceChannel=message.member.voiceChannel;

			voiceChannel.join()
			.then(connection =>{
				/* Save the connection globally */
				savedConn=connection;
				const embed = new Discord.RichEmbed()
				.setTitle("Connection Successfull: ")
				.setColor(0x00AE86)
				.setDescription(client.user.tag+" has joined "+voiceChannel.name);

				/* Send the message */
				message.channel.send({embed});
			});
		}
		else{

			/* Error you are not in a voice Channel */
			const embed = new Discord.RichEmbed()
      .setTitle("Connection Failed: ")
      .setColor(0xB63A3A)
      .setDescription("You should join a voice Channel.");
			message.channel.send({embed});
		}
	}
});

/* Disconnect the bot from the voice channel it is in. */
client.on('message',(message)=>{
	if(message.content==='!disconnect'){
		if(voiceChannel){
			const embed = new Discord.RichEmbed()
      .setTitle("Disconnect : ")
      .setColor(0x00AE86)
      .setDescription(client.user.tag+" left "+voiceChannel.name);
      message.channel.send({embed});
			voiceChannel.leave();
		}
		else{
			const embed = new Discord.RichEmbed()
			.setTitle("Disconnect : ")
      .setColor(0xB63A3A)
      .setDescription(client.user.tag+" is not in a Voice Channel.");
      message.channel.send({embed});
		}
	}
});


/* Add a song to playlist */
client.on('message',(message)=>{
	if(message.content.startsWith('!add')){

		/* Get the name of the song we want to search */
		var splitContent=message.content.split(/\s+/g);
		var theSong="";

		for(var i=0;i<splitContent.length;i++){
			if(i!=0){
				theSong=theSong+splitContent[i]+" ";
			}
		}

		if(theSong){

			/* The search parameters */
			var params={
				type:'video',
				part:'snippet',
				maxResults:'10',
				q:theSong,
			};

			/* Now we search the video */
			youtubeAPI.search.list(params,function(err,data){
				if(err){ console.log(err);}
				else{
					var firstID=data.data.items[0].id.videoId;
      		var tempURL='https://www.youtube.com/watch?v='+firstID;
      		songQueueURL.push(tempURL);
					songQueueTitle.push(data.data.items[0].snippet.title);

					/* We sent that a new song has been added */
					const embed = new Discord.RichEmbed()
      		.setTitle("Adding a Song: ")
      		.setColor(0x00AE86)
      		.setDescription(data.data.items[0].snippet.title+" has been added to the playlist.");
      		message.channel.send({embed});
				}
			});
		}
	}
});


/* View the queue */
client.on('message',(message)=>{
	if(message.content==='!queue'){

		if(songQueueTitle.length!=0){
			var songs="";
			for(var i=0;i<songQueueTitle.length;i++){
				songs=songs+(i+1)+"."+songQueueTitle[i]+"\n";
			}

			const embed = new Discord.RichEmbed()
    	.setTitle("Playlist: ")
    	.setColor(0x00AE86)
    	.setDescription(songs);
    	message.channel.send({embed});
		}
		else{
			const embed = new Discord.RichEmbed()
      .setTitle("Playlist is Empty")
      .setColor(0xB63A3A)
      message.channel.send({embed});
		}
	}
});

/* Shows what song the bot is currently playing. */
client.on('message',(message)=>{
	if(message.content==='!np'){
		if(currentPlaying){
			var currentTitle;
			for(var i=0;i<songQueueURL.length;i++){
				if(currentPlaying === songQueueURL[i]){
					currentTitle=songQueueTitle[i];
				}
			}

			/* Send the current playing */
			const embed = new Discord.RichEmbed()
      .setTitle("Current Playing: ")
      .setColor(0x00AE86)
      .setDescription(currentTitle+" now Playing.");
      message.channel.send({embed});
		}
		else{
 			const embed = new Discord.RichEmbed()
      .setTitle("Nothing playing right now.")
      .setColor(0xB63A3A)
			message.channel.send({embed});
		}
	}
});

/* Plays a song with the given name. */

client.on('message',(message)=>{
	if(message.content==='!play'){

		/* If connection is made */
		if(savedConn){

			if(songQueueURL.length!=0){

				currentPlaying=songQueueURL[0];
				dispatcher=savedConn.playStream(ytdl(currentPlaying,{audioonly:true}));

				/* Dispatcher at the end of the song */
				dispatcher.on('end',()=>{

					/* Remove the current playing */
					var tempArraySong=new Array();
					var tempTitle=new Array();

					for(var i=0;i<songQueueURL.length;i++){
						if(songQueueURL[i]!==currentPlaying){
							tempArraySong.push(songQueueURL[i]);
							tempTitle.push(songQueueTitle[i]);
						}
					}

					songQueueURL=tempArraySong;
					songQueueTitle=tempTitle;

					if(songQueueURL.length=== 0){
						const embed = new Discord.RichEmbed()
      			.setTitle("Playlis is empty.")
      			.setColor(0xB63A3A)
      			message.channel.send({embed});
					}
					else{
						message.channel.send("!play");
					}
				});
			}
			else{
				const embed = new Discord.RichEmbed()
        .setTitle("Playlis is empty.")
        .setColor(0xB63A3A)
        message.channel.send({embed});
			}
		}
		else{
			const embed = new Discord.RichEmbed()
      .setTitle("Invite "+client.user.tag+" to the Voice Channel.")
  		.setColor(0xB63A3A)
      message.channel.send({embed});
		}
	}
});

/* Skip or pause or continue*/
client.on('message',(message)=>{
	if(message.content==='!skip'){
		dispatcher.end();
	}
	else if(message.content==='!pause'){
		dispatcher.pause();
	}
	else if(message.content==='!continue'){
		dispatcher.resume();
	}
});

/* Volume */
client.on('message',(message)=>{
	if(message.content.startsWith('!volume')){

		var splitContent=message.content.split(/\s+/g)

		if(splitContent[1]){
			var number=splitContent[1].trim();

			/* If the volume is out of the limits */
			if(number > 1 || number < 0){
				const embed = new Discord.RichEmbed()
	      .setTitle("The volume should be between 0 and 1")
	  		.setColor(0xB63A3A)
	      message.channel.send({embed});
			}
			else{
				dispatcher.setVolume(number);
				const embed = new Discord.RichEmbed()
				.setTitle("Volume has been set to: "+number)
				.setColor(0x00AE86)
				message.channel.send({embed});
			}
		}
	}
});
