define(['underscore', 'gamejs', 'modules/ai/levels', 'modules/objects/player', 'modules/objects/powerups', 'modules/helpers/utils', 'gamejs/utils/vectors'], function(_, gamejs, levels, $p, powerups, utils, $v) {
    /*
     * What the world needs to control:
     * 1. updating levels
     * 2. controlling enemies generation in those levels (how many should be in
     *    screen at a time).
     * 3. powerups. maybe make them depend on the player's life an ammo.
     */

    var World = function(player) {
        this.player = new $p.Player();
        this.currentLevel = 0;
        this.currentTime = 0;
        this.enemies = new gamejs.sprite.Group();
        this.powerups = new gamejs.sprite.Group();
        this.paused = false;
        this.gameOver = false;

        // scoring
        this.score = 0;
        this.distance = 0;
        this.accuracy = [0, 0]; // bullet quota, enemy quota

        this.currentPowerups = [];

        levels.init();
        this.level = levels.shift();
    };

    World.prototype.draw = function(display) {
        this.powerups.draw(display);
        this.player.draw(display);
        this.enemies.draw(display);
    };

    World.prototype.handle = function(event) {
        this.player.handle(event);
        // pause / unpause world
        if (event.type === gamejs.event.KEY_DOWN && event.key === gamejs.event.K_ESC) this.paused = !this.paused;
    };

    World.prototype.update = function(msDuration) {
        var self = this;

        this.currentTime += msDuration;
        if (this.level.isOver(this.currentTime)) {
            this.level.speed += 1;
            levels.push(this.level);
            this.level = levels.shift();

            this.currentLevel += 1;
            this.currentTime = 0;
            // maybe upgrade score.
        }

        // update stuff
        this.level.update(msDuration, this);
        this.player.update(msDuration);
        var bullet = null;
        _.each(this.enemies.sprites(), function(enemy) {
            enemy.update(msDuration);
            if (typeof enemy.canShoot !== 'undefined' && enemy.canShoot(msDuration)) {
                bullet = enemy.shoot();
                if (bullet != null) self.enemies.add(bullet);
            }
        });
        this.powerups.update(msDuration, this);

        // check collisions
        // first powerups
        this.currentPowerups = [];
        var upgraded = false;
        _.each(gamejs.sprite.spriteCollide(this.player, this.powerups, true, gamejs.sprite.collideMask), function(powerup) {
            upgraded = powerup.upgrade(self.player);
            if (upgraded) self.currentPowerups.push(powerup);
            self.score += 1;
        });

        // then everything else
        _.each(gamejs.sprite.groupCollide(this.player.lasers, this.enemies, false, false, gamejs.sprite.collideMask), function(collision) {
            var laser = collision.a,
                enemy = collision.b;
            if (!enemy.canGetDamage()) return;
            laser.kill();
            self.score += enemy.getDamage(laser.strength);
            self.accuracy[1] += self.player.isPushing() ? 0 : 1;

            if (enemy.isDead() && Math.random() < .15) self.powerups.add(new powerups.Powerup(enemy.rect.center));
        });
        _.each(gamejs.sprite.groupCollide(this.player.missiles, this.enemies, false, false), function(collision) {
            var missile = collision.a,
                enemy = collision.b;
            if (!enemy.canGetDamage()) return;
            if (enemy.speedLine !== undefined) { // enemy is a laser, kill it and continue
                enemy.kill();
                return;
            }
            if (!missile.exploded) missile.explote();
            self.score += enemy.getDamage(missile.doDamage($v.distance(missile.rect.center, enemy.rect.center)));
            self.accuracy[1] += 1;

            if (enemy.isDead() && Math.random() < .15) self.powerups.add(new powerups.Powerup(enemy.rect.center));
        });
        if (this.player.isUntouchable()) return;

        _.each(gamejs.sprite.spriteCollide(this.player, this.enemies, false, gamejs.sprite.collideMask), function(enemy) {
            if (!self.player.isPushing()) {
                self.gameOver = self.player.getDamage();
                if (self.gameOver) {
                    // draw final score
                    var accuracy = self.accuracy[0] === 0 ? 0 : self.accuracy[1] / self.accuracy[0];
                    var total = ((self.score + self.distance) * (1 + accuracy)).toFixed(2);
                    postMyResult(Math.ceil(total));
                }

                self.player.ammoRatio -= 1;
                if (self.player.ammoRatio === 0) self.player.ammoRatio = 1;
            }
            enemy.getDamage(20);
        });

        // update score.
        this.distance++;
        this.accuracy[0] += self.player.isPushing() ? 0 : this.player.fired;
    };

    return {
        World: World
    };
});