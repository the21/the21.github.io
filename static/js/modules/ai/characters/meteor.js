define(['gamejs', 'modules/ai/characters/enemy', 'modules/globals', 'modules/helpers/utils', 'gamejs/utils/vectors'], function(gamejs, enemy, globals, utils, $v) {
    /*
     * Meteor.
     */
    var Meteor = function(level) {
        Meteor.superConstructor.apply(this, arguments);

        // basics...
        this.originalImg = gamejs.image.load(globals.enemies.images.meteor);
        this.image = this.originalImg;
        this.rect  = new gamejs.Rect([0, 0], this.image.getSize());
        this.mask  = gamejs.mask.fromSurface(this.image);

        // this ones might vary according to the level, but are common to every
        // enemy sprite.
        this.speed     = utils.randomBetween(0.5, 1, false) * 250 * ((Math.pow(this.level.speed, 2) / 10) + 1);
        this.life      = 1;
        this.killScore = 2;
        // this.strength = 5; // ?

        // and this ones only make sense for a meteor.
        this.orientation = Math.random() * Math.PI * 2;
        this.rotation = -12 + Math.random() * 20;
    };
    gamejs.utils.objects.extend(Meteor, enemy.Enemy);

    Meteor.prototype.update = function(msDuration) {
        var time = msDuration / 1000;
        this.orientation += this.rotation * time;
        //this.image = gamejs.transform.rotate(this.originalImg, this.orientation);

        this.rect.left -= this.speed * time;

        if (this.rect.center[0] < -200) this.kill();
    };


    //
    // Return API
    return {
        Meteor: Meteor
    };
});
