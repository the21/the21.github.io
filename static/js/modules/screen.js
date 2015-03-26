define(['underscore', 'gamejs', 'modules/globals', 'gamejs/utils/vectors'], function(_, gamejs, globals, $v) {
    var surfaces = {
            fullscreen: new gamejs.Surface(globals.game.screenSize),
            levelDuration: new gamejs.Surface([globals.game.screenSize[0] - 20, 12]),
            lifes: new gamejs.Surface([40 * globals.player.defaultLifes, 27]),
            forkPower: new gamejs.Surface([185, 16]),
            stashing: new gamejs.Surface([100, 71]),
            bossLife: new gamejs.Surface([185, 16])
        },
        texts = {},
        fonts,
        playerHit,
        lifeSprite,
        missileSprite,
        powerups = [];

    /*
     * Draws every little detail in the screen.
     */
    var draw = function(display, world) {
        if (world.gameOver) { // draw the gameover screen
            gamejs.draw.rect(surfaces.fullscreen, '#000000', new gamejs.Rect([0, 0], globals.game.screenSize));
            surfaces.fullscreen.setAlpha(0.3);
            display.blit(surfaces.fullscreen);
            var gameover = fonts.big.render('GAME OVER', '#FFFFFF');
            display.blit(gameover, [globals.game.screenSize[0] / 2 - gameover.getSize()[0] / 2, globals.game.screenSize[1] / 2 - 136]);

            // draw final score
            var accuracy = world.accuracy[0] === 0 ? 0 : world.accuracy[1] / world.accuracy[0];
            var total = ((world.score + world.distance) * (1 + accuracy)).toFixed(2);
            accuracy = accuracy > 1 ? accuracy = 1 : accuracy;

            display.blit(fonts.small.render('Score', '#FFFFFF'), [globals.game.screenSize[0] / 2 - 150, globals.game.screenSize[1] / 2 - 36]);
            display.blit(fonts.small.render('Distance', '#FFFFFF'), [globals.game.screenSize[0] / 2 - 150, globals.game.screenSize[1] / 2]);
            display.blit(fonts.small.render('Accuracy', '#FFFFFF'), [globals.game.screenSize[0] / 2 - 150, globals.game.screenSize[1] / 2 + 36]);
            display.blit(fonts.small.render('TOTAL', '#FFFFFF'), [globals.game.screenSize[0] / 2 - 150, globals.game.screenSize[1] / 2 + 108]);

            display.blit(fonts.small.render(world.score, '#FFFFFF'), [globals.game.screenSize[0] / 2 + 125, globals.game.screenSize[1] / 2 - 36]);
            display.blit(fonts.small.render(world.distance, '#FFFFFF'), [globals.game.screenSize[0] / 2 + 125, globals.game.screenSize[1] / 2]);
            display.blit(fonts.small.render((accuracy * 100).toFixed(2) + '%', '#FFFFFF'), [globals.game.screenSize[0] / 2 + 125, globals.game.screenSize[1] / 2 + 36]);
            display.blit(fonts.small.render(total, '#FFFFFF'), [globals.game.screenSize[0] / 2 + 125, globals.game.screenSize[1] / 2 + 108]);
            return;
        }

        if (world.paused) { // draw the pause screen
            gamejs.draw.rect(surfaces.fullscreen, '#000000', new gamejs.Rect([0, 0], globals.game.screenSize));
            surfaces.fullscreen.setAlpha(0.3);
            display.blit(surfaces.fullscreen);
            // now the instructions
            var pause = fonts.big.render('PAUSE', '#FFFFFF');
            var esc   = fonts.small.render('Press ESC to continue', '#FFFFFF');
            display.blit(pause, [globals.game.screenSize[0] / 2 - pause.getSize()[0] / 2, globals.game.screenSize[1] / 2 - pause.getSize()[1] - 2]);
            display.blit(esc, [globals.game.screenSize[0] / 2 - esc.getSize()[0] / 2, globals.game.screenSize[1] / 2 + 2]);
            return;
        }

        if (world.paused || world.gameOver) return;

        // clear everything
        for (var key in surfaces)
            surfaces[key].clear();

        // lifes
        for (var i = 0; i < world.player.lifes; i++)
            surfaces.lifes.blit(lifeSprite, [i * 40, 0]);

        // level duration
        if (typeof world.level.duration !== 'undefined') {
            gamejs.draw.rect(surfaces.levelDuration, '#000000', new gamejs.Rect([0, 0], surfaces.levelDuration.getSize()));
            gamejs.draw.rect(surfaces.levelDuration, '#FFFFFF', new gamejs.Rect([2, 2], [(world.currentTime * (globals.game.screenSize[0] - 4)) / world.level.duration, surfaces.levelDuration.getSize()[1] - 4]));
            surfaces.levelDuration.setAlpha(0.75);
        }

        // fork power
        surfaces.forkPower.blit(texts.forkPower, [0, 0]);
        gamejs.draw.rect(surfaces.forkPower, '#000000', new gamejs.Rect([85, 2], [100, 12]));
        gamejs.draw.rect(surfaces.forkPower, '#FFFFFF', new gamejs.Rect([87, 4], [world.player.ammoStrength * 96 / 5, 8]));
        surfaces.forkPower.setAlpha(0.5);

        // pushing power
        if (world.player.isPushing()) {
            gamejs.draw.rect(surfaces.fullscreen, '#ffd324', new gamejs.Rect([0, 0], globals.game.screenSize));
            surfaces.fullscreen.setAlpha(0.75);
        }

        // missiles
        surfaces.stashing.blit(missileSprite);
        surfaces.stashing.blit(fonts.mini.render('x ' + world.player.missileStash, '#FFFFFF'), [55, 55]);
        surfaces.stashing.setAlpha(world.player.missileStash > 0 ? 0.25 : 0.75);

        // score
        var score = fonts.small.render(world.score, '#FFFFFF');
        score.setAlpha(0.75);
        display.blit(score, [globals.game.screenSize[0] / 2 - score.getSize()[0] / 2, 10]);

        // hit flash
        if (typeof playerHit != 'undefined') {
            gamejs.draw.rect(surfaces.fullscreen, '#FFFFFF', new gamejs.Rect([0, 0], globals.game.screenSize));
            if (!playerHit)
                surfaces.fullscreen.setAlpha(0.5);
        }

        // new powerups
        var powerPercentage, powerSurface;
        _.each(powerups, function(powerTuple) {
            powerPercentage = 1 - powerTuple[1] / globals.powerups.screenDuration;
            powerSurface = texts[powerTuple[0]];
            powerSurface = gamejs.transform.scale(powerSurface, $v.multiply(powerSurface.getSize(), 1 + powerPercentage));
            powerSurface.setAlpha(powerPercentage);
            display.blit(powerSurface, [globals.game.screenSize[0] / 2 - powerSurface.getSize()[0] / 2, 40]);
        });

        // boss life, if any.
        if (world.level.boss) {
            surfaces.bossLife.blit(texts.bossLife, [0, 0]);
            gamejs.draw.rect(surfaces.bossLife, '#000000', new gamejs.Rect([62, 2], [113, 12]));
            gamejs.draw.rect(surfaces.bossLife, '#FFFFFF', new gamejs.Rect([64, 4], [world.level.boss.life * 109 / world.level.bossLife, 8]));
            surfaces.bossLife.setAlpha(0.25);
        }

        // blit everything in display
        display.blit(surfaces.lifes, [10, 10]);
        display.blit(surfaces.stashing, [10, globals.game.screenSize[1] - surfaces.levelDuration.getSize()[1] - surfaces.forkPower.getSize()[1] - surfaces.stashing.getSize()[1] - 30]);
        display.blit(surfaces.forkPower, [10, globals.game.screenSize[1] - surfaces.levelDuration.getSize()[1] - surfaces.forkPower.getSize()[1] - 20]);
        display.blit(surfaces.levelDuration, [10, globals.game.screenSize[1] - surfaces.levelDuration.getSize()[1] - 10]);
        display.blit(surfaces.bossLife, [globals.game.screenSize[0] - surfaces.bossLife.getSize()[0] - 10, globals.game.screenSize[1] - surfaces.levelDuration.getSize()[1] - surfaces.forkPower.getSize()[1] - 20]);
        display.blit(surfaces.fullscreen);
    };

    /*
     * Init images.
     */
    var init = function() {
        lifeSprite    = gamejs.image.load(globals.player.lifeSprite);
        missileSprite = gamejs.image.load(globals.player.missileSprite);
        fonts = {
            big: new gamejs.font.Font('64px Aller'),
            small: new gamejs.font.Font('24px Aller'),
            mini: new gamejs.font.Font('14px Aller')
        };
        texts = {
            bossLife: fonts.mini.render('Boss Life', '#FFFFFF'),
            forkPower: fonts.mini.render('Fork Power', '#FFFFFF'),
            // powerups
            branching: fonts.small.render('Branch your lasers!', '#FFFFFF'),
            cloning:   fonts.small.render('Clone a new life!', '#FFFFFF'),
            forking:   fonts.small.render('Fork your power!', '#FFFFFF'),
            pulling:   fonts.small.render('Pull new powers!', '#FFFFFF'),
            pushing:   fonts.small.render('Push your enemies!', '#FFFFFF'),
            stashing:  fonts.small.render('Stashing a new Misil!', '#FFFFFF')
        };
    };

    /*
     * Pauses the game and draw the pause screen
     */
    var pause = function(display) {
    };

    /*
     * Unpauses and destroys the pause screen
     */
    var unpause = function(display) {
    };

    var update = function(msDuration, world) {
        if (playerHit)
            playerHit = false;
        else if (playerHit === false)
            playerHit = undefined;
        else
            playerHit = world.player.hit ? true : undefined;
        world.player.hit = false;  // this might not be the best place to set this
        // playerHit -= msDuration;
        // if (playerHit < 0) playerHit = 0;
        // if (playerHit != 0) console.log(playerHit);

        // new powerups
        _.each(world.currentPowerups, function(powerup) {
            powerups.push([powerup.getType(), globals.powerups.screenDuration + msDuration]);
        });
        world.currentPowerups = [];
        if (powerups.length) {
            _.each(powerups, function(powerTuple) {
                powerTuple[1] -= msDuration;
            });
            powerups = _.filter(powerups, function(pt) { return pt[1] > 0;  });
        }
    };

    return {
        draw: draw,
        init: init,
        pause: pause,
        unpause: unpause,
        update: update
    };
});
