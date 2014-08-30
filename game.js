

// prevent selection
addEvent(D.body, 'selectstart', function() { return false; });

// init engine and grab stage
var Engine = new GameEngine( D.body ),
	stage = Engine.stage,

	// colors
	$white = Gradient(30,0xf6f8f9,0xe5ebee,0xd7dee3,0xf5f7f9),
	$green = Gradient(40,0x9dd53a,0xa1d54f,0x80c217,0x7cbc0a),
	$red = Color(0xff0000),

	// fonts
	$font1 = [ 24, $white, 0, 4 ],
	$font2 = [ 14, $white, 0, 4 ],
	$font3 = [ 26, $green, 0, 4, 'center' ],
	$font4 = [ 9, 0, 0, 0 ],
	$font5 = [ 12, $white, 0, 4 ],
	$font6 = [ 15, $red, 0, 4 ],

	// game stuff
	currRound = 0,
	gameend = false,
	battleIndex = -1,
	hearts = 3,
	gamescore = 0,
	toFight = null,
	texMob = str2arr('mob mob2'),
	heroTex = [
		str2arr('water water2'),
		str2arr('earth earth2'),
		str2arr('wind wind2'),
		str2arr('fire fire2')
	],
	audiobutton, 
	pausebutton,
	
	i = 0,

	// drag stuff
	drag = null,
	slots = [],

	// enemy stuff
	enemies = [ 0x4096ee, 0x00ff00, 0xf0f9ff, 0xff0000 ],
	hasBoss = false,

	// dmg matrix
	dmg = [
		[ 0.5,   1,   1,   2 ], // water
		[   2, 0.5,   1,   1 ], // earth
		[   1,   1,   1,   1 ], // wind
		[   1,   2,   1, 0.5 ]  // fire
	],

	// scenes
	sceneNames = str2arr('loading main pause gameover tutorial'),
	currScene = sceneNames[0],
	
	bg, mainArea, guiBG, entities, score, wave, waveText, startbutton, heartbox, c, projectile,
	
	laneSprites = [];

// create scenes
for(i = 0; i < 5; i++) {
	W[sceneNames[i]] = new DisplayObjectContainer();
	W[sceneNames[i]].visible = i<1;
	stage.add( W[sceneNames[i]] );
};

// change between scenes
function changeScene( scene, fade, cb ) {
	if(fade) {
		Engine.fadeOutIn(function() { 
			changeScene(scene); 
		}, cb || null, 1500, 200);
	} else if( currScene !== scene ) {
		W[currScene].visible = false;
		currScene = scene;
		W[scene].visible = true;
		if(W[scene].start) W[scene].start();
		Engine.pause = scene === 'pause';
	}
}

