import HealthBar from "./HealthBar.js";

class GameScene extends Phaser.Scene {
	constructor(callback) {
		super();
		this.callback = callback;
	
	}

	preload() {    
		try {       
			document.getElementsByClassName("grecaptcha-badge")[0].style.opacity = 0;
		} catch(e) {
			console.log(e);
		}
		this.ready = false;
		this.loadrect = this.add.image(0, 0, "opening").setOrigin(0).setScrollFactor(0, 0).setScale(2).setDepth(200);
  
		const cameraWidth = this.cameras.main.width;
		const cameraHeight = this.cameras.main.height;
	  
		
		this.loadrect.setScale(Math.max(cameraWidth / this.loadrect.width, cameraHeight / this.loadrect.height));
	
		this.loadrect.x = 0 - ((this.loadrect.displayWidth - cameraWidth)/2);
		this.loadtext= this.add.text(this.canvas.width/2, this.canvas.height/2, "Loading...", {fontFamily: "Arial", fontSize: "32px", color: "#ffffff"}).setOrigin(0.5).setScrollFactor(0, 0).setDepth(200);
		this.ping = 0;

	}

	died(data) {
		this.loseSound.play();
		this.children.list.forEach((b) => {
			b.destroy();
		});
		this.dead = true;
		data = Object.assign(data, {name: this.myObj.name, kills: this.myObj.kills, coins: this.myObj.coins});
		this.callback({win:false, data: data});
	}
	win(data) {
		this.winSound.play();
		this.dead = true;  
		data = Object.assign(data, {name: this.myObj.name, kills: this.myObj.kills, coins: this.levels[this.levels.length-1].coins});
		this.callback({win: true, data:data});
	}

