define(['gamejs', 'modules/globals'], function(gamejs, globals) {
    var PatternSurface = gamejs.Surface;
    PatternSurface.prototype.fillPattern = function(imgUrl) {
        var image = gamejs.image.loadImage(imgUrl);
        this.fill(this.context.createPattern(image, 'repeat'));
    };

    var basisChange = function(ux, uy, v) {
        return [
            ux[0] * v[0] + uy[0] * v[1],
            ux[1] * v[0] + uy[1] * v[1]
        ];
    };

    var hypotenuse = function() {
        if (arguments.length == 1)
            arguments = arguments[0];
        var x = arguments[0],
            y = arguments[1];
        return Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2));
    };

    var outOfScreen = function(pos, size) {
        size = size || [0, 0];
        return (pos[0] > globals.game.screenSize[0] || pos[0] < -size[0] ||
                pos[1] > globals.game.screenSize[1] || pos[1] < -size[1]);
    };

    var printStack = function() {
        try { throw Error(); } catch(ex) { return ex.stack; }
    };

    var randomBetween = function(min, max, integer) {
        if (typeof(integer)==='undefined') integer = true;
        var reminder = integer ? 1 : 0;
        var value = Math.random() * (max - min + reminder);
        value = integer ? Math.floor(value) : value;
        return value + min;
    };

    var sameSign = function(x, y) {
        return (x * y >= 0);  // this might not work for really big numbers.
    };

    return {
        basisChange: basisChange,
        hypotenuse: hypotenuse,
        outOfScreen: outOfScreen,
        printStack: printStack,
        randomBetween: randomBetween,
        sameSign: sameSign,
        PatternSurface: PatternSurface
    };
});