// load graphics
ShapeLoader({
	lane:
	[360,50,[25,27,14,18,6,32,9,74,15,97,19,74],[16774018],[2,14596419],[48,27,37,18,29,31,32,70,38,92,42,70],[16774018],[2,14596419],[73,27,63,18,54,31,58,72,64,94,67,72],[16774018],[2,14596419],[98,27,87,18,78,32,82,74,88,97,92,74],[16774018],[2,14596419],[100,46,100,12,53,6,6,12,2,52,7,92,29,92,100,92],[16766285],null],
	start:
	[480,320,[71,7,100,0,100,0,100,50,76,49,76,37,62,38,60,31],["#fff"],null,[24,43,0,44,0,0,0,0,28,11,31,35],["#fff"],null,[16,81,17,76,47,74,81,75,82,80,81,85,48,88,17,86],[11896620],[2,5194264],[100,100,75,100,41,56,21,47,68,36,100,61,100,100,100,100],[16776371],null,[34,33,0,57,0,100,0,100,0,100,100,100,100,100,100,53],[5422930],null,[0,0,0,0,0,0,100,0,100,100,100,100,0,100,0,100],[6864580,13629439],null],
	bg: [460,300,[3,16,6,10,53,6,94,10,98,20,93,24,60,25,7,24],[15262619],null,[0,0,0,0,100,0,100,0,100,100,100,100,0,100,0,100],["#fff"],null],
	earth: [70,60,[24,26,30,30,34,38,29,43,18,45,19,34],[16775485],[1.5,0],[11,21,22,32,16,17,29,20,33,24,28,34,39,19,41,34,41,39,29,40,44,43,30,52,26,51,24,42,24,56,16,50,7,43,20,38,9,41,9,33],[14707049],[1.5,0],[72,27,79,32,83,41,78,45,67,47,68,35],[16775485],[1.5,0],[60,21,71,32,65,17,78,20,82,24,77,34,88,19,90,34,90,39,78,40,95,42,81,53,77,53,73,42,73,56,65,50,56,43,69,38,58,41,58,33],[14707049],[1.5,0],[70,69,72,65,77,66,74,70],["#fff"],[1,"#fff"],[66,75,72,76,79,72,75,65,69,60,66,67],[0],[1.5,0],[42,71,44,67,49,66,47,72],["#fff"],[1,"#fff"],[42,83,38,75,36,67,44,65,51,68,48,76],[0],[1.5,0],[52,89,59,82,66,89,59,81],[0],[1.5,0],[24,15,30,42,26,47,23,51,19,58,12,72,13,58,10,64,13,51,4,66],[3572245],[1.5,0],[16,51,24,41,33,29,50,30,63,29,70,38,77,45,81,59,86,94,47,95,16,95,15,63],["#fff",10092433],[1.5,0],[46,51,66,24,52,34,62,19,46,33,63,9,24,42,44,54],[3572245],[1.5,0],[73,44,71,29,86,39,92,57,82,47,84,52,89,77,78,49],[3572245],[1.5,0]],
	wood: [150,60,[35,95,4,90,84,76,94,89],[4865050],null,[14,50,4,60,85,50,95,60],[7034662],null,[83,32,94,33,85,25,6,34],[7034662],null,[1,17,2,8,56,3,95,7,97,20,96,31,96,44,97,59,99,78,96,93,42,98,4,94,1,81,2,57,4,42,2,30],[13409325,9200184],[1.5,0]],
	water: [70,60,[82,7,92,12,98,24,90,29,78,31,78,17],[16775485],[1.5,7369491],[51,34,51,31,66,13,83,20,85,15,70,15,58,17,48,32],[3223938],[1.5,0],[0,38,23,62,30,71,21,77,0,92,12,73,0,68,12,64],[3223938],[1.5,0],[70,69,72,65,77,66,74,70],["#fff"],[1,"#fff"],[66,75,72,76,79,72,75,65,69,60,66,67],[0],[1.5,0],[42,71,44,67,49,66,47,72],["#fff"],[1,"#fff"],[42,83,38,75,36,67,44,65,51,68,48,76],[0],[1.5,0],[52,89,59,82,66,89,59,81],[0],[1.5,0],[16,51,24,41,33,29,50,30,63,29,72,38,79,45,81,59,86,94,47,95,16,95,15,63],["#fff",7966420],[1.5,0],[40,45,49,32,44,33,33,8,38,33,41,33,32,38,22,18,35,55,13,35,30,59,6,43,18,55,23,60],[3223938],[1.5,0],[59,73,34,11,33,28,24,23,26,36,16,37,18,47,9,45],[14341887],[1,2894643],[71,66,76,59,92,26,85,56,95,54,86,66,94,88,78,68],[3223938],[1.5,0]],
	heart: [25,20,[0,0,25,0,50,0,50,25,50,0,75,0,100,0,100,40,100,80,50,100,0,80,0,40],[16575740,16492257,16615895,16492257],[1.5,0,"#fff"]],
	fire: [70,60,[70,69,72,65,77,66,74,70],["#fff"],[1,"#fff"],[66,75,72,76,79,72,75,65,69,60,66,67],[0],[1.5,0],[42,71,44,67,49,66,47,72],["#fff"],[1,"#fff"],[42,83,38,75,36,67,44,65,51,68,48,76],[0],[1.5,0],[52,89,59,82,66,89,59,81],[0],[1.5,0],[24,31,22,25,21,21,30,30,25,28,42,32,41,24,35,17,46,26,46,21,49,24,56,31,50,10,57,20,62,19,73,34,77,55,71,48,30,36,36,67,32,76,22,82,13,75,9,64,25,76,11,39,19,45,27,44],["#f00"],null,[16,51,24,41,33,29,50,30,63,29,72,38,79,45,81,59,86,94,47,95,16,95,15,63],["#f00"],[1.5,0],[10,65,1,54,9,88,29,84,45,66,40,43,50,28,53,40,56,30,69,44,78,75,79,36,73,15,47,2,46,13,60,35,44,5,26,5,34,18,44,34,30,21,14,13,13,22,25,41,14,41,6,26,8,57,16,65],[16768517],[2,0]],
	wind: [70,60,[27,26,35,22,48,17,66,20,76,24,66,26,57,29,44,28],["#fff"],[2,16775219],[74,71,76,67,81,68,78,72],["#fff"],[1,"#fff"],[70,77,76,78,83,74,79,67,73,62,70,69],[0],[1.5,0],[46,73,48,69,53,68,51,74],["#fff"],[1,"#fff"],[46,85,42,77,40,69,48,67,55,70,52,78],[0],[1.5,0],[56,91,63,84,70,91,63,83],[0],[1.5,0],[19,65,25,63,32,69,25,75,21,75,20,71],[13163232],[1.25,0],[23,79,14,81,6,78,13,72,9,74,7,70,5,65,14,65,2,67,6,54,16,51,25,60,31,67,26,74],[13163232],[1.25,0],[20,53,28,43,37,31,54,32,67,31,74,40,81,47,85,61,90,96,51,97,20,97,19,65],["#fff",14348533],[1.5,0],[90,55,82,59,85,72,90,65],[13163232],[1,0],[75,60,89,48,95,44,98,50,100,56,96,58,100,58,98,65,93,66,98,65,100,73,91,72,75,72,74,71],[13163232],[1.25,0]],
	pause: [40,40,[57,41,58,24,67,21,77,24,78,41,77,82,68,86,59,82],["#fff"],[2,0],[23,47,24,26,33,21,44,24,44,48,44,83,34,86,25,82],["#fff"],[2,0],[0,0,50,0,100,0,100,49,100,100,50,100,0,100,0,49],[16753152,16740355],[2,0]],
	resume: [40,40,[21,52,26,46,67,21,67,26,67,51,67,78,65,82,26,56],["#fff"],[2,0],[0,0,50,0,100,0,100,49,100,100,50,100,0,100,0,49],[16753152,16740355],[2,0]],
	mute: [40,40,[44,46,15,71,20,78,23,79,55,50,82,26,80,20,73,19],["#f00"],[2,0],[68,52,54,34,59,30,63,33,76,54,62,71,56,73,53,71],["#fff"],[2,0],[93,54,65,21,70,17,76,21,99,53,76,86,70,87,65,84],["#fff"],[2,0],[14,53,14,40,18,40,27,40,32,32,39,22,51,50,39,80,33,70,27,63,18,63,14,63],["#fff"],[2,0],[0,0,50,0,100,0,100,49,100,100,50,100,0,100,0,49],[16753152,16740355],[2,0]],
	unmute: [40,40,[68,52,54,34,59,30,63,33,76,54,62,71,56,73,53,71],["#fff"],[2,0],[93,54,65,21,70,17,76,21,99,53,76,86,70,87,65,84],["#fff"],[2,0],[14,53,14,40,18,40,27,40,32,32,39,22,51,50,39,80,33,70,27,63,18,63,14,63],["#fff"],[2,0],[0,0,50,0,100,0,100,49,100,100,50,100,0,100,0,49],[16753152,16740355],[2,0]],
	slot: [50,50,[0,0,0,50,0,100,50,100,100,100,100,50,100,0,50,0],[11896620,8741664],[2,5194264,11046196]],
	wind2: [70,60,[27,23,35,19,48,14,66,17,76,21,66,23,57,26,44,25],["#fff"],[2,16775219],[74,68,76,64,81,65,78,69],["#fff"],[1,"#fff"],[70,74,76,75,83,71,79,64,73,59,70,66],[0],[1.5,0],[46,70,48,66,53,65,51,71],["#fff"],[1,"#fff"],[46,82,42,74,40,66,48,64,55,67,52,75],[0],[1.5,0],[56,88,63,81,70,88,63,80],[0],[1.5,0],[19,62,25,60,32,66,25,72,21,72,20,68],[13163232],[1.25,0],[23,76,15,82,7,83,14,73,10,77,8,75,4,68,13,64,3,70,4,60,16,51,25,57,31,64,26,71],[13163232],[1.25,0],[20,50,28,40,37,28,54,29,67,28,74,37,81,44,85,58,90,93,51,94,20,94,19,62],["#fff",14348533],[1.5,0],[90,52,82,56,85,69,90,62],[13163232],[1,0],[75,57,89,50,99,47,99,56,100,60,94,60,100,61,98,68,93,67,98,67,98,82,88,71,75,69,74,68],[13163232],[1.25,0]],
	fire2: [70,60,[70,65,72,61,77,62,74,66],["#fff"],[1,"#fff"],[66,71,72,72,79,68,75,61,69,56,66,63],[0],[1.5,0],[42,67,44,63,49,62,47,68],["#fff"],[1,"#fff"],[42,79,38,71,36,63,44,61,51,64,48,72],[0],[1.5,0],[52,85,59,78,66,85,59,77],[0],[1.5,0],[27,26,26,20,30,22,30,26,25,24,42,28,41,20,39,12,46,22,46,17,49,20,56,27,50,6,57,16,69,20,73,30,77,51,71,44,30,32,36,63,35,69,22,78,13,71,14,63,25,72,11,32,38,43,25,40],["#f00"],null,[16,47,24,37,33,25,50,26,63,25,72,34,79,41,81,55,86,90,47,91,16,91,15,59],["#f00"],[1.5,0],[10,61,1,45,9,84,29,80,45,62,40,39,50,24,53,36,56,26,69,40,78,71,79,32,73,11,49,2,46,9,60,31,44,1,29,3,34,14,44,30,30,17,19,10,18,18,25,37,14,37,6,19,8,53,16,61],[16768517],[2,0]],
	earth2: [70,60,[24,23,30,27,34,35,29,40,18,42,19,31],[16775485],[1.5,0],[10,17,22,29,15,13,29,16,33,20,28,31,40,15,42,31,42,36,29,37,45,40,30,50,26,49,24,39,24,54,15,48,6,40,20,35,8,38,8,30],[14707049],[1.5,0],[72,24,79,29,83,38,78,42,67,44,68,32],[16775485],[1.5,0],[59,17,71,29,64,13,78,16,82,20,77,31,89,15,91,31,91,36,78,37,96,39,81,51,77,51,73,39,73,54,64,48,55,40,69,35,57,38,57,30],[14707049],[1.5,0],[70,66,72,62,77,63,74,67],["#fff"],[1,"#fff"],[66,72,72,73,79,69,75,62,69,57,66,64],[0],[1.5,0],[42,68,44,64,49,63,47,69],["#fff"],[1,"#fff"],[42,80,38,72,36,64,44,62,51,65,48,73],[0],[1.5,0],[52,86,59,79,66,86,59,78],[0],[1.5,0],[24,12,30,39,26,44,24,51,22,58,20,68,16,56,15,62,13,48,10,60],[3572245],[1.5,0],[16,48,24,38,33,26,50,27,63,26,70,35,77,42,81,56,86,91,47,92,16,92,15,60],["#fff",10092433],[1.5,0],[46,48,66,24,52,31,63,19,46,30,64,9,24,39,44,51],[3572245],[1.5,0],[73,41,71,26,86,36,87,56,82,44,84,49,85,74,78,46],[3572245],[1.5,0]],
	water2: [70,60,[85,9,93,18,99,30,88,33,77,31,77,17],[16775485],[1.5,7369491],[51,31,51,28,64,11,82,20,84,15,70,13,57,15,48,29],[3223938],[1.5,0],[0,45,23,59,30,68,20,76,7,88,13,70,1,70,12,61],[3223938],[1.5,0],[70,66,72,62,77,63,74,67],["#fff"],[1,"#fff"],[66,72,72,73,79,69,75,62,69,57,66,64],[0],[1.5,0],[42,68,44,64,49,63,47,69],["#fff"],[1,"#fff"],[42,80,38,72,36,64,44,62,51,65,48,73],[0],[1.5,0],[52,86,59,79,66,86,59,78],[0],[1.5,0],[16,48,24,38,33,26,50,27,63,26,72,35,79,42,81,56,86,91,47,92,16,92,15,60],["#fff",7966420],[1.5,0],[40,42,49,29,44,30,28,7,38,30,41,30,32,35,19,21,35,52,10,35,30,56,4,45,18,52,23,57],[3223938],[1.5,0],[69,69,31,13,33,25,20,23,26,33,12,37,18,44,7,47],[14341887],[1,2894643],[71,63,76,56,94,28,85,53,94,55,86,63,90,82,78,65],[3223938],[1.5,0]],
	mob: [60,60,[41,36,15,27,42,39,73,26],["#ccc"],null,[28,44,18,34,16,40,15,42,23,48,35,54],[0],null,[54,50,76,42,74,39,73,35,50,48,44,55],[0],null,[33,81,34,72,39,70,49,72,54,80,40,79],[0],null,[55,53,51,59,67,70,70,48],[0],null,[32,53,17,47,21,68,32,60],[0],null,[10,14,12,25,12,65,11,79,10,90,19,91,42,96,78,89,99,80,81,79,78,60,77,29,77,11,44,12],["#fff"],[1.5,0]],
	mob2: [60,60,[35,36,9,27,36,39,67,26],["#ccc"],null,[20,39,9,27,7,34,6,36,15,43,29,50],[0],null,[52,47,76,38,73,34,72,30,47,44,40,52],[0],null,[33,81,34,72,39,70,49,72,54,80,40,79],[0],null,[50,50,46,58,63,71,67,45],[0],null,[30,50,12,43,17,68,30,58],[0],null,[12,15,6,24,12,65,11,79,10,90,19,91,42,96,78,89,99,80,81,79,78,60,71,25,69,11,33,13],["#fff"],[1.5,0]]
});

