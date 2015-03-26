define(['underscore', 'gamejs', 'modules/globals', 'modules/helpers/utils', 'gamejs/utils/math', 'gamejs/utils/vectors'], function(_, gamejs, globals, utils, $m, $v) {
    /*
     * Weapon.
     * the basic weapon interface.
     * -------------------------------------------------------------------------
     */
    var Weapon = function(spriteUrl, position, orientation) {
        // call superconstructor
        Weapon.superConstructor.apply(this, arguments);

        this.image = gamejs.image.load(spriteUrl);
        this.orientation = $m.normaliseRadians(orientation);  // radians
        this.origin = position;

        // weapon qualities
        this.strength = 1;
        this.life     = this.strength;
        this.speed    = 100;

        if (arguments.length > 3)  // if there's another argument, it must be an object.
            _.extend(this, arguments[3]);

        // weapon image
        this.image = gamejs.transform.rotate(this.image, $m.degrees(this.orientation));
        var size = this.image.getSize();
        this.rect = new gamejs.Rect($v.add(position, [-size[0] / 2, -size[1]/2]), size);
        this.mask = gamejs.mask.fromSurface(this.image);
    };
    gamejs.utils.objects.extend(Weapon, gamejs.sprite.Sprite);

    Weapon.prototype.canGetDamage = function() {
        return true;
    };

    Weapon.prototype.draw = function (display) {
        display.blit(this.image, this.rect.topleft);

        // gamejs.draw.line(display, '#FF0000', this.speedRect.topleft, this.speedRect.topright);
        // gamejs.draw.line(display, '#FF0000', this.speedRect.topleft, this.speedRect.bottomleft);
        // gamejs.draw.line(display, '#FF0000', this.speedRect.bottomleft, this.speedRect.bottomright);
        // gamejs.draw.line(display, '#FF0000', this.speedRect.bottomright, this.speedRect.topright);

        // gamejs.draw.line(display, '#FFFF00', this.rect.topleft, this.rect.topright);
        // gamejs.draw.line(display, '#FFFF00', this.rect.topleft, this.rect.bottomleft);
        // gamejs.draw.line(display, '#FFFF00', this.rect.bottomleft, this.rect.bottomright);
        // gamejs.draw.line(display, '#FFFF00', this.rect.bottomright, this.rect.topright);
        return;
    };

    Weapon.prototype.getDamage = function(damage) {
        this.life -= damage;
        if (this.life <= 0) this.kill();  // you dead, dude
        return 0;
    };

    Weapon.prototype.update = function(msDuration) {
        var time = msDuration / 1000;

        this.rect.left += this.speed * Math.cos(this.orientation - Math.PI/2);
        this.rect.top  += this.speed * Math.sin(this.orientation - Math.PI/2);

        if (utils.outOfScreen(this.rect.center, this.image.getSize()))
            this.kill();
    };


    /*
     * Laser.
     * just some orientated laser shooted by the player and enemies.
     * -------------------------------------------------------------------------
     */
    var Laser = function(spriteUrl, position, orientation) {
        Laser.superConstructor.apply(this, arguments);

        // speed line image
        var size = this.image.getSize(),
            speedLineImg = gamejs.image.load(globals.player.speedSprite);
        this.speedLineVerticalSize = speedLineImg.getSize()[1];
        this.speedLine = new gamejs.Surface($v.add(speedLineImg.getSize(), [0, size[1]]));
        this.speedLine.blit(speedLineImg, [0, size[1]]);
        this.speedLine = gamejs.transform.rotate(this.speedLine, $m.degrees(this.orientation));
        if (this.orientation >= 0 && this.orientation < Math.PI / 2) this.speedLineCorner = ['top', 'right'];
        else if (this.orientation >= Math.PI / 2 && this.orientation < Math.PI) this.speedLineCorner = ['bottom', 'right'];
        else if (this.orientation >= Math.PI && this.orientation < 3 * Math.PI / 2) this.speedLineCorner = ['bottom', 'left'];
        else this.speedLineCorner = ['top', 'left'];
        this.speedRect = new gamejs.Rect([0, 0], this.speedLine.getSize());
        this.speedRect[this.speedLineCorner] = this.rect[this.speedLineCorner];
        this.speedLine.setAlpha(1);
    };
    gamejs.utils.objects.extend(Laser, Weapon);

    Laser.prototype.draw = function(display) {
        // speedline
        display.blit(this.speedLine, this.speedRect.topleft);
        // laser
        display.blit(this.image, this.rect.topleft);
        return;
    };

    Laser.prototype.update = function(msDuration) {
        var time = msDuration / 1000;

        this.rect.left += this.speed * Math.cos(this.orientation - Math.PI/2);
        this.rect.top  += this.speed * Math.sin(this.orientation - Math.PI/2);
        this.speedRect[this.speedLineCorner[0]] = this.rect[this.speedLineCorner[0]];
        this.speedRect[this.speedLineCorner[1]] = this.rect[this.speedLineCorner[1]];

        if (utils.outOfScreen(this.rect.center, this.speedLine.getSize()))
            this.kill();

        if (this.speedLine.getAlpha() > 0) {
            var alpha = 1 - Math.abs($v.distance(this.origin, this.speedRect.center)) / (this.speedLineVerticalSize * 3);
            alpha = alpha < 0 ? 0 : alpha;
            this.speedLine.setAlpha(alpha);
        }
    };


    /*
     * Missile.
     * A cool and explosive missile that will still hurt after exploting.
     * -------------------------------------------------------------------------
     */
    var Missile = function(spriteUrl, position, orientation) {
        this.exploded = false;
        this.radius = 1;
        this.maxRadius = 300;
        this.explosionTime = 0;
        this.animationTime = 400;
        Missile.superConstructor.apply(this, arguments);
        this.strength = 150;
    };
    gamejs.utils.objects.extend(Missile, Weapon);

    Missile.prototype.doDamage = function (distance) {
        if (distance > this.radius) return 0;
        return (this.maxRadius - distance) * this.strength / this.maxRadius;
    };

    Missile.prototype.draw = function (surface) {
        if (!this.exploded)
            return Weapon.prototype.draw.call(this, surface);
        var explosionCircle = new gamejs.Surface(this.rect);
        gamejs.draw.circle(explosionCircle, '#75CB3B', [this.radius, this.radius], this.radius);
        explosionCircle.setAlpha(this.explosionTime / this.animationTime);
        surface.blit(explosionCircle, $v.add(this.rect.center, [-this.radius, -this.radius]));
    };

    Missile.prototype.explote = function () {
        this.exploded = true;
    };

    Missile.prototype.update = function (msDuration) {
        if (!this.exploded)
            return Weapon.prototype.update.call(this, msDuration);

        this.explosionTime += msDuration;
        if (this.explosionTime > this.animationTime) {
            this.kill();
            return;
        }
        this.radius = this.maxRadius * this.explosionTime / this.animationTime;
        var center = this.rect.center;
        this.rect.width  = this.radius * 2;
        this.rect.height = this.radius * 2;
        this.rect.center = center;
        return;
    };


    //
    // return API
    return {
        Laser: Laser,
        Missile: Missile
    };
});
