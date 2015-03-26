define(['gamejs', 'modules/globals', 'modules/helpers/utils', 'gamejs/utils/math', 'gamejs/utils/vectors'], function(gamejs, globals, utils, $m, $v) {
    var Powerup = function(center) {
        Powerup.superConstructor.apply(this, arguments);

        this.type = utils.randomBetween(0, 5); // 0: Cloning
                                               // 1: Forking
                                               // 2: Branching
                                               // 3: Pulling
                                               // 4: Pushing
                                               // 5: Stashing
        this.image = gamejs.image.load(globals.powerups.images[this.type]);
        this.rect  = new gamejs.Rect($v.add(center, [-this.image.getSize()[0] / 2, -this.image.getSize()[1] / 2]));
        this.mask  = gamejs.mask.fromSurface(this.image);

        return this;
    };
    gamejs.utils.objects.extend(Powerup, gamejs.sprite.Sprite);

    Powerup.prototype.getType = function() {
        return [
            'cloning',
            'forking',
            'branching',
            'pulling',
            'pushing',
            'stashing'
        ][this.type];
    };

    Powerup.prototype.update = function(msDuration, world) {
        if (world.player.pulling > 0) {
            var angle = $m.normaliseRadians($v.angle([1, 0], $v.subtract(world.player.position, this.rect.topleft)));
            this.rect.left += world.level.speed * 16 * Math.cos(angle);
            this.rect.top  += world.level.speed * 16 * Math.sin(angle);
        } else
            this.rect.left -= world.level.speed * 4;
        return;
    };

    Powerup.prototype.upgrade = function(player) {
        switch (this.type) {
            case 0: return this.clone(player); break;
            case 1: return this.fork(player); break;
            case 2: return this.branch(player); break;
            case 3: return this.pull(player); break;
            case 4: return this.push(player); break;
            case 5: return this.stash(player); break;
        }
    };

    /*
     * Cloning: clones an extra life for the player
     */
    Powerup.prototype.clone = function(player) {
        if (player.lifes < 4) return player.lifes++;
        return;
    };

    /*
     * Forking: more forking player power!
     */
    Powerup.prototype.fork = function(player) {
        if (player.ammoStrength < 5) return player.ammoStrength++;
        return;
    };

    /*
     * Branching: branch player's laser weapons
     */
    Powerup.prototype.branch = function(player) {
        if (player.ammoRatio < 3) return player.ammoRatio++;
        return;
    };

    /*
     * Pulling: now the player will automatically pull other powerups
     */
    Powerup.prototype.pull = function(player) {
        player.pulling = 20000;
        return true;
    };

    /*
     * Pushing: player will automatically push enemies (including lasers) away,
     * for 30 seconds.
     */
    Powerup.prototype.push = function(player) {
        player.pushing = 12000;
        return true;
    };

    /*
     * Stashing: player will stash a really cool misil.
     */
    Powerup.prototype.stash = function(player) {
        player.missileStash++;
        return true;
    };


    //
    // Return API
    return { Powerup: Powerup };
});