var ready = function() {

	// start music on game start
	main.start = function() { 
		sound.play('theme',1); 
	};

	// disable music on gameover and show final score
	gameover.start = function() { 
		gameover.get(2).setText( 'Score: ' + gamescore + '\nWave: ' + currRound );
		sound.play(null,1); 
	};

	// loading
	loading.add( new Text("MOKGames.com", $font1, 240, 150, 0.5, 0.5) );
	loading.add( new Text("presents", $font2, 240, 170, 0.5) );
	Engine.fadeInOut( null, function() {
		loading.add(new Sprite('start'),0);
		loading.get(1).setText("Super Cute Bubble Pets\nfrom Hell", $font3);
		loading.get(1).py = 60;
		loading.get(2).setText("click / tap to start");
		loading.get(2).py = 245;
		loading.add( new Text("(c) Sebastian Nette & Genevir Ensomo", $font4, 240, 315, 0.5, 1) );
		Engine.fadeIn(function() { loading.get(0).click = gameStart; }, 2000, 0);
	}, 2000, 1000 );

	// create pause scene
	pause.add( new Sprite(Block(0)) );
	setSize(pause.get(0), 480, 320);
	pause.add( new Text("Game Paused", $font1, 240, 150, 0.5, 0.5) );
	pause.add( new Sprite( 'resume', 470, 10, 1, 0 ) );
	pause.get(2).click = function() { 
		changeScene('main'); 
	};

	// create gameover scene
	gameover.add( new Sprite(Block(0)) );
	setSize(gameover.get(0), 480, 320);
	gameover.add( new Text("Game Over", $font1, 240, 100, 0.5, 0.5) );
	gameover.add( new Text('', $font2, 240, 155, 0.5, 0.5) );
	gameover.add( new Sprite( 'wood', 240, 200, 0.5 ) );
	gameover.add( new Text( "Restart", $font2, 240, 215, 0.5 ) );
	gameover.get(3).click = function() { 
		sound.play('select');
		changeScene('loading'); 
		currRound = 0;
		gameend = false;
		battleIndex = -1;
		dropHeroes();
		setScore(0);
		setHearts(3);
	};

	// tutorial
	bg = new Sprite( 'bg', 10, 10 );
	tutorial.add( bg );

	bg.add( new Text( "TUTORIAL", $font2, 30, 40 ) );
	bg.add( new Text( "Protect your turf against the jellies by commanding\nyour elemental pets.\nIf they reach the end of the lane, you lose 1 Life.\nEach element is weak against itself.\nFire beats Earth, Water beats Fire, Earth beats Water.\nWind is the only neutral element.\nEach 8th round, 1 Life is restored.", null, 30, 90 ) );
	bg.add( new Sprite( 'wood', 450, 275, 1, 1 ) );
	bg.add( new Text( "Start Game", $font2, 430, 258, 1, 1 ) );
	bg.get(2).click = function() {
		sound.play('select');
		changeScene('main',1,nextRound);
	};

	// leave start screen
	function gameStart() {
		sound.play('select');
		changeScene('tutorial');
	};

	// main

	mainArea = new DisplayObjectContainer();
	main.add( mainArea );

	mainArea.add( new Sprite(Block(0x1f659b,480,16), 0, 0 ) );
	mainArea.add( TilingSprite( 't2', 480, 16, 16, 16, 0, 16) );
	mainArea.add( new Sprite(Block(0x93ce18,480,224), 0, 32 ) );
	mainArea.add( TilingSprite( 't1', 480, 16, 16, 16, 0, 256) );
	mainArea.add( new Sprite(Block(0x1f659b,480,16), 0, 272 ) );

	// create lanes
	for(i = 0; i < 3; i++) {
		mainArea.add(laneSprites[i] = new Sprite( 'lane', 480, 16*(3.5+i) + i * 50, 1)); 
	}

	// gui
	guiBG = new Sprite( GradientBox(484,34, Gradient(34,0x111111,0x222222,0x111111), 0, 1), -2, 288 );
	main.add(guiBG);

	// entities
	entities = new DisplayObjectContainer();
	entities.sort = true;
	main.add(entities);

	// score
	score = new Text( "Score: 0", $font5, 10, 10 );
	entities.add( score );

	// wave
	wave = new Sprite( 'wood', 240, 0, 0.5, 1 );
	setSize(wave, 150, 40);
	waveText = new Text( "", $font2, 240, 0, 0.5, 1 );
	entities.add(wave);
	entities.add(waveText);

	// startbutton
	startbutton = new Sprite( 'wood', 240, 10, 0.5, 0 );
	startbutton.add( new Text( "FIGHT!", $font6, -35, startbutton.height/2, 0, 0.5 ) );
	startbutton.click = function() {
		startbutton.visible = false;
		EventManager.enabled = false;
		startBattle();
	};
	startbutton.visible = false;
	entities.add(startbutton);

	// heart container
	heartbox =  new Sprite( GradientBox(100,30, Gradient(30,0xffffff,0xffffff,0xa0a0a0), 5), 382, 32, 0, 1 );
	guiBG.add( heartbox );

	// create heart
	heartbox.add( new Sprite( 'heart', 8, -24 ) );
	heartbox.add( new Sprite( 'heart', 38, -24 ) );
	heartbox.add( new Sprite( 'heart', 68, -24 ) );

	// heroes
	for(i = 0; i < 6; i++) {
		slots[i] = new Sprite( 'slot', i%2 ? 70 : 10, 16*(3.5 + floor(i/2)) + floor(i/2) * 50 );
		mainArea.add( slots[i] );
		slots[i].hero = null;

		// drop handler
		slots[i].mouseup = function() {
			// dragging a hero
			if(drag) {
				// if this slot has a different hero
				if(this.hero && this.hero !== drag) {
					// new hero was in a slot before
					if(drag.slot) {
						// put slot hero to drag hero
						this.hero.px = drag.slot.px + this.hero.width/2;
						this.hero.py = drag.slot.py + this.hero.height/2;
						drag.slot.hero = this.hero;
						this.hero.slot = drag.slot;
					} 
					// hero was never on a slot, old hero to start
					else {
						this.hero.px = this.hero.startx;
						this.hero.py = this.hero.starty;
						this.hero.slot = null;
					}
				} else if(drag.slot) {
					drag.slot.hero = null;
				}
				// set new hero to slot position
				drag.px = this.px + drag.width/2;
				drag.py = this.py + drag.height/2;
				// set this hero to drag
				this.hero = drag;
				// set drag slot to this slot
				drag.slot = this;
				// kill drag
				drag = null;

				checkStart();
			}
		}.bind(slots[i]);
	}

	// add heroes
	for(i = 0; i < 4; i++) {
		(function(tex) {
			var slotbg =  new Sprite( GradientBox(50,16, Gradient(30,0xffffff,0xffffff,0xa0a0a0), 5), i*60+35, 31, 0.5, 1 );
			guiBG.add( slotbg );

			var hero = new MovieClip( tex, i*60+35, 295, 0.5, 0.5 );
			hero.kind = i+0;
			setSize(hero, 50, 43);
			hero.slot = null;
			hero.startx = hero.px;
			hero.starty = hero.py;
			entities.add( hero );

			// drag handler
			hero.mousedown = function() {
				main.events.mouseup();
				drag = hero;
			};
		})(heroTex[i]);
	}

	// move hero on mouse move
	main.mousemove = function(x,y) {
		if(drag) { 
			drag.px = x; 
			drag.py = y;
		} 
	};

	// drop hero on mouseup
	main.mouseup = function() { 
		if(drag) {
			if(drag.slot) { 
				drag.slot.hero = null;
				drag.slot = null;
			}
			drag.px = drag.startx; 
			drag.py = drag.starty; 
			drag = null;
			checkStart();
		} 
	};	

	// pause button
	pausebutton = new Sprite( 'pause', 470, 10, 1 );
	pausebutton.click = function() { changeScene('pause'); };
	main.add( pausebutton );

	// audio button
	if(audioSupport) {
		audiobutton = new MovieClip(str2arr('unmute mute'), 420, 10, 1, 0 );
		audiobutton.play = false;
		audiobutton.click = function() {
			sound.enable(!sound.enabled);
			audiobutton.goTo(sound.enabled ? 0 : 1);
		};
		audiobutton.goTo(sound.enabled ? 0 : 1);
		main.add( audiobutton );
	}

	// enemies
	function nextRound() {
		EventManager.enabled = false;
		hasBoss = false;
		waveText.setText( "Wave " + (++currRound) );
		battleIndex = -1;

		// tween in wave sign
		Tween(-5, 50, 400, function(y) {
			wave.py = y;
			waveText.py = y - 7;
			if(y === 50) {
				spawnWave();
			}
		}, null, 500);
		dropHeroes();
	};

	// action on each enemy
	function eachEnemy(cb) {
		for(i = 0; i < entities.count; i++) {
			if(entities.get(i).name === "enemy") {
				cb(entities.get(i));
			}
		}
	};

	// mob health bars
	function updateHealthbar(enemy) {
		if(!enemy.healthbar) {
			enemy.healthbar = new Sprite( getCanvas(50,8), 0, 65, 0.5);
			enemy.add( enemy.healthbar );
		}

		var ctx = enemy.healthbar.canvas.ctx;
		ctx.fillStyle = '#000';
		ctx.fillRect(0,0,50,8);
		ctx.fillStyle = '#0f0';
		ctx.fillRect(1,1,48/enemy.maxHealth*enemy.health,enemy.maxHealth<4?5:6);
	};

	// spawn enemy
	function spawnEnemy(lane) {
		var kind = rand(4),
			enemy = new MovieClip( texMob, 530, laneSprites[lane].py, 0.5 );

		// check if a boss should spawn
		if(!(currRound%4) && !hasBoss && (rand(2) === 1 || lane === 2)) {

			// check if its 8th wave, restore 1 life if life count below max
			if(!(currRound%8) && hearts < 3) {
				sound.play('powerup');
				setHearts(hearts+1);
			}
			hasBoss = true;
			setSize(enemy, 50, 50);
			enemy.health = kind !== 2 ? 5 : 4;
			enemy.py -= 5;
		} 
		// normal mob
		else {
			setSize(enemy, 40, 40);
			enemy.health = 2;
		}
		enemy.tint = enemies[ kind ];
		enemy.name = "enemy";
		enemy.kind = kind;
		enemy.lane = lane;
		enemy.wave = currRound;
		enemy.startx = enemy.px;
		enemy.starty = enemy.py;
		enemy.maxHealth = enemy.health;
		entities.add( enemy );

		// healthbar
		updateHealthbar(enemy);
	}

	// spawn next wave
	function spawnWave() {
	
		// spawn 1 mob per lane
		for(i = 0; i < 3; i++) {
			spawnEnemy(i+0);
		}

		// animate all mobs, move them to the next spot
		Tween( 0, 90, 1000, function(x) {
			eachEnemy(function(e) {
				e.px = e.startx - x;
				if(x===90) e.startx = e.px;
			});
			if(x===90) {

				// tween out the wave sign
				Tween(50, -5, 400, function(y) {
					wave.py = y;
					waveText.py = y - 7;
					if(y === -5) {
						EventManager.enabled = true;
					}
				}, null, 500);
			}
		});
	};

	// set score
	function setScore( x ) {
		gamescore = x;
		score.setText( "Score: " + x );
	};

	// set lifes
	function setHearts( x ) {
		hearts = x;
		for(var i = 0; i < 3; i++) {
			heartbox.get(i).tint = x > i ? 0xffffff : 0x555555;
		}
		if( x === 0 ) {
			gameend = true;
			EventManager.enabled = true;
			eachEnemy(function(e) { requestAnimationFrame(function() { e.remove() }); });
			changeScene('gameover',1);
		}
	};

	// drop all set heroes
	function dropHeroes() {
		for(i = 0; i < 6; i++) {
			if(slots[i].hero) {
				slots[i].hero.slot = null;
				slots[i].hero.px = slots[i].hero.startx;
				slots[i].hero.py = slots[i].hero.starty;
				slots[i].hero = null;
			}
		}
		if(drag) {
			drag.px = drag.startx;
			drag.py = drag.starty;
			drag = null;
		}
	};

	// check if battle can start
	function checkStart() {
		c = 0;
		for(i = 0; i < 6; i++) {
			if(slots[i].hero) {
				c++;
			}
		}
		startbutton.visible = c === 4;
	};

	// check if enemy mob reached end of lane and didnt die, if yes, reduce lifes
	function checkCondition() {
		if(toFight && toFight.health > 0 && toFight.wave<currRound-2) {
			setHearts(hearts - 1);
			sound.play('damage');
			toFight.remove();
		}
		setTimeout(startBattle,200);
	};

	// little ball 
	projectile = new Sprite(getCanvas(12,12),0,0,0.5,0.5),
	ctx = projectile.canvas.ctx;
	ctx.beginPath();
	ctx.arc(6,6,5,0,PI2,false);
	ctx.fillStyle = '#fff';
	ctx.fill();
	ctx.lineWidth = 2;
	ctx.strokeStyle = '#ccc';
	ctx.stroke();
	projectile.visible=false;
	main.add(projectile);

	// attack enemy
	function attack(a, b) {
		projectile.px = a.px + 30;
		projectile.py = a.py;
		projectile.tint = enemies[a.kind];
		projectile.visible=true;
		sound.play('shoot');

		// animation -> shoot projectile
		Tween(projectile.px, toFight.px, toFight.px, function(x) {
			projectile.px = x;
			if(x===toFight.px) {
				projectile.visible=false;

				// reduce enemy hp
				toFight.health -= dmg[a.kind][toFight.kind];
				sound.play('hit');

				// enemy dead?
				if(toFight.health <= 0) {

					// get some core based on enemy wave and remove enemy
					setScore( gamescore + 10*toFight.wave );
					toFight.remove();

					// if we have a second hero
					if(b) {

						// find next mob in this lane
						findMob(battleIndex);
						if(!toFight) {
							startBattle(); 
							return;
						}
					}
				} 
				// mob didnt die
				else {
					updateHealthbar(toFight);
				}

				// if we have another hero, attack same mob, else, go to next lane
				if(!b) checkCondition();
				else attack(b);
			}
		});
	};

	// go through each lane and find enemy mobs
	function findMob(index) {
		toFight = null;
		eachEnemy(function(e) {
			if((!toFight || toFight.id > e.id) && e.lane === index) {
				toFight = e;
			}
		});
	};

	// start battle
	function startBattle() {
		if(gameend) return;
		battleIndex++;

		// exceed last lane -> new round
		if(battleIndex === 3) {
			nextRound();
			return;
		}

		// find enemy
		findMob(battleIndex);

		// no enemy -> next lane
		if(!toFight) {
			startBattle(); 
			return;
		}

		// make mob jump
		Tween(0, 4, 500, function(x) {
			toFight.py = toFight.starty - x%2 * 10;
			if(x===4) {

				// check if slot has a hero set or not
				if(slots[battleIndex*2+1].hero) {
					attack(slots[battleIndex*2+1].hero, slots[battleIndex*2].hero);
				} else if(slots[battleIndex*2].hero) {
					attack(slots[battleIndex*2].hero);
				} else {
					checkCondition();
				}
			}
		}, 500);
	};

};

// load assets
Texture( 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABYAAAALBAMAAACJ0mBNAAAAIVBMVEUfZZuTzhhOfcsAgwB9uhSQglVAq+uIdUuUkV5rUj52Z0siKmQfAAAARklEQVQI12MQFHR0ERRgAANBR0djRyjbdKppxUIoe2ppRHmzAYSdpqaklKQAYSspMSgogdmEgTEQggHjFGFBQUEo21AQCABi4QpDNO5ZqAAAAABJRU5ErkJggg==', ready, 2, 1, 't' );