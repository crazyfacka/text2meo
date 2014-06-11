var fs = require('fs');
var http = require('httpsync');
var readline = require('readline');
var lev = require('./lib/levenshtein');

var rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout
});

console.log("###############################");
console.log("# Text2Meo playlist migration #");
console.log("#             by              #");
console.log("#       > crazyfacka <        #");
console.log("###############################");
console.log("");

if(process.argv.length < 3) {
	console.log("Usage: " + process.argv[1].substring(process.argv[1].lastIndexOf("/")+1) + " <filename>");
	rl.close();
	process.exit();
}

function findSong(data, artist, song) {
	var results = data.tracks.results;
	var meoSong = null;
	
	// Increase these values to relax the matching algorithm
	var bigArtistDistance = 9;
	var bigTrackDistance = 20;
	
	//console.log("");
	for(j = 0; j < results.length; j++) {
		var track = results[j];
		//console.log(track.main_artist.name + " - " + track.title);
		//console.log(lev.getEditDistance(artist, track.main_artist.name));
		//console.log(lev.getEditDistance(song, track.title));
		var artistDistance = lev.getEditDistance(artist, track.main_artist.name);
		var trackDistance = lev.getEditDistance(song, track.title);
		if(artistDistance == 0 && trackDistance == 0) {
			meoSong = track.id;
			break;
		} else if(artistDistance == 0 && trackDistance <= bigTrackDistance) {
			bigTrackDistance = trackDistance;
			meoSong = track.id;
		} else if(artistDistance <= bigArtistDistance) {
			if(trackDistance == 0) {
				bigArtistDistance = artistDistance;
				meoSong = track.id;
			} else if(trackDistance <= bigTrackDistance) {
				bigTrackDistance = trackDistance;
				meoSong = track.id;
			}
		}
	}
	
	return meoSong;
}

function buildPlaylist(sid, name, matches) {
	//console.log(sid);
	//console.log(name);
	//console.log(matches);
	
	console.log("");
	console.log("Creating playlist: " + name);
	var req = http.request({
		url: "http://services.sapo.pt/Music/OnDemand/Provider/userv3/" + sid + "/playlists.pt",
		method: "POST"
	});
	
	var playlist = new Object();
	playlist.name = name;
	playlist.description = "";
	playlist.type = 0;
	req.write(JSON.stringify(playlist));
	
	var data = JSON.parse(req.end().data);
	playlist.id = data.playlist_id;
	
	var track = [];
	track[0] = new Object();
	track[0].action = "add";
	track[0].item_type = "track";
	
	for(i = 0; i < matches.length; i++) {
		var req = http.request({
			url: "http://services.sapo.pt/Music/OnDemand/Provider/userv3/" + sid + "/playlists/" + playlist.id + ".pt",
			method: "POST"
		});
		track[0].item_id = matches[i];
		req.write(JSON.stringify(track));
		data = req.end();
		//console.log(data.statusCode == 200 ? "OK" : "NOK");
	}	
}

function parseFile(sid) {
	console.log("# Parsing file " + process.argv[2] + "...");
	var data = fs.readFileSync(process.argv[2], { encoding: "UTF-8" }).split("\n");
	var done = false;
	
	var matches = [];
	var notFoundNames = [];
	var found = 0;
	var notFound = 0;
	
	for(i = 0; i < data.length; i++) {
		var entry = data[i];
		splitChar = "–";
		if(entry.indexOf(splitChar) == -1) {
			splitChar = "-";
		}
	
		var artist = entry.substring(0, entry.indexOf(splitChar)).trim();
		var song = entry.substring(entry.indexOf(splitChar) + 1).trim();
		
		splitChar = "–";
		if(song.indexOf(splitChar) == -1) {
			splitChar = "-";
		}
		var simpleSong = song.indexOf(splitChar) == -1 ? song : song.substring(0, song.indexOf(splitChar)).trim();
		
		//console.log("");
		//console.log("Artist: " + artist);
		//console.log("Song: " + song);
		
		var searchData = http.request({
			url: "http://services.sapo.pt/Music/OnDemand/Provider/apiv3/" + sid + "/find.pt?text=" + encodeURIComponent(artist) + "%20" + encodeURIComponent(simpleSong) + "&page=1&per_page=20&what=tracks",
			method: "GET"
		}).end();
		//console.log(data.data);
		
		var meoSong = findSong(JSON.parse(searchData.data), artist, song);
		if(meoSong != null) {
			//console.log("> Found match!");
			found++;
			matches.push(meoSong);
		} else {
			//console.log("> Match NOT found...");
			notFound++;
			notFoundNames.push(artist + " - " + song);
		}
	}
	
	console.log("");
	console.log("# Found " + found + " song(s) out of " + (found + notFound));
	console.log("Choose your playlist name");
	rl.question("> ", function(ans) {
		buildPlaylist(sid, ans.trim(), matches);
		
		console.log("");
		console.log("# These songs found no match:");
		notFoundNames.forEach(function(entry) {
			console.log(entry);
		});
		
		rl.close();
		console.log("");
		console.log("DONE!");
	});
	
}

console.log("Enter your MEO Music session ID");
rl.question("> ", function(ans) {
	parseFile(ans.trim());
});