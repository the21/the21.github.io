define(['gamejs', 'modules/ai/characters/enemy', 'modules/globals', 'modules/objects/weapon', 'modules/helpers/utils', 'gamejs/utils/math', 'gamejs/utils/vectors'], function(gamejs, enemy, globals, weapon, utils, $m, $v) {
    /*
     * Raider ship.
     * A fast ship that can shoot two lasers at a time.
     */
    var Raider = function(level, spriteUrl, speed, life, fireRate, fireDeviation, orientation) {
        Raider.superConstructor.apply(this, arguments);

        // init arguments
        spriteUrl     = spriteUrl || globals.enemies.images.raider;
        speed         = speed || utils.randomBetween(0.9, 1, false) * 10;
        life          = life || 9;
        fireRate      = fireRate || 1000 / globals.game.fps * 30;
        fireDeviation = fireDeviation || 25;
        orientation   = 3 * Math.PI / 2 + (Math.random() * Math.PI / 64 * (Math.random() < 0.5 ? 1 : -1));  // ugh

        // internal
        this.orientation = orientation;

        // basics...
        this.image = gamejs.transform.rotate(gamejs.image.load(spriteUrl), $m.degrees(this.orientation + Math.PI));
        this.rect  = new gamejs.Rect([0, 0], this.image.getSize());
        this.mask  = gamejs.mask.fromSurface(this.image);

        // this ones might vary according to the level, but are common to every
        // enemy sprite.
        this.speed    = speed;
        this.life     = life;
        this.firingSpeed = 50;  // it may be a good idea to relate this to the enemy's speed.

        // firing
        this.fireRate = fireRate;
        this.nextFire = Math.random() * this.fireRate;
        this.firingSide = 0;  // 0: left; 1: right
        this.fireDeviation = fireDeviation;
        this.killScore = 15;
    };
    gamejs.utils.objects.extend(Raider, enemy.ShooterEnemy);

    Raider.prototype.shoot = function() {
        this.nextFire = this.fireRate;

        var position = $v.add(this.rect.center, [0, this.firingSide === 0 ? this.fireDeviation : -this.fireDeviation]);

        this.firingSide = (this.firingSide + 1) % 2;

        return new weapon.Laser(
            globals.enemies.laserSprite, position, this.orientation,
            { 'speed': this.firingSpeed }
        );
    };

    Raider.prototype.update = function(msDuration) {
        this.rect.left += this.speed * Math.cos(this.orientation - Math.PI/2) * ((Math.pow(this.level.speed, 2) / 10) + 1);
        this.rect.top  += this.speed * Math.sin(this.orientation - Math.PI/2) * ((Math.pow(this.level.speed, 2) / 10) + 1);
        if (this.rect.left < -this.image.getSize()[0] || this.rect.top < -this.image.getSize()[1] || this.rect.top > globals.game.screenSize[1])
            this.kill();
    };


    /*
     * HeavyRaider ship.
     * A fast and strong ship that can quickly shoot two lasers at a time and
     * announce its appearance into screen.
     */
    var HeavyRaider = function(level, spriteUrl, speed, life, fireRate, fireDeviation) {
        var args = [].splice.call(arguments, 0);

        spriteUrl     = spriteUrl || globals.enemies.images.heavyraider;
        speed         = speed || utils.randomBetween(0.9, 1, false) * 10;
        life          = life || 16;
        fireRate      = fireRate || 1000 / globals.game.fps * 25;
        fireDeviation = fireDeviation || 50;

        HeavyRaider.superConstructor.apply(this, args.concat([
            spriteUrl, speed, life, fireRate, fireDeviation
        ]));

        this.appearing = 4000;
        this.killScore = 20;
    };
    gamejs.utils.objects.extend(HeavyRaider, Raider);

    HeavyRaider.prototype.canGetDamage = function() {
        return this.appearing <= 0 && enemy.Enemy.prototype.canGetDamage.call(this);
    };

    HeavyRaider.prototype.canShoot = function(msDuration) {
        if (this.rect.center > globals.game.screenSize[0] || this.appearing) return;
        this.nextFire -= msDuration;
        return this.nextFire < 0;
    };

    HeavyRaider.prototype.draw = function(surface) {
        if (this.appearing) {
            var appearingCircle = new gamejs.Surface([140, 140]),
                deviation       = this.appearing % 8;
            var positionDeviation = [0, 8, 16, 8, 0, -8, -16, -8][deviation],
                alphaDeviation    = deviation % 2 === 0 ? 0.25 : 0.9;

            gamejs.draw.circle(appearingCircle, '#AC3939', [70, 70], 70);
            appearingCircle.setAlpha(alphaDeviation);

            surface.blit(appearingCircle, $v.add(this.rect.center, [-70 + positionDeviation, -70]));
        } else
            surface.blit(this.image, this.rect);
        return;
    };

    HeavyRaider.prototype.setInitialPosition = function() {
        this.rect.left = globals.game.screenSize[0] - Math.random() * 200;
        this.rect.top  = Math.random() * globals.game.screenSize[1];
        return;
    };

    HeavyRaider.prototype.shoot = function() {
        var laser = Raider.prototype.shoot.call(this);
        if (this.firingSide === 1)
            this.nextFire /= 12;
        return laser;
    };

    HeavyRaider.prototype.update = function(msDuration) {
        if (this.appearing) {
            this.appearing -= msDuration;
            if (this.appearing < 0) this.appearing = false;
            return;
        }
        this.rect.left += this.speed * Math.cos(this.orientation - Math.PI/2) * ((Math.pow(this.level.speed, 2) / 10) + 1);
        this.rect.top  += this.speed * Math.sin(this.orientation - Math.PI/2) * ((Math.pow(this.level.speed, 2) / 10) + 1);
        if (this.rect.left < -this.image.getSize()[0] || this.rect.top < -this.image.getSize()[1] || this.rect.top > globals.game.screenSize[1])
            this.kill();
    };


    //
    // Return API
    return {
        Raider: Raider,
        HeavyRaider: HeavyRaider
    };
});
