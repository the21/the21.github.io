define(['gamejs', 'modules/ai/characters/enemy', 'modules/globals', 'modules/objects/weapon', 'modules/helpers/utils', 'gamejs/utils/math', 'gamejs/utils/vectors'], function(gamejs, enemy, globals, weapon, utils, $m, $v) {
    /*
     * Explorer ship.
     * Really dumb ships that fire just once in a while and move straight
     * forward in a semi random direction.
     */
    var Explorer = function(level, spriteUrl, speed, life, fireRate) {
        Explorer.superConstructor.apply(this, arguments);

        // init arguments
        spriteUrl = spriteUrl || globals.enemies.images.explorer;
        speed     = speed || utils.randomBetween(0.9, 1, false) * 9;
        life      = life || 3;
        fireRate  = fireRate || 1000 / globals.game.fps * 120;

        // internal
        var orientationVariance = Math.random() * Math.PI / 32 * (Math.random() < 0.5 ? 1 : -1);  // ugh
        this.orientation = 3 * Math.PI / 2 + orientationVariance;

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

        this.killScore = 5;
    };
    gamejs.utils.objects.extend(Explorer, enemy.ShooterEnemy);

    Explorer.prototype.shoot = function() {
        this.nextFire = this.fireRate;
        return new weapon.Laser(
            globals.enemies.laserSprite, this.rect.center, this.orientation,
            { 'speed': this.firingSpeed }
        );
    };

    Explorer.prototype.setInitialPosition = function() {
        enemy.Enemy.prototype.setInitialPosition.call(this);
        var halfScreen = globals.game.screenSize[1] / 2;
        if (this.orientation > 3 * Math.PI / 2 && this.rect.top < halfScreen)
            this.rect.top += halfScreen;
        else if (this.orientation < 3 * Math.PI / 2 && this.rect.top > halfScreen)
            this.rect.top -= halfScreen;
        return;
    };

    Explorer.prototype.update = function(msDuration) {
        this.rect.left += this.speed * Math.cos(this.orientation - Math.PI/2) * ((Math.pow(this.level.speed, 2) / 10) + 1);
        this.rect.top  += this.speed * Math.sin(this.orientation - Math.PI/2) * ((Math.pow(this.level.speed, 2) / 10) + 1);
        if (this.rect.left < -this.image.getSize()[0] || this.rect.top < -this.image.getSize()[1] || this.rect.top > globals.game.screenSize[1])
            this.kill();
    };


    /*
     * HeavyExplorer ship.
     * Slightly more intelligent explorers that fire more often than a simple
     * explorer and move in a semi random direction with a semi random rotation
     * speed.
     */
    var HeavyExplorer = function(level) {
        var args = [].splice.call(arguments, 0);
        HeavyExplorer.superConstructor.apply(this, args.concat([
            globals.enemies.images.heavyexplorer,
            utils.randomBetween(0.9, 1, false) * 6,
            11,
            1000 / globals.game.fps * 40
        ]));
        this.rotation = Math.random() * Math.PI / 2048 * (Math.random() < 0.5 ? 1 : -1);  // ugh;
        this.killScore = 10;
    };
    gamejs.utils.objects.extend(HeavyExplorer, Explorer);

    HeavyExplorer.prototype.update = function(msDuration) {
        this.rect.left += this.speed * Math.cos(this.orientation - Math.PI/2) * ((Math.pow(this.level.speed, 2) / 10) + 1);
        this.rect.top  += this.speed * Math.sin(this.orientation - Math.PI/2) * ((Math.pow(this.level.speed, 2) / 10) + 1);
        if (this.rect.left < -this.image.getSize()[0] || this.rect.top < -this.image.getSize()[1] || this.rect.top > globals.game.screenSize[1])
            this.kill();
        //this.orientation += this.rotation;
        //this.image = gamejs.transform.rotate(this.image, $m.normaliseDegrees($m.degrees(this.orientation + Math.PI)));
        //this.mask  = gamejs.mask.fromSurface(this.image);
    };


    //
    // return API
    return {
        Explorer: Explorer,
        HeavyExplorer: HeavyExplorer
    };
});
