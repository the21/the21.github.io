define(['gamejs', 'modules/globals', 'modules/helpers/utils'], function(gamejs, globals, utils) {
    /*
     * In this module we implement Enemy, the base class for all the monsters.
     */

    /*
     * Enemy.
     */
    var Enemy = function(level) {
        Enemy.superConstructor.apply(this, arguments);
        this.level = level;
        this.life = 1;
    };
    gamejs.utils.objects.extend(Enemy, gamejs.sprite.Sprite);

    Enemy.prototype.canShoot = function() {
        return false;
    };

    Enemy.prototype.canGetDamage = function() {
        return !utils.outOfScreen(this.rect.topleft, this.image.getSize());  // do not hurt the ones out of the screen
    };

    Enemy.prototype.shoot = function() {
        return null;
    };

    Enemy.prototype.getDamage = function(damage) {
        this.life -= damage;
        if (this.life <= 0) {
            this.kill();  // you dead, dude
            return this.killScore || globals.game.killScore;
        }
        return 0; // score
    };

    Enemy.prototype.setInitialPosition = function() {
        this.rect.left = Math.random() * globals.game.screenSize[0] + globals.game.screenSize[0] + 100;
        this.rect.top  = Math.random() * globals.game.screenSize[1];
        return;
    };


    /*
     * ShooterEnemy.
     * This ones can shoot lasers.
     */
    var ShooterEnemy = function(level) {
        ShooterEnemy.superConstructor.apply(this, arguments);
    };
    gamejs.utils.objects.extend(ShooterEnemy, Enemy);

    ShooterEnemy.prototype.canShoot = function(msDuration) {
        if (this.rect.center > globals.game.screenSize[0]) return;
        this.nextFire -= msDuration;
        return this.nextFire < 0;
    };



    //
    // Return API
    return {
        Enemy: Enemy,
        ShooterEnemy: ShooterEnemy
    };
});
