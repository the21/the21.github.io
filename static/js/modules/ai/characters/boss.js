define(['gamejs', 'modules/ai/characters/raiders', 'modules/globals', 'modules/objects/weapon', 'modules/helpers/utils', 'gamejs/utils/math', 'gamejs/utils/vectors'], function(gamejs, raiders, globals, weapon, utils, $m, $v) {
    /*
     * Boss ship.
     * A fast and strong ship that can quickly shoot two lasers at a time and
     * announce its appearance into screen.
     */
    var Boss = function(level, player) {
        var args = [];
        Boss.superConstructor.apply(this, args.concat([
            level,
            globals.enemies.images.boss,
            4,
            1500,
            1000 / globals.game.fps * 15,
            55,
            3 * Math.PI / 2
        ]));

        this.player = player;

        this.completeLife = this.life;
        this.entering = true;
        this.times = {  // acts as a set of `constants'
            direction: 2000,
            jump: null,
            jumpGap: 1500
        };
        this.changeDirection = this.lastChangeDirection = this.times.direction;

        // jumping
        this.makeJump = this.lastMakeJump = 0;
        this.jumping = false;
        this.lockedCenter = this.rect.center;

        this.direction = utils.randomBetween(0, 1) ? 1 : -1;
        this.appearing = 0;
        this.killScore = 5000;
    };
    gamejs.utils.objects.extend(Boss, raiders.HeavyRaider);

    Boss.prototype.canGetDamage = function() {
        return !this.jumping && raiders.HeavyRaider.prototype.canGetDamage.call(this);
    };

    Boss.prototype.canShoot = function(msDuration) {
        if (this.rect.center > globals.game.screenSize[0] || this.appearing > 0 || this.entering || this.jumping) return false;
        this.nextFire -= msDuration;
        return this.nextFire < 0;
    };

    Boss.prototype.draw = function (surface) {
        if (this.jumping) {
            if (this.jumpingAnimation > 0) {
                // draw the fade away circle
                var percentage = this.jumpingAnimation / 500,
                    radius     = 70 * (500 - this.jumpingAnimation) / 100 + 1,
                    fadeAwayCircle = new gamejs.Surface([radius * 2, radius * 2]);
                gamejs.draw.circle(fadeAwayCircle, '#FFFFFF', [radius, radius], radius);
                fadeAwayCircle.setAlpha(1 - percentage);
                surface.blit(fadeAwayCircle, $v.add(this.lockedCenter, [-radius, -radius]));
            } else if (this.jumpingGap > 0)
                return;  // nothing
            else if (this.appearing > 0) {
                var appearingCircle = new gamejs.Surface([140, 140]),
                    deviation       = this.appearing % 8;
                var positionDeviation = [0, 8, 16, 8, 0, -8, -16, -8][deviation],
                    alphaDeviation    = deviation % 2 === 0 ? 0.25 : 0.9;

                gamejs.draw.circle(appearingCircle, '#AEB762', [70, 70], 70);
                appearingCircle.setAlpha(alphaDeviation);

                surface.blit(appearingCircle, $v.add(this.rect.center, [-70, -70 + positionDeviation]));
            }
        } else
            surface.blit(this.image, this.rect);
        return;
    };

    Boss.prototype.jump = function () {
        this.jumping = true;
        this.jumpingAnimation = 500;
        this.jumpingGap = this.times.jumpGap * (Math.random() * 0.75);
        this.appearing = 2000;
        this.lockedCenter = this.rect.center;

        // change orientation
        this.orientation += Math.PI;
        this.image        = gamejs.transform.rotate(this.image, 180);
        this.mask         = gamejs.mask.fromSurface(this.image);
        // change the boss' position and direction
        if (this.rect.left > globals.game.screenSize[0] / 2)
            this.rect.left = 0;
        else
            this.rect.left = globals.game.screenSize[0] - 120;
        this.rect.top     = Math.random() * (globals.game.screenSize[1] - this.image.getSize()[1]);
    };

    Boss.prototype.setInitialPosition = function () {
        this.rect.left = globals.game.screenSize[0] + 20;
        this.rect.top  = globals.game.screenSize[1] / 2 - this.image.getSize()[1] / 2;
        return;
    };

    Boss.prototype.shoot = function () {
        this.nextFire = this.fireRate;

        var position = $v.add(this.rect.center, [0, this.firingSide === 0 ? this.fireDeviation : -this.fireDeviation]);

        this.firingSide = (this.firingSide + 1) % 2;

        return new weapon.Laser(
            globals.enemies.laserSprite, position, this.orientation,
            { 'speed': this.firingSpeed, 'life': 10 }
        );
    };

    Boss.prototype.update = function (msDuration) {
        if (this.entering) {
            this.rect.left -= 2;
            if (this.rect.left <= globals.game.screenSize[0] - 120) {
                this.rect.left = globals.game.screenSize[0] - 120;
                this.entering = false;
                this.appearing  = 0;
            }
            return;
        }

        // jumping
        if (this.jumping) {
            if (this.jumpingAnimation > 0)
                this.jumpingAnimation -= msDuration;
            else if (this.jumpingGap > 0)
                 this.jumpingGap -= msDuration;
            else if (this.appearing > 0)
                this.appearing -= msDuration;
            else
                this.jumping = false;
            return;
        }

        // movements.
        this.rect.top += this.direction * this.speed  * ((Math.pow(this.level.speed, 2) / 10) + 1);
        var forceChangeDirection = this.rect.top < 0 || this.rect.top > globals.game.screenSize[1] - this.image.getSize()[1];
        if (forceChangeDirection) this.changeDirection = 0;

        this.changeDirection -= msDuration;
        if (this.changeDirection <= 0) {
            if (Math.random() < 0.75 || forceChangeDirection) {  // change direction
                this.direction *= -1;
                this.changeDirection = this.lastChangeDirection = this.times.direction;
            } else {
                this.changeDirection = this.lastChangeDirection / 2;
                this.lastChangeDirection = this.changeDirection;
            }
        }

        if (this.times.jump !== null) {
            this.makeJump -= msDuration;
            if (this.makeJump <= 0)
                if (Math.random() < 0.8) {
                    this.jump();
                    this.makeJump = this.lastMakeJump = this.times.jump;
                } else
                    this.makeJump = this.lastMakeJump = this.lastMakeJump / 2;
        }

        // life changing
        if (this.life < this.completeLife * 3 / 4) {
            this.speed = 6;
            this.fireRate = 1000 / globals.game.fps * 12;
        }
        if (this.life < this.completeLife / 2) {
            this.speed = 8;
            this.times.direction = 1600;
            this.times.jump = 8000;
            this.fireRate = 1000 / globals.game.fps * 9;
        }
        if (this.life < this.completeLife / 4) {
            this.speed = 12;
            this.times.direction = 1200;
            this.times.jump = 3000;
            this.fireRate = 1000 / globals.game.fps * 6;
        }

    };


    //
    // Return API
    return { Boss: Boss };
});
