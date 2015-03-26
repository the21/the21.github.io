define(function() {
    return {
        game: {
            fps: 36,
            killScore: 5,
            screenSize: [window.innerWidth-20, window.innerHeight-35]
        },
        starsField: {
            image: 'static/images/background/starBackground.png',
            cloud: 'static/images/background/nebula.png',
            starSmall: 'static/images/background/starSmall.png'
        },
        player: {
            sprite: 'static/images/playerSprite.png',
            lifeSprite: 'static/images/life.png',
            laserSprite: 'static/images/laserGreen.png',
            coolLaserSprite: 'static/images/laserYellow.png',
            missileSprite: 'static/images/missile.png',
            speedSprite: 'static/images/background/speedLine.png',
            defaultLifes: 4,
            width: 75,
            height: 183,
            normalStep: 1500,
            damagedStep: 1000,
            maxSpeed: 500,
            circleSpeed: 400
        },
        enemies: {
            images: {
                boss: 'static/images/enemies/boss.png',
                explorer: 'static/images/enemies/explorer.png',
                heavyexplorer: 'static/images/enemies/heavyExplorer.png',
                meteor: 'static/images/enemies/meteorBig.png',
                raider: 'static/images/enemies/raider.png',
                heavyraider: 'static/images/enemies/heavyRaider.png'
            },
            laserSprite: 'static/images/laserRed.png'
        },
        powerups: {
            images: [
                'static/images/powerups/cloning.png',
                'static/images/powerups/forking.png',
                'static/images/powerups/branching.png',
                'static/images/powerups/pulling.png',
                'static/images/powerups/pushing.png',
                'static/images/powerups/stashing.png'
            ],
            screenDuration: 835
        },
        physics: {
            windResistance: 15
        }
    };
});