	create() {
		var map = 10000;

        this.levels = [];

    
		//recaptcha
		grecaptcha.ready(() =>{
			grecaptcha.execute("6LdVxgYdAAAAAPtvjrXLAzSd2ANyzIkiSqk_yFpt", {action: "join"}).then((thetoken) => {

				this.readyt = true;
				this.openingBgm.stop();
				var config =  {
					mute: false,
					volume: 1,
					rate: 1,
					detune: 0,
					seek: 0,
					loop: false,
					delay: 0
				};
    

				this.coin = this.sound.add("coin", config);
				this.chestOpen = this.sound.add("chestOpen", config);
				this.damage = this.sound.add("damage", config);
				this.hit = this.sound.add("hit", config);
				this.winSound = this.sound.add("winSound", config);
				this.loseSound = this.sound.add("loseSound", config);
    
				this.tps = 0;
				//background
				this.background = this.add.tileSprite(0, 0, this.canvas.width, this.canvas.height, "background").setOrigin(0).setDepth(2);
				this.background.fixedToCamera = true;

				//player 
        
				this.meSword = this.add.image(400, 100, "sword").setScale(0.25).setDepth(50).setAlpha(0.5);
				this.mePlayer = this.add.image(400, 100, "player").setScale(0.25).setDepth(51).setAlpha(0.5);
				this.swordAnim = {go: false, added: 0};
				this.myObj = undefined;




				//killcounter
				try { 
				this.killCount = this.add.rexBBCodeText(15, 10, "Kills: 0", {
					fontFamily: "Georgia, \"Goudy Bookletter 1911\", Times, serif",
				}).setFontSize(40).setDepth(101);
				this.killCount.addImage("coin", {
					key: "coin",
					width: 45,
					height: 45
				});
				this.killCount.addImage("kill", {
					key: "kill",
					width: 45,
					height: 45
				});
				
				this.killCount.setScrollFactor(0);

				//player+fpscounter

					this.playerCount = this.add.text(0, 0, "Players: 0" + (!this.mobile ? "\nFPS: 0\nTPS: 0\nPing: 0 ms":""), {
						fontFamily: "Georgia, \"Goudy Bookletter 1911\", Times, serif",
						align: "right"
					}).setFontSize(20).setDepth(101).setOrigin(1);
					this.playerCount.setScrollFactor(1);

					//leaderboard
					this.leaderboard = this.add.rexBBCodeText(0, 10, "", {
					fontFamily: "Georgia, \"Goudy Bookletter 1911\", Times, serif",
				}).setFontSize(20).setDepth(101);
					
					this.leaderboard.setScrollFactor(0);
				} catch(e) {
					console.log(e);
				}
				//minimap
				const convert = (num, val, newNum) => (newNum * val) / num;
				this.miniMap = {people: [], scaleFactor: convert(1189, 96, this.canvas.width), square: undefined};
				this.miniGraphics = this.add.graphics().setDepth(100);
        
				var padding = 13;
				this.miniMap.scaleFactor = convert(1189, 96, this.canvas.width);
				this.miniGraphics.x = this.canvas.width - ((this.miniMap.scaleFactor * 2) + padding);
				this.miniGraphics.y = this.canvas.height - ((this.miniMap.scaleFactor * 2) + padding);
				this.miniGraphics.lineStyle(5, 0xffff00, 1);
				this.miniGraphics.strokeRoundedRect(0, 0, this.miniMap.scaleFactor * 2,  this.miniMap.scaleFactor * 2, 0);
        
				this.cameras.main.ignore(this.miniGraphics);

				//
				//joystick
				if(this.mobile && this.options.movementMode == "keys") {
					this.joyStick = this.plugins
						.get("rexvirtualjoystickplugin")
						.add(this, {
							x: this.canvas.width / 6,
							y: this.canvas.height - this.canvas.height / 2.5,
							radius: convert(2360, 250, this.canvas.width),
							base: this.add.circle(0, 0, convert(2360, 250, this.canvas.width), 0x888888),
							thumb: this.add.circle(0, 0, convert(2360, 100, this.canvas.width), 0xcccccc)
							// dir: '8dir',   // 'up&down'|0|'left&right'|1|'4dir'|2|'8dir'|3
							// forceMin: 16,
							// enable: true
						});
						this.cameras.main.ignore(this.joyStick.base);
						this.cameras.main.ignore(this.joyStick.thumb);

				}
      
				//bar
				this.meBar = new HealthBar(this, 0, 0, 16, 80);
				this.meBar.bar.setAlpha(0.5);
				this.meBar.bar.setDepth(71);

				//levelbar
				this.lvlBar = new HealthBar(this, 0, 0, 0, 0, true);
				var padding = (this.canvas.width / 2);
				this.lvlBar.x = padding / 2;

				this.lastKill = Date.now();
				this.streak = 0;
				this.killtxts = [];

				this.lvlBar.width = this.canvas.width- padding;
				this.lvlBar.height = this.canvas.height / 30;
				this.lvlBar.y = this.canvas.height - this.lvlBar.height - (this.canvas.height / 40);

				this.lvlBar.draw();

				//coins array
				this.coins = [];
				this.chests = [];
				// this.lastMove = Date.now()

				//enemies array
				this.enemies = [];
				this.dead = false;
				//arrow keys
				var KeyCodes = Phaser.Input.Keyboard.KeyCodes;
				this.cursors = this.input.keyboard.addKeys({
					up: KeyCodes.UP,
					down: KeyCodes.DOWN,
					left: KeyCodes.LEFT,
					right: KeyCodes.RIGHT,
				}, false);

				//lvl text
				this.lvlText = this.add.text(this.canvas.width / 2, this.canvas.height / 5,  "", { fontFamily: "Georgia, \"Goudy Bookletter 1911\", Times, serif" }).setFontSize(convert(1366, 75, this.canvas.width)).setDepth(75).setAlpha(0).setOrigin(0.5);
				this.lvlTextTween = undefined;

				this.lvlState = this.add.text(this.canvas.width / 2, this.lvlBar.y - (this.lvlBar.height),  "", { fontFamily: "Georgia, \"Goudy Bookletter 1911\", Times, serif" }).setFontSize(convert(1366, 50, this.canvas.width)).setDepth(75).setAlpha(1).setOrigin(0.5);
				this.lvlState.y = this.lvlBar.y - (this.lvlState.height / 2);

				//camera follow
				this.cameras.main.setZoom(1);
        
        
				this.UICam = this.cameras.add(this.cameras.main.x, this.cameras.main.y, this.canvas.width, this.canvas.height);
				this.cameras.main.ignore([ this.killCount, this.playerCount, this.leaderboard,this.lvlBar.bar, this.lvlText, this.lvlState ]);
				this.UICam.ignore([this.mePlayer, this.meBar.bar, this.meSword, this.background]);
				this.cameras.main.startFollow(this.mePlayer,true);

				//bushes
				this.bushes = [];
				var locations = [{"x":730,"y":1885,"scale":1.0376209236313056},{"x":925,"y":-320,"scale":1.5186209845008154},{"x":1433,"y":754,"scale":3.330284753416469},{"x":4731,"y":4730,"scale":2.0686243258009513},{"x":-3023,"y":-4707,"scale":0.7038654598544245},{"x":4697,"y":418,"scale":1.802746456554166},{"x":1890,"y":-648,"scale":2.4500834253457233},{"x":2835,"y":2983,"scale":1.9362154580101363},{"x":-3012,"y":4669,"scale":1.546032408451703},{"x":-522,"y":-4917,"scale":3.2978158998596006},{"x":-4547,"y":-3990,"scale":0.9277566244553441},{"x":796,"y":-712,"scale":1.1184998043695427},{"x":-3766,"y":4544,"scale":1.4140888384465091},{"x":4882,"y":-1172,"scale":2.9802609570057004},{"x":-3496,"y":3954,"scale":2.3808287583935375},{"x":-3238,"y":-2996,"scale":2.526057254546086},{"x":-1389,"y":-358,"scale":0.8106953578091867},{"x":-4967,"y":-4055,"scale":3.0097164420138225},{"x":4495,"y":-529,"scale":2.534394803759131},{"x":-1338,"y":1861,"scale":2.928118076148369},{"x":1737,"y":-4743,"scale":2.263077224463025},{"x":-3911,"y":2248,"scale":0.7689489264893516},{"x":4896,"y":-3368,"scale":2.588709259426132},{"x":-3883,"y":-3703,"scale":1.731361865138802},{"x":950,"y":2029,"scale":2.8878029144744146},{"x":-173,"y":829,"scale":1.3048181525137694},{"x":2619,"y":1091,"scale":0.5879937552009757},{"x":-3017,"y":2308,"scale":2.264103933252742},{"x":1246,"y":1595,"scale":1.5130647587630643},{"x":-2598,"y":-262,"scale":3.0282547149681767},{"x":-3123,"y":-1763,"scale":2.0368365078668207},{"x":-684,"y":4420,"scale":2.5159608843125834},{"x":-1526,"y":-4429,"scale":1.0488795535338693},{"x":-1382,"y":1674,"scale":1.729326708118081},{"x":4954,"y":-1326,"scale":1.2051737116831303},{"x":-3769,"y":1367,"scale":3.0269153418946013},{"x":1237,"y":3494,"scale":3.2258158972294297},{"x":1683,"y":-3486,"scale":3.2527072679208078},{"x":419,"y":508,"scale":2.652076728813408},{"x":-4992,"y":2409,"scale":2.762880141675235},{"x":3056,"y":-3543,"scale":2.3900673234419982},{"x":3495,"y":-3043,"scale":1.3521516228090635},{"x":-4388,"y":3200,"scale":2.9916255625674655},{"x":1292,"y":-993,"scale":3.3641794453414664},{"x":1952,"y":2357,"scale":1.1450742110647643},{"x":-4831,"y":1835,"scale":1.2585290364415982},{"x":-1477,"y":-521,"scale":3.240414650997602},{"x":-4884,"y":1193,"scale":1.237036932117828},{"x":-4521,"y":-1972,"scale":1.554328117808823},{"x":1315,"y":3287,"scale":0.8727352911734498},{"x":1150,"y":-1059,"scale":1.335191874076673},{"x":-1293,"y":508,"scale":2.505831529572055},{"x":4333,"y":1306,"scale":2.3411772808523876},{"x":2896,"y":4913,"scale":2.465530835587337},{"x":-634,"y":-4615,"scale":2.1430471830680315},{"x":1355,"y":405,"scale":1.9967528611299323},{"x":3215,"y":-3646,"scale":2.5265313480752716},{"x":-2285,"y":-4338,"scale":2.8433396478871336},{"x":210,"y":4727,"scale":2.796103862725438},{"x":-465,"y":154,"scale":0.6770522495838267},{"x":3621,"y":-739,"scale":1.860257544095416},{"x":4421,"y":288,"scale":3.2011906741552547},{"x":3990,"y":-3216,"scale":0.6708087098641271},{"x":3413,"y":-1356,"scale":3.122881532340258},{"x":-3161,"y":-640,"scale":1.0600690011923222},{"x":3518,"y":411,"scale":1.2594288815012689},{"x":2584,"y":-3716,"scale":0.8464974155777956},{"x":4891,"y":4279,"scale":3.334059910907162},{"x":2550,"y":-1426,"scale":1.871614075133459},{"x":880,"y":-1400,"scale":1.2988510930930697},{"x":2897,"y":692,"scale":0.7811024064504772},{"x":18,"y":-1805,"scale":2.7979346816010358},{"x":4933,"y":-4731,"scale":3.4052415107942737},{"x":-3608,"y":-2643,"scale":3.0182716926485567},{"x":631,"y":3567,"scale":2.048644117075934},{"x":3412,"y":-2901,"scale":1.6173481014877604},{"x":-2965,"y":-3056,"scale":0.7452272417689609},{"x":-4221,"y":1948,"scale":3.0571964273080168},{"x":-2733,"y":-3481,"scale":1.7993863030259765},{"x":418,"y":-170,"scale":2.471839671977092},{"x":-2643,"y":2135,"scale":2.224174416443268},{"x":-3564,"y":-3646,"scale":1.123817873201157},{"x":-2594,"y":-194,"scale":2.8359960938485402},{"x":-3914,"y":-1779,"scale":1.669051229582097},{"x":-1282,"y":3667,"scale":3.397330925497699},{"x":1474,"y":-2638,"scale":3.1244654444686324},{"x":-4909,"y":-1278,"scale":2.4338719734410788},{"x":-3549,"y":2724,"scale":3.013256745783262},{"x":-2411,"y":3431,"scale":1.2631073582763315},{"x":-2421,"y":2356,"scale":1.9414196684081193},{"x":-4426,"y":43,"scale":2.611750089893035},{"x":494,"y":4517,"scale":1.6634604133591617},{"x":-3123,"y":45,"scale":1.2116242240774102},{"x":3297,"y":-3254,"scale":2.098822393550005},{"x":2230,"y":4430,"scale":1.949718190558567},{"x":3917,"y":719,"scale":0.5019871453063103},{"x":4225,"y":-3866,"scale":1.4486156579085072},{"x":113,"y":-3228,"scale":2.383273384336228},{"x":-1466,"y":-725,"scale":2.549875235972383},{"x":2284,"y":-1330,"scale":3.294659747724501}];

				locations.forEach((l,i) => {
          if(i%2==0) return;
					this.bushes.push(this.add.image(l.x, l.y, "bush").setScale(l.scale).setDepth(70));
					this.UICam.ignore(this.bushes[this.bushes.length-1]);
				});
				


				this.input.addPointer(3);
				///resize dynamicly
				const resize = () => {
					if(!this.scene.isActive("game")) return;
					try {

						this.game.scale.resize( this.canvas.width,  this.canvas.height);
						this.lvlText.y = this.canvas.height / 5;
						this.lvlText.x = this.canvas.width  /2;
						if(this.mobile && this.options.movementMode =="keys") {

							this.joyStick.x = this.canvas.width / 8;
							this.joyStick.y = this.canvas.height - this.canvas.height / 2.5;
							this.joyStick.base.radius = convert(2360, 250, this.canvas.width);
							this.joyStick.thumb.radius = convert(2360, 100, this.canvas.width);
							this.joyStick.radius = convert(2360, 250, this.canvas.width);
						}
						
						this.UICam.x = this.cameras.main.x;
						this.UICam.y = this.cameras.main.y;

						this.miniGraphics.clear();
						var padding = 13;
						this.miniMap.scaleFactor = convert(1189, 96, this.canvas.width);
						this.miniGraphics.x = this.canvas.width - ((this.miniMap.scaleFactor * 2) + padding);
						this.miniGraphics.y = this.canvas.height - ((this.miniMap.scaleFactor * 2) + padding);
						this.miniGraphics.lineStyle(5, 0xffff00, 1);
						this.miniGraphics.strokeRoundedRect(0, 0, this.miniMap.scaleFactor * 2,  this.miniMap.scaleFactor * 2, 0);


						this.background.width = this.canvas.width;
						this.background.height =  this.canvas.height;
            
						padding = (this.canvas.width / 2);
						this.lvlBar.x = padding / 2;
                
						this.lvlBar.width = this.canvas.width- padding;
						this.lvlBar.height = this.canvas.height / 30;
						this.lvlBar.y = this.canvas.height - this.lvlBar.height - (this.canvas.height / 40);
						this.lvlBar.draw();

						this.lvlState.x = this.canvas.width / 2;
					
						this.lvlState.setFontSize(convert(1366, 50, this.canvas.width));
						this.lvlState.y = this.lvlBar.y - (this.lvlState.height /2);

						this.playerCount.x = this.miniGraphics.x + (this.miniMap.scaleFactor * 2 );
						this.playerCount.y = this.canvas.height - (this.miniMap.scaleFactor * 2 ) - 17;

						this.lvlText.setFontSize(convert(1366, 75, this.canvas.width));
            
					} catch(e) {
						console.log(e);
					}
				};

				window.addEventListener("resize", resize, true);
				//go packet
				var server = this.scene.get("open").server == "us" ? "https://swordbattle.codergautamyt.repl.co" : "https://swordbattle.herokuapp.com";
				//server = undefined
				this.socket = io(server);
				
				function handleErr(err) {
					document.write("Failed to connect to the server, please try a different server or contact devs.<br>" + err+"<br><br>");
				}
				this.socket.on("connect_error", handleErr);
				this.socket.on("connect_failed",handleErr);

				if(!this.secret) this.socket.emit("go", this.name, thetoken, false, this.options);
				else this.socket.emit("go", this.secret, thetoken, true,this.options);
				//mouse down

				this.input.on("pointerdown", function (pointer) {
					if(this.mobile && this.joyStick &&this.joyStick.pointer && this.joyStick.pointer.id == pointer.id) return;
					if (!this.mouseDown) {
						this.gamePoint = {x: pointer.x, y: pointer.y};
						this.mouseDown = true;
						this.socket.emit("mouseDown", true);

					}
				}, this);
				this.input.on("pointerup", function (pointer) {
            
					if(this.mobile && this.joyStick && this.joyStick.pointer && this.joyStick.pointer.id == pointer.id) return;
					if (this.mouseDown) {
						this.gamePoint = {x: pointer.x, y: pointer.y};
						this.mouseDown = false;
						this.socket.emit("mouseDown", false);
					}
				}, this);
				if(this.mobile) {
					this.gamePoint = {x: 0, y: 0};
					this.input.on("pointermove", (pointer) => {
						if(this.joyStick.pointer && this.joyStick.pointer.id == pointer.id) return;
						this.gamePoint = {x: pointer.x, y: pointer.y};
					});
				}
				this.socket.on("tps", (tps) => {
					this.tps = tps;
					var start = Date.now();
					this.socket.emit( "ping",()=> {
							this.ping = (Date.now() - start);
					});

				});
				this.socket.on("ban", (data) => {
					document.write(data);
				});

				//boundary
				this.graphics = this.add.graphics().setDepth(4);
				var thickness = 5000;
				this.graphics.lineStyle(thickness, 0x006400, 1);

				this.graphics.strokeRoundedRect(-(map/2) - (thickness/ 2), -(map/2) - (thickness/ 2), map + thickness, map + thickness, 0 );

				this.graphics.lineStyle(10, 0xffff00, 1);

				this.graphics.strokeRoundedRect(-(map/2), -(map/2), map, map, 0);

				//server -> client

                this.socket.on("levels", (l)=>this.levels=l);

				const addPlayer = (player) => {
					if (this.enemies.filter(e => e.id === player.id).length > 0) return;
					/* vendors contains the element we're looking for */

					var enemy = {
						id: player.id,
						down: false,
						playerObj: undefined,
						lastTick: Date.now(),
						sword: this.add.image(player.pos.x, player.pos.y, player.skin+"Sword").setScale(0.25).setDepth(49),
						player: this.add.image(player.pos.x, player.pos.y, player.skin+"Player").setScale(0.25).setDepth(49),
						bar: new HealthBar(this, player.pos.x, player.pos.y + 55),
						nameTag: this.add.rexBBCodeText(player.pos.x, player.pos.y - 90, `${player.name}`, {
							fontFamily: "serif",
							fill: player.verified?"#0000FF" :"#000000",
							fontSize: "25px"
						}).setDepth(69).setAlpha(player.verified?1:0.5),
						swordAnim: {go: false, added: 0},
						toAngle: 0,
					};
         
					var factor = (100/(player.scale*100))*1.5;
       
					enemy.sword.angle = Math.atan2(player.mousePos.y - ((player.mousePos.viewport.height) / 2), player.mousePos.x - ((player.mousePos.viewport.width) / 2)) * 180 / Math.PI + 45;
            
            
					enemy.sword.x = enemy.player.x + enemy.player.width / factor * Math.cos(enemy.sword.angle * Math.PI / 180);
					enemy.sword.y = enemy.player.y + enemy.player.width / factor * Math.sin(enemy.sword.angle * Math.PI / 180);
					enemy.bar.bar.setDepth(69);
          
					this.UICam.ignore([enemy.player, enemy.bar.bar, enemy.sword, enemy.nameTag, this.graphics]);
					this.enemies.push(enemy);

					var circle = this.add.circle(0, 0, 10, 0xFF0000);
					this.cameras.main.ignore(circle);
					circle.setDepth(98);
					this.miniMap.people.push(
						{
							id: player.id,
							circle: circle
						}
					);

					//check if player joined 5 seconds ago
					if (Date.now() - player.joinTime < 5000) {
						enemy.player.setAlpha(0.5);
						enemy.sword.setAlpha(0.5);
						enemy.bar.bar.setAlpha(0.5);
						//use a tween to make the player a bit transparent for 5 seconds
						setTimeout(() => {
						this.tweens.add({
							targets: [enemy.player, enemy.sword, enemy.bar.bar],
							alpha: 1,
							duration: 100,
							ease: "Linear",
							repeat: 0,
							yoyo: false
						});
					}, 5000 - (Date.now() - player.joinTime));
					}


				};
				this.removePlayer = (id) => {
					try {
						var enemy = this.enemies.find(enemyPlayer => enemyPlayer.id == id);
        


						//fade out the enemy using tweens
						var fadeOut = this.tweens.add({
							targets: [enemy.player, enemy.nameTag, enemy.bar.bar, enemy.sword],
							alpha: 0,
							duration: 150,
							ease: "Sine2",
							onComplete: () => {
								enemy.player.destroy();
								this.enemies.splice(this.enemies.findIndex(enemy => enemy.id == id), 1);
								enemy.bar.destroy();
								enemy.nameTag.destroy();
								enemy.sword.destroy();
								var miniMapPlayer = this.miniMap.people.find(x => x.id === id);
								miniMapPlayer.circle.destroy();
								this.miniMap.people = this.miniMap.people.filter(p => p.id != id);
							}
						});
								
        
					} catch (e) {
						console.log(e);
					}
				};


				this.socket.on("players", (players) => {
					players.forEach(player => addPlayer(player));

					this.ready = true;
          
					if(!this.ready) {
						this.ready = true;
          
					}
				});
				this.socket.on("new", (player) => {
					addPlayer(player);
					if(!this.ready) {
						this.ready = true;
           
					}
				});
				this.socket.on("me", (player) => {
					if(this.loadrect.visible) this.loadrect.destroy();
					if(this.loadtext.visible) this.loadtext.destroy();
					if(this.levels.length > 0) {

                    var diff = this.levels[player.level-1].coins - this.levels[player.level-1].start;
                    var lvlcoins = player.coins - this.levels[player.level-1].start;
                    this.lvlBar.setLerpValue((lvlcoins / diff)*100);

					this.lvlState.setText("Level: " + player.level +" ("+Math.round((lvlcoins/diff)*100)+"%)");
					if(this.myObj && player.level > this.myObj.level) {

						if(this.lvlTextTween) this.lvlTextTween.stop();

						if(!this.lvlText.data) this.lvlText.setData("x", 0);
						this.lvlText.setData("x", this.lvlText.getData("x")+(player.level-this.myObj.level) );
						this.lvlText.setText("Level up!"+(this.lvlText.getData("x") > 1 ? ` x${this.lvlText.getData("x")}` : ""));

						 var completeCallback = () => {
							this.lvlTextTween = this.tweens.add({
								targets: this.lvlText,
								alpha: 0,
								y: this.canvas.height / 5,
								onComplete: () => this.lvlText.setData("x", 0),
								duration: 300,
								ease: "Power2"
							  }, this);
						};
						this.lvlTextTween = this.tweens.add({
							targets: this.lvlText,
							alpha: 1,
							y: this.canvas.height / 4,
							completeDelay: 1000,
							duration: 500,
							onComplete: completeCallback,
							ease: "Power2"
						  }, this);

					  
					}
					}
					if(this.mePlayer.texture.key+"Player" != player.skin) {
						this.mePlayer.setTexture(player.skin+"Player");
						this.meSword.setTexture(player.skin+"Sword");
					}

					if (!this.myObj) {
						this.mePlayer.x = player.pos.x;
						this.mePlayer.y = player.pos.y;
					} else {
					this.tweens.add({
						targets: this.mePlayer,
						x: player.pos.x,
						y: player.pos.y,
						duration: 300,
						ease: "Power2"
					});
					}
					this.mePlayer.setScale(player.scale);
					this.meBar.maxValue = player.maxHealth;
					this.meBar.setHealth(player.health);
					// if(this.myObj) console.log( this.cameras.main.zoom+" -> "+this.myObj.coins+" -> "+player.scale)

					var show = 1000;
					show += (this.mePlayer.width*this.mePlayer.scale)*5;
					//var oldZoom = this.cameras.main.zoom;
					var newZoom = Math.max(this.scale.width / show, this.scale.height / show);
 					this.cameras.main.setZoom(
						newZoom
					); 
			
					this.meSword.setScale(player.scale);
					  this.background.setTileScale(this.cameras.main.zoom, this.cameras.main.zoom);
					this.background.displayWidth = this.cameras.main.displayWidth;
					this.background.displayHeight = this.cameras.main.displayHeight;

					this.killCount.setText("[img=kill] " + player.kills+"\n[img=coin] "+player.coins);
					this.myObj = player;

					//minimap
					if(!this.miniMap.people.find(x => x.id === player.id)) {
						var circle = this.add.circle(0, 0, 10, 0xFFFFFF);
						this.cameras.main.ignore(circle);
						circle.setDepth(99);
						this.miniMap.people.push(
							{
								id: player.id,
								circle: circle
							}
						);
					}

					var miniMapPlayer = this.miniMap.people.find(x => x.id === player.id);
            
					miniMapPlayer.circle.x = (this.miniGraphics.x + ((player.pos.x / (map/2)) * this.miniMap.scaleFactor))+this.miniMap.scaleFactor;
					miniMapPlayer.circle.y = (this.miniGraphics.y+ ((player.pos.y / (map/2)) * this.miniMap.scaleFactor)) + this.miniMap.scaleFactor;
					miniMapPlayer.circle.radius = player.scale * convert(1280, 15, this.canvas.width);

					function cc(p1x, p1y, r1, p2x, p2y, r2) {
						var a;
						var x;
						var y;
					  
						a = r1 + r2;
						x = p1x - p2x;
						y = p1y - p2y;
					  
						if (a > Math.sqrt((x * x) + (y * y)) && r1 > r2/2) {
						  return true;
						} else {
						  return false;
						}
					  }
					//check if touching bush
					if(this.bushes.filter(x => cc(x.x, x.y, x.displayWidth/2, this.mePlayer.x, this.mePlayer.y, this.mePlayer.displayWidth/2)).length > 0) {
						this.meBar.bar.setAlpha(0.5);
					} else {
						if(this.meBar.bar.alpha != 1) {
							this.meBar.bar.setAlpha(1);
						}
					}

				});
				this.socket.on("player", (player) => {
					//update player
					if (!this.ready) return;
					try {
               
						var enemy = this.enemies.find(enemyPlayer => enemyPlayer.id == player.id);
						if(!enemy) return;

						enemy.lastTick = Date.now();

						enemy.playerObj = player;
						enemy.bar.maxValue = player.maxHealth;
						enemy.bar.setHealth(player.health);

						//update pos
						this.tweens.add({
							targets: enemy.player,
							x: player.pos.x,
							y: player.pos.y,
							duration: 300,
							ease: "Power2"
						});

						//update sword
						var mousePos = player.mousePos;
						enemy.toAngle = Math.atan2(mousePos.y - ((mousePos.viewport.height) / 2), mousePos.x - ((mousePos.viewport.width) / 2)) * 180 / Math.PI + 45;

						enemy.player.setScale(player.scale);
						enemy.sword.setScale(player.scale);
						enemy.down = player.mouseDown;

						//minimap
						var miniMapPlayer = this.miniMap.people.find(x => x.id === player.id);
            
        

						miniMapPlayer.circle.x = (this.miniGraphics.x + ((player.pos.x / (map/2)) * this.miniMap.scaleFactor))+this.miniMap.scaleFactor;
						miniMapPlayer.circle.y = (this.miniGraphics.y+ ((player.pos.y / (map/2)) * this.miniMap.scaleFactor)) + this.miniMap.scaleFactor;
						miniMapPlayer.circle.radius = convert(1280, 15, this.canvas.width) * player.scale;

					} catch (e) {
						console.log(e);
					}
				});
				this.socket.on("playerLeave", this.removePlayer);
				this.socket.on("playerDied", (id, data) => {
				//check if killed by me

				if(this.myObj && this.myObj.id === data.killedBy.id) {
					var enemy = this.enemies.find(enemyPlayer => enemyPlayer.id == id);
					if(enemy && enemy.playerObj) {
					//i killed them!!
						var fontsize = convert(1366, 64, this.canvas.width);
						if(Date.now() - this.lastKill < 2500) {
							this.streak++;
							var txt = "[b]";
							var list = ["Double", "Triple", "Quadra", "Quinta", "Hexta", "Hepta", "Octa", "Nona", "Deca"];
							if(this.streak-1 > list.length) txt += `x${this.streak}`;
							else txt += list[this.streak-1];
							txt += " Kill![/b]";

							this.killtxts.forEach((i) => {
								i.destroy();
							});
							this.killtxts = [];
						} else {

						this.streak = 0;
					var txt = `[b][color=#e82a1f]Killed [/color][color=#0000FF]${enemy.playerObj.name}[/color][/b]`;
						}
					var text = this.add.rexBBCodeText(this.canvas.width/2, this.canvas.height, txt).setOrigin(0.5).setAlpha(0).setFontSize(fontsize);
					text.setData("index", this.killtxts.length);
					this.killtxts.push(text);

						const completeCallback = (text) => {
							this.tweens.add({
								targets: text,
								alpha: 0,
								y: this.canvas.height,
								onComplete: ()=>{
									this.killtxts.slice(text.getData("index"),1);
									text.destroy();
								},
								ease: "Power2",
								duration: 250
							});
						};

					this.tweens.add({
						targets: text,
						alpha: 1,
						y: this.canvas.height - this.canvas.height / 6,
						completeDelay: 250,
						duration: 750,
						onComplete: ()=>completeCallback(text),
						ease: "Bounce"
					  }, this);
					this.cameras.main.ignore(text);
						}
						this.lastKill = Date.now();
				}
				

				this.removePlayer(id);

				});

				this.socket.on("dealHit", (playerId, pPos) => {
					var player = this.enemies.find(enemyPlayer => enemyPlayer.id == playerId);
					if(player) {
						var particles = this.add.particles("hitParticle");

						var emitter = particles.createEmitter({
							
							maxParticles: 5,
							scale: 0.01
						});
						emitter.setPosition(pPos?pPos.x : player.player.x, pPos? pPos.y : player.player.y);
					
						this.UICam.ignore(particles);
						emitter.setSpeed(200);
						particles.setDepth(105);
						emitter.setBlendMode(Phaser.BlendModes.ADD);
					}
					this.hit.play();
				});
				this.socket.on("takeHit", (playerId, pPos) => {
					this.damage.play();
					var particles = this.add.particles("hitParticle");

					var emitter = particles.createEmitter({
						
						maxParticles: 5,
						scale: 0.01
					});
					emitter.setPosition(this.mePlayer.x,this.mePlayer.y);
				
					this.UICam.ignore(particles);
					emitter.setSpeed(200);
					particles.setDepth(105);
					//emitter.setBlendMode(Phaser.BlendModes.ADD);
				});

				//coins

				const addCoin = (coin,start) => {
					if(this.dead) return;
					var anim = true;
					if(!start) {
						start = [coin.pos.x, coin.pos.y];
						anim = false;
					}
					
					this.coins.push(
						{
							id: coin.id,
							item: this.add.image(start[0], start[1], "coin").setScale(coin.size/100).setDepth(20).setAlpha(anim?0:1),
							state: {collected: false, collectedBy: undefined, time: 0}
						}
					);
						if(anim) {
							this.tweens.add({
								targets: this.coins[this.coins.length-1].item,
								alpha: 1,
								x: coin.pos.x,
								y: coin.pos.y,
								duration: 250,
								ease: "Sine2"
							});
						}
					this.UICam.ignore(this.coins[this.coins.length - 1].item);
				};
				

				const addChest = (chest,start) => {
					if(this.dead) return;
					var anim = true;
					if(!start) {
						start = [chest.pos.x, chest.pos.y];
						anim = false;
					}
					
					this.chests.push(
						{
							id: chest.id,
							item: this.add.image(start[0], start[1], "chest").setScale(chest.scale).setDepth(21).setAlpha(anim?0:1).setOrigin(0),
						}
					);
						if(anim) {
							this.tweens.add({
								targets: this.chests[this.chests.length-1].item,
								alpha: 1,
								x: chest.pos.x,
								y: chest.pos.y,
								duration: 250,
								ease: "Sine2"
							});
						}
					this.UICam.ignore(this.chests[this.chests.length - 1].item);
				};

				this.socket.on("coins", (coinsArr) => {
           
					coinsArr.forEach((coin) => {
						if(this.coins.filter(e => e.id == coin.id).length == 0) {
							addCoin(coin);
						}
					});

					var remove = this.coins.filter(e=>coinsArr.filter(b => (e.id == b.id) && (!e.state.collected)).length == 0);
					remove.forEach((coin) => {
               
						coin.item.destroy();
					});
					this.coins = this.coins.filter(e=>coinsArr.filter(b => (e.id == b.id) && (!e.state.collected)).length == 1);
				});

				this.socket.on("coin", (coin, start) => {      
					if(Array.isArray(coin)) {
						if(start) {
						coin.forEach((x) => {
							addCoin(x, start);
						});
					} else {
						coin.forEach((x) => {
							addCoin(x);
						});
					}
					} else {      
						addCoin(coin);
					}
				});


				this.socket.on("chests", (chestsArr) => {
           
					chestsArr.forEach((chest) => {
						if(this.chests.filter(e => e.id == chest.id).length == 0) {
							addChest(chest);
						}
					});

					var remove = this.chests.filter(e=>chestsArr.filter(b => (e.id == b.id)).length == 0);
					remove.forEach((chest) => {
               
						chest.item.destroy();
					});
					this.chests = this.chests.filter(e=>chestsArr.filter(b => (e.id == b.id)).length == 1);
				});

				this.socket.on("chest", (chest, start) => {      
					if(Array.isArray(chest)) {
						if(start) {
						chest.forEach((x) => {
							addChest(x, start);
						});
					} else {
						chest.forEach((x) => {
							addChest(x);
						});
					}
					} else {      
						addChest(chest);
					}
				});

				this.socket.on("youDied", (data) => {
					this.died(data);
				});
				this.socket.on("youWon", (data) => {
					this.win(data);
				});
				this.socket.on("collected", (coinId, playerId, coin) => {
					if(this.myObj && this.myObj.id == playerId) {
						(coin?this.coin:this.chestOpen).play();
					}
					// eslint-disable-next-line semi
					if(this.coins.find(coin => coin.id == coinId)) this.coins.find(coin => coin.id == coinId).state = {collected: true, collectedBy: playerId, time: 0}
					else if(this.chests.find(chest => chest.id == coinId)) this.tweens.add({
						targets: this.chests.find(chest => chest.id == coinId).item,
						alpha: 0,
						duration: 500,
						ease: "Sine2",
						onComplete: (t) => {
							//delete chest
							t.targets[0].destroy();
						}
					});
				
				});

				this.playerCount.x = this.miniGraphics.x + (this.miniMap.scaleFactor * 2 );
				this.playerCount.y = this.canvas.height - (this.miniMap.scaleFactor * 2 ) - 17;


				setTimeout(() => {
						this.tweens.add({
							targets: [this.mePlayer, this.meSword, this.meBar.bar],
							alpha: 1,
							duration: 100,
							ease: "Linear",
							repeat: 0,
							yoyo: false
						});
				},5000);
			});
		});
	}

