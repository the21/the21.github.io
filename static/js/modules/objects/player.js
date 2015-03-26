define(['gamejs', 'modules/objects/weapon', 'modules/globals', 'modules/helpers/sprite_sheet', 'gamejs/utils/math', 'gamejs/utils/vectors'], function(gamejs, weapon, globals, spriteSheet, $m, $v) {

    var BASE_SPRITE_ORIENTATION = [0, -1];
    var LASER_TYPES = [
        {
            // default
        },
        {
            strength: 2
        },
        {
            strength: 3,
            life: 2
        },
        {
            strength: 4,
            life: 2,
            speed: 125
        },
        {
            strength: 5,
            life: 3,
            speed: 125
        }
    ];

    /*
     * Player.
     * This is the main awesome ship controlled by the user.
     * -------------------------------------------------------------------------
     */
    var Player = function() {
        // call superconstructor
        Player.superConstructor.apply(this, arguments);

        var center = [90, globals.game.screenSize[1] / 2];
        var spriteSpecs = {
            width: globals.player.width,
            height: globals.player.height
        };
        var args = [].splice.call(arguments, 0);

        this.spriteSheet = new spriteSheet.SpriteSheet(globals.player.sprite, spriteSpecs);
        this.currentSprite = 0;

        // kinematics
        this.position = this.newPosition = center;
        this.velocity = [0, 0];
        this.orientation = 0;  // 0 orientation means looking down the y axis (-y). in radians
        this.rotation = 0;
        this.steering = {
            linear: [0, 0],
            angular: 0
        };
        this.directions = [0, 0];
        this.seeking = [globals.game.screenSize[0], this.position[1]];

        // game internals
        this.rect = new gamejs.Rect(center, [globals.player.width-15, globals.player.width-15]);
        this.surface = this.spriteSheet.get(this.currentSprite);
        this.mask = gamejs.mask.fromSurface(this.surface);

        // life
        this.lifes = globals.player.defaultLifes;
        this.untouchable = 0;
        this.hit = false;
        this.hitAnimation = undefined;

        // fire
        this.firing = false;
        this.fired  = false;
        this.lasers = new gamejs.sprite.Group();
        this.fireRate = 0;
        this.fireDeviation = 0;
        this.ammoRatio = 1;
        this.ammoStrength = 1;
        this.missiles = new gamejs.sprite.Group();
        this.missileStash = 0;
        this.launchingMissile = false;
        this.missileLaunched = false;
        this.missileRate = globals.game.fps * 20;
        this.missileNext = 0;

        // powers
        this.pulling = 0;
        this.pushing = 0;

        return this;
    };
    gamejs.utils.objects.extend(Player, gamejs.sprite.Sprite);


    Player.prototype.draw = function(display) {
        // set the player opacity (in case of hit)
        if (typeof this.hitAnimation != 'undefined') {
            if (this.hitAnimation)
                this.surface.setAlpha(0);
            else
                this.surface.setAlpha(1);
        }

        // draw pulling / pushing powers
        var radius, pullingCircle, pushingCircle;
        if (this.pulling > 0) {
            radius = 40 * (1 + ((this.pulling % globals.player.circleSpeed) * 1.8 / globals.player.circleSpeed));
            pullingCircle = new gamejs.Surface([radius * 2 + 2, radius * 2 + 2]);
            gamejs.draw.circle(pullingCircle, '#d3d3d3', [radius, radius], radius, 1);
            pullingCircle.setAlpha(1 - (this.pulling % globals.player.circleSpeed) / globals.player.circleSpeed);
            display.blit(pullingCircle, $v.add(this.rect.center, [-radius, -radius]));
        }
        if (this.pushing > 0) {
            radius = 40 * (1 + ((globals.player.circleSpeed - (this.pushing % globals.player.circleSpeed)) * 1.8 / globals.player.circleSpeed));
            pushingCircle = new gamejs.Surface([radius * 2 + 2, radius * 2 + 2]);
            gamejs.draw.circle(pushingCircle, '#ffd324', [radius, radius], radius, 1);
            pushingCircle.setAlpha(1 - (this.pushing % globals.player.circleSpeed) / globals.player.circleSpeed);
            display.blit(pushingCircle, $v.add(this.rect.center, [-radius, -radius]));
        }

        // draw the lasers and missiles
        this.lasers.draw(display);
        this.missiles.draw(display);

        // draw the player.
        display.blit(this.surface, $v.add(this.position, [-this.surface.getSize()[0]/2, -this.surface.getSize()[1]/2]));

        // DEBUG: orientation
        // gamejs.draw.line(display, '#FFFF00', this.position, this.seeking);
        // gamejs.draw.line(display, '#FF0000', this.rect.topleft, this.rect.topright);
        // gamejs.draw.line(display, '#FF0000', this.rect.topleft, this.rect.bottomleft);
        // gamejs.draw.line(display, '#FF0000', this.rect.bottomleft, this.rect.bottomright);
        // gamejs.draw.line(display, '#FF0000', this.rect.bottomright, this.rect.topright);
    };

    Player.prototype.handle = function(event) {
        if (event.type !== gamejs.event.KEY_DOWN && event.type !== gamejs.event.KEY_UP &&
            event.type !== gamejs.event.MOUSE_DOWN && event.type !== gamejs.event.MOUSE_UP &&
            event.type !== gamejs.event.MOUSE_MOTION)
            return;
        if (event.type === gamejs.event.KEY_DOWN && event.key === gamejs.event.K_SPACE) { // new missile!
            this.launchingMissile = true;
        } else if (event.type === gamejs.event.KEY_DOWN) {
            if (event.key === gamejs.event.K_a) this.directions[0] -= 1;
            if (event.key === gamejs.event.K_d) this.directions[0] += 1;
            if (event.key === gamejs.event.K_s) this.directions[1] += 1;
            if (event.key === gamejs.event.K_w) this.directions[1] -= 1;
        } else if (event.type === gamejs.event.KEY_UP) {
            if (event.key === gamejs.event.K_a) this.directions[0] = 0;
            if (event.key === gamejs.event.K_d) this.directions[0] = 0;
            if (event.key === gamejs.event.K_s) this.directions[1] = 0;
            if (event.key === gamejs.event.K_w) this.directions[1] = 0;
        } else if (event.type === gamejs.event.MOUSE_DOWN) {
            this.firing = true;
        } else if (event.type === gamejs.event.MOUSE_UP) {
            this.firing = false;
            this.fireRate = 0;
        } else {  // mouse motion
            this.seeking = event.pos;
        }
        this.steering.linear = $v.multiply(this.directions, globals.player.normalStep);
    };

    Player.prototype.update = function(msDuration) {
        // analyze restrictions. decision making process. kinematic algorithms

        //
        // manage life
        this.untouchable -= msDuration;
        if (this.isUntouchable())
            this.hitAnimation = !this.hitAnimation;
        else
            this.hitAnimation = undefined;

        //
        // powers
        if (this.pulling != 0) this.pulling = this.pulling < 0 ? 0 : this.pulling - msDuration;
        if (this.pushing != 0) this.pushing = this.pushing < 0 ? 0 : this.pushing - msDuration;


        //
        // kinematics
        var time = msDuration / 1000;

        this.velocity     = this.linearMovement(time);
        this.position     = $v.add(this.position, $v.multiply(this.velocity, time));

        //this.rotation     = this.angularMovement(time);
        this.orientation  = this.angularMovement(time);  // radians

        this.rect.center  = this.position;

        // also set the sprite according to the current velocity
        if (this.velocity[1] == 0)
            this.currentSprite = 0;
        else if (this.velocity[1] > 0)
            this.currentSprite = 2;
        else
            this.currentSprite = 1;
        if (this.lifes == 0) this.currentSprite = 3;

        //
        // update the surface
        this.surface = gamejs.transform.rotate(this.spriteSheet.get(this.currentSprite), $m.normaliseDegrees($m.degrees(this.orientation)));
        this.mask = gamejs.mask.fromSurface(this.surface);

        //
        // map restrictions
        if (this.position[0] < 0) {
            this.position[0] = 0;
            this.velocity[0] *= -0.5;
        }
        if (this.position[0] > globals.game.screenSize[0]) {
            this.position[0] = globals.game.screenSize[0];
            this.velocity[0] *= -0.5;
        }
        if (this.position[1] < 0) {
            this.position[1] = 0;
            this.velocity[1] *= -0.5;
        }
        if (this.position[1] > globals.game.screenSize[1]) {
            this.position[1] = globals.game.screenSize[1];
            this.velocity[1] *= -0.5;
        }

        //
        // firing
        this.fired = false;
        if (this.firing || this.isPushing()) {
            this.fireRate -= msDuration;
            if (this.fireRate < 0) {
                this.fireRate = 1000 / globals.game.fps * 2;
                if (this.ammoRatio == 1 && !this.isPushing())
                    this.fireDeviation = 0;
                else if (this.ammoRatio == 2 && !this.isPushing())
                    this.fireDeviation = this.fireDeviation == 0 ? 25 : -this.fireDeviation;
                else {
                    if (this.fireDeviation < 0)
                        this.fireDeviation = 0;
                    else
                        this.fireDeviation = this.fireDeviation == 0 ? 30 : -this.fireDeviation;
                }
                this.lasers.add(
                    new weapon.Laser(
                        this.isPushing() ? globals.player.coolLaserSprite : globals.player.laserSprite,
                        $v.add(this.position, [this.fireDeviation * Math.cos(this.orientation), this.fireDeviation * Math.sin(this.orientation)]),
                        this.orientation,
                        LASER_TYPES[this.ammoStrength-1]
                    )
                );
                this.fired = true;
            }
        } else this.fireRate -= msDuration;
        this.lasers.update();

        //
        // missiles
        this.missileLaunched = false;
        this.missileNext -= msDuration;
        if (this.launchingMissile && this.missileNext < 0 && this.missileStash > 0) {
            this.missileNext = this.missileRate;
            this.missiles.add(
                new weapon.Missile(
                    globals.player.missileSprite, this.position, this.orientation, {speed: 40}
                )
            );
            this.missileStash--;
            this.launchingMissile = false;
        }
        this.missiles.update(msDuration);
    };

    Player.prototype.linearMovement = function(time) {
        var newVelocity = $v.add(this.velocity, $v.multiply(this.steering.linear, time));
        var direction = [0, 0];
        // direction
        if (newVelocity[0] != 0)
            if (newVelocity[0] > 0)
                direction[0] = 1;
        else
            direction[0] = -1;
        if (newVelocity[1] != 0)
            if (newVelocity[1] > 0)
                direction[1] = 1;
        else
            direction[1] = -1;

        // wind resistance
        newVelocity = $v.add(newVelocity, $v.multiply(direction, globals.physics.windResistance * -1));
        newVelocity[0] = (Math.abs(newVelocity[0]) > globals.physics.windResistance * 0.75 ? newVelocity[0] : 0);
        newVelocity[1] = (Math.abs(newVelocity[1]) > globals.physics.windResistance * 0.75 ? newVelocity[1] : 0);

        // max speed
        newVelocity[0] = (Math.abs(newVelocity[0]) > globals.player.maxSpeed ? (globals.player.maxSpeed * direction[0]) : newVelocity[0]);
        newVelocity[1] = (Math.abs(newVelocity[1]) > globals.player.maxSpeed ? (globals.player.maxSpeed * direction[1]) : newVelocity[1]);

        return newVelocity;
    };

    Player.prototype.angularMovement = function(time) {
        return $v.angle(BASE_SPRITE_ORIENTATION, $v.subtract(this.seeking, this.position));
        //return this.steering.angular * time;
    };


    //
    // Helpers
    Player.prototype.getDamage = function() {
        if (this.isUntouchable())
            return;
        this.lifes--;
        this.untouchable = 1000;
        this.hit = true;
        this.hitAnimation = true;
        return (this.lifes < 0);
    };

    Player.prototype.isPushing = function() {
        return this.pushing > 0;
    };

    Player.prototype.isUntouchable = function() {
        return this.untouchable > 0;
    };


    //
    // Return API
    return {
        Player: Player
    };
});
