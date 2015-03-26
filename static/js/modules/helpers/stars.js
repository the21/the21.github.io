define(['underscore', 'gamejs', 'modules/globals', 'modules/helpers/utils', 'gamejs/utils/vectors'], function(_, gamejs, globals, utils, $v) {
    var size  = [Math.ceil(globals.game.screenSize[0] / 254) * 254, Math.ceil(globals.game.screenSize[1] / 256) * 256];

    /*
     * StarsField.
     * -------------------------------------------------------------------------
     */
    var StarsField = function() {
        //var size  = utils.hypotenuse(globals.game.screenSize);

        this.field1 = new utils.PatternSurface(size);
        this.field2 = new utils.PatternSurface(size);

        this.field1.fillPattern(globals.starsField.image);
        this.field2.fillPattern(globals.starsField.image);

        this.offset1 = [0, 0];
        this.offset2 = [size[0], 0];

        // clouds
        this.lowerClouds = new Clouds();
        this.upperClouds = new Clouds(10, [0.5, 1]);

        // dangling stars
        this.stars = new DanglingStars(30);

        return this;
    };

    StarsField.prototype.draw = function(display) {
        display.blit(this.field1, this.offset1);
        display.blit(this.field2, this.offset2);

        this.lowerClouds.draw(display);
    };

    StarsField.prototype.handle = function(event) {
    };

    StarsField.prototype.update = function(msDuration, level) {
        this.offset1[0] -= level.speed * 4;
        this.offset2[0] -= level.speed * 4;

        if (this.offset1[0] <= globals.game.screenSize[0] - size[0])
            this.offset2[0] = this.offset1[0] + size[0];
        if (this.offset2[0] <= globals.game.screenSize[0] - size[0])
            this.offset1[0] = this.offset2[0] + size[0];

        var time = msDuration / 1000;
        this.lowerClouds.update(time);
        this.upperClouds.update(time);
        this.stars.update(time);
    };


    /*
     * SpaceObjectCollection.
     * this is basically an interface for whichever space object that needs to
     * be generated randomly
     * -------------------------------------------------------------------------
     */
    var SpaceObjectCollection = function(count) {
        count = count || 10;
        this.queue = [];

        // seed the objects
        for (var i = 0; i < count; i++)
            this.queue.push(this.generateNewItem());
        return this;
    };

    SpaceObjectCollection.prototype.draw = function(display) {
        _.each(this.queue, function(item) {
            display.blit(item, item.position);
        });
    };

    SpaceObjectCollection.prototype.update = function(time) {
        var self = this;
        _.each(this.queue, function(item) {
            if (item.position[0] > -100)
                item.position[0] -= item.speed * time;
            else
                self.regenerateItem(item);
        });
    };


    /*
     * CloudsField.
     * -------------------------------------------------------------------------
     */
    var Clouds = function(count, alphaRange) {
        this.maxSpeed = 250;
        this.alphaRange = alphaRange || [0, 1];

        Clouds.superConstructor.apply(this, arguments);

        return this;
    };
    gamejs.utils.objects.extend(Clouds, SpaceObjectCollection);

    Clouds.prototype.generateNewItem = function() {
        var cloud = gamejs.image.load(globals.starsField.cloud);
        cloud = gamejs.transform.scale(cloud, $v.multiply(cloud.getSize(), utils.randomBetween(50, 100) / 100));
        cloud.setAlpha(utils.randomBetween(this.alphaRange[0], this.alphaRange[1], false));
        cloud.position = [Math.random() * size[0] + size[0], Math.random() * size[1] - cloud.getSize()[1] / 2];
        cloud.speed    = Math.random() * this.maxSpeed;

        return cloud;
    };

    Clouds.prototype.regenerateItem = function(cloud) {
        cloud.position = [Math.random() * size[0] + size[0], Math.random() * size[1] - cloud.getSize()[1] / 2];
        cloud.speed    = Math.random() * this.maxSpeed;
        cloud.setAlpha(utils.randomBetween(this.alphaRange[0], this.alphaRange[1], false));
    };


    /*
     * DanglingStars.
     * -------------------------------------------------------------------------
     */
    var DanglingStars = function(count, alphaRange) {
        this.maxSpeed = 450;
        this.speedRange = alphaRange || [0.7, 1];

        DanglingStars.superConstructor.apply(this, arguments);

        return this;
    };
    gamejs.utils.objects.extend(DanglingStars, SpaceObjectCollection);

    DanglingStars.prototype.generateNewItem = function() {
        var star = gamejs.image.load(globals.starsField.starSmall);
        star.position = [Math.random() * size[0] + size[0], Math.random() * size[1] - star.getSize()[1] / 2];
        star.speed    = utils.randomBetween(this.speedRange[0], this.speedRange[1], false) * this.maxSpeed;
        return star;
    };

    DanglingStars.prototype.regenerateItem = function(star) {
        star.position = [Math.random() * size[0] + size[0], Math.random() * size[1] - star.getSize()[1] / 2];
        star.speed    = utils.randomBetween(this.speedRange[0], this.speedRange[1], false) * this.maxSpeed;
    };



    //
    // return the API
    return {
        StarsField: StarsField
    };
});