	update(time, delta) {
		const convert = (num, val, newNum) => (newNum * val) / num;
		if(!this.readyt) return;
try {
        this.lvlBar.update();
} catch(e) {
  console.log("Failed to update level bar");
  console.log(e);
}
       
		var controller = {
			left: false,
			up: false,
			right: false,
			down: false
		};


		var wKey = this.input.keyboard.addKey("W", false);
		var aKey = this.input.keyboard.addKey("A", false);
		var sKey = this.input.keyboard.addKey("S", false);
		var dKey = this.input.keyboard.addKey("D",false);
		
		try {
			this.key = this.mobile && this.joyStick ?  this.joyStick.createCursorKeys() : this.cursors;
			if (this.key.up.isDown || wKey.isDown ) {
				controller.up = true;

			}
			if (this.key.down.isDown || sKey.isDown ) {
				controller.down = true;

			}
			if (this.key.right.isDown || dKey.isDown) {
				controller.right = true;

			}
			if (this.key.left.isDown || aKey.isDown) {
				controller.left = true;

			}
    
			this.socket.emit("move", controller);
		} catch(e) {
			console.log(e);
		}
		// this.lastMove = Date.now()
		//sword 

               
		if(this.meSword) var old = this.meSword.angle;

		if(!this.mobile) var mousePos = this.input;
		else var mousePos = this.gamePoint;

		this.meSword.angle = Math.atan2(mousePos.y - ( this.canvas.height / 2), mousePos.x - (this.canvas.width / 2)) * 180 / Math.PI + 45;
		this.mePlayer.angle = this.meSword.angle + 45 +180;
		//sword animation
		/*
		if (this.mouseDown ) {
			if(this.swordAnim.added <= 0) this.swordAnim.go = true;
		}
		else if(this.swordAnim.added >= 50) this.swordAnim.go = false;
        
        
		if(this.swordAnim.go) {


			var cooldown = (this.myObj ? this.myObj.damageCooldown : 120);
			var increase = (50 / cooldown) * delta;
			if(this.swordAnim.added < 50) this.swordAnim.added += increase;
			this.meSword.angle -= this.swordAnim.added;
		} else if(this.swordAnim.added >0) {
			this.swordAnim.added -= 10;
			this.meSword.angle -= this.swordAnim.added;
		}
		*/
		var cooldown = (this.myObj ? this.myObj.damageCooldown : 120);
		if(this.mouseDown && !this.swordAnim.go && this.swordAnim.added == 0) {
			this.swordAnim.go = true;
	

			this.tweens.addCounter({
				from: 0,
				to: 50,
				duration: cooldown,
				onUpdate:  (tween)=>
				{
					console.log(tween.getValue());
					//  tween.getValue = range between 0 and 360
		
					this.swordAnim.added = tween.getValue();
				
				},
				onComplete: ()=>
				{
					//this.swordAnim.added = 0;
					this.swordAnim.go = false;
				}
			});
		} else if(!this.swordAnim.go && !this.mouseDown && this.swordAnim.added > 0) {
			this.swordAnim.go = true;
	

			this.tweens.addCounter({
				from: 50,
				to: 0,
				duration: cooldown,
				onUpdate:  (tween)=>
				{
					console.log(tween.getValue());
					//  tween.getValue = range between 0 and 360
		
					this.swordAnim.added = tween.getValue();
				
				},
				onComplete: ()=>
				{
					//this.swordAnim.added = 0;
					this.swordAnim.go = false;
				}
			});
		}
		console.log(this.swordAnim.added);
        this.meSword.angle -= this.swordAnim.added;
        
		var mousePos2 = {
			viewport: {
				width: this.canvas.width,
				height: this.canvas.height
			},
			x: mousePos.x,
			y: mousePos.y
		};

		if (this.socket && old && this.meSword.angle != old) this.socket.emit("mousePos", mousePos2);

		var fps = this.sys.game.loop.actualFps;
   
		//var difference = function (a, b) { return Math.abs(a - b); }
		function lerp (start, end, amt){
			return (1-amt)*start+amt*end;
		}
		const clamp = (num, min, max) => Math.min(Math.max(num, min), max);
		function repeat(t, m) {
			return clamp(t - Math.floor(t / m) * m, 0, m);
		}

		function lerpTheta(a, b, t) {
			const dt = repeat(b - a, 360);
			return lerp(a, a + (dt > 180 ? dt - 360 : dt), t);
		}
		this.enemies.forEach(enemy => {
			if(Date.now() - enemy.lastTick > 10000) return this.removePlayer(enemy);
		
			if(enemy.playerObj) var scale = enemy.playerObj.scale;
			else var scale = 0.25;
			enemy.bar.width = (enemy.player.height*scale / 0.9375);
			enemy.bar.height = (enemy.player.height*scale*0.150);
			enemy.bar.x = enemy.player.x  - enemy.bar.width / 2;
			enemy.bar.y = enemy.player.y - (enemy.player.height*scale/1.2);

			enemy.bar.draw();
			try {
				enemy.nameTag.setFontSize(100*scale);
				enemy.nameTag.x = enemy.player.x  - enemy.nameTag.width / 2;
				enemy.nameTag.y = enemy.player.y - (enemy.player.height*scale) - enemy.nameTag.height;
			} catch(e) {
				console.log(e);
			}
			if(enemy.playerObj) {
				var factor = (100/(enemy.playerObj.scale*100))*1.5;
			} else {
				var factor = 6;
			}         enemy.sword.angle = lerpTheta(enemy.sword.angle, enemy.toAngle, 0.5);
			enemy.player.angle = enemy.sword.angle + 45 + 180;

			
		

			if (enemy.down) {
				if(!enemy.swordAnim.added) enemy.swordAnim.added = 0;
				if(enemy.swordAnim.added <= 0)enemy.swordAnim.go = true;
			} else if(enemy.swordAnim.added >= 50) enemy.swordAnim.go = false;

			if(enemy.swordAnim.go && enemy.swordAnim.added < 50) {
				var increase = (50 / enemy.playerObj.damageCooldown) * delta;
				if(enemy.swordAnim.added < 50) enemy.swordAnim.added += increase;
			}

			if(!enemy.swordAnim.go  && enemy.swordAnim.added > 0) {
				enemy.swordAnim.added -= 10;

			}
			enemy.sword.angle -= enemy.swordAnim.added;
               

			enemy.sword.x = enemy.player.x + enemy.player.width / factor * Math.cos(enemy.sword.angle * Math.PI / 180);
			enemy.sword.y = enemy.player.y + enemy.player.width / factor * Math.sin(enemy.sword.angle * Math.PI / 180);


                
		});
 
	
		var myObj = this.myObj;
  
		if(!myObj) myObj = {scale: 0.25};

		this.meBar.width = (this.mePlayer.height*myObj.scale / 0.9375);
		this.meBar.height = (this.mePlayer.height*myObj.scale*0.200);
		this.meBar.x = this.mePlayer.x  - this.meBar.width / 2;
		this.meBar.y = this.mePlayer.y - (this.mePlayer.height*myObj.scale/1.2);
		this.meBar.draw();
		if(this.myObj) { 
			var factor1 = (100/(this.myObj.scale*100))*1.5;
		} else {
			var factor1 = 6;
		}
		this.meSword.x = this.mePlayer.x + this.mePlayer.width / factor1 * Math.cos(this.meSword.angle * Math.PI / 180);
		this.meSword.y = this.mePlayer.y + this.mePlayer.width / factor1 * Math.sin(this.meSword.angle * Math.PI / 180);


        function conv(num) {
			return num>999?parseFloat((num/1000).toFixed(num<10000?2:1))+"k":num;
		}

		//leaderboard
		if(!this.myObj) return;
        
		var enemies = this.enemies.filter(a=>a.hasOwnProperty("playerObj") && a.playerObj);

		enemies.push({playerObj: this.myObj});
		try {
			var sorted = enemies.sort((a,b) => a.playerObj.coins - b.playerObj.coins).reverse();
			var text = "";
			var amIinit = false;
			var limit = this.mobile || this.canvas.height < 550 ? 5 : 10;
			sorted.slice(0,limit).forEach((entry, i) => {
				if(!entry.playerObj) return;
				if(!entry.playerObj.hasOwnProperty("coins")) return console.log(entry.playerObj);
				if(entry.playerObj.id == this.myObj.id) amIinit = true;
				var playerObj = entry.playerObj;
				text += `#${i+1}: ${playerObj.verified? "[color=#0000FF]":""}${playerObj.name}${playerObj.verified? "[/color]":""}- ${conv(playerObj.coins)}\n`;
			});
			if(!amIinit) {
				var myIndex = sorted.findIndex(a=> a.playerObj.id == this.myObj.id);
				text += `...\n#${myIndex+1}: ${this.myObj.verified? "[color=#0000FF]":""}${this.myObj.name}${this.myObj.verified? "[/color]":""}- ${conv(this.myObj.coins)}\n`;
			}

			this.leaderboard.setText(text);
			this.leaderboard.x = this.canvas.width - this.leaderboard.width - 15;

		} catch(e) {
			//we shall try next frame
			console.log(e);
		}
		//playercount
		
		try {
			this.playerCount.setText("Players: " + (Object.keys(this.enemies).length + 1).toString() + (this.mobile ? "" : "\nFPS: " + Math.round(this.sys.game.loop.actualFps)+"\nTPS: "+this.tps+"\nPing: "+this.ping+" ms"));
		} catch(e) {
			console.log(e);
		}
		if(!this.myObj) return;
		const distance = (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1); 
		this.coins.forEach((coin) => {
			if(coin.state.collected) {
				if(coin.state.collectedBy == this.myObj.id) {
					var x = this.mePlayer.x;
					var y = this.mePlayer.y;
				} else {
					try {
						var player = this.enemies.find(el => el.id == coin.state.collectedBy);
                        if(player) {
						var x = player.player.x;
						var y = player.player.y;
                        } else {
                            coin.item.destroy();
                            this.coins = this.coins.filter((el) => el.id != coin.id);
                            return;
                        }
					} catch(e) {
						console.log(e);
						return;
					}
				}
				coin.item.x = lerp(coin.item.x, x, ((6 - (Math.log2(fps) - Math.log2(1.875))) / 10)*2);
				coin.item.y = lerp(coin.item.y, y,(6 - (Math.log2(fps) - Math.log2(1.875))) / 10);
				coin.state.time += 1;
				if(distance(coin.item.x, coin.item.y, x, y) < this.mePlayer.width * this.mePlayer.scale / 3 || coin.state.time > 7) {
					coin.item.destroy();
					this.coins = this.coins.filter((el) => el.id != coin.id);
				}
                
			}
		});

		//background movement
		this.background.setTilePosition(
			((this.cameras.main.scrollX*this.cameras.main.zoom)+(this.mePlayer.x -  (this.cameras.main.scrollX*this.cameras.main.zoom)- (this.canvas.width/2)))
			, ((this.cameras.main.scrollY*this.cameras.main.zoom)+(this.mePlayer.y -  (this.cameras.main.scrollY*this.cameras.main.zoom) - (this.canvas.height/2)))
		);
		this.background.x = this.mePlayer.x - (this.cameras.main.displayWidth / 2);
		this.background.y = this.mePlayer.y- (this.cameras.main.displayHeight/ 2);

		if (this.ready && !this.dead && !this.socket.connected) {
			document.write("<h1>You got disconnected</h1><br><button onclick=\"location.reload()\"><h1>Refresh</h1></button>");
			this.dead = true;
		}
	}
}

export default GameScene;
