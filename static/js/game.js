require.config({
    paths: {
        // templates: '../templates',
        backbone: 'libs/backbone/backbone',
        gamejs: 'libs/gamejs/gamejs',
        jquery: 'libs/jquery/jquery-1.8.2',
        underscore: 'libs/underscore/underscore'
    }
});

require(['jquery', 'gamejs', 'modules/main', 'modules/globals'], function($, gamejs, main, globals) {
    // game init
    var images = [
    globals.starsField.image,
    globals.starsField.cloud,
    globals.starsField.starSmall,
    globals.player.sprite,
    globals.player.lifeSprite,
    globals.player.laserSprite,
    globals.player.coolLaserSprite,
    globals.player.missileSprite,
    globals.player.speedSprite,
    globals.enemies.laserSprite];
    for (var key in globals.enemies.images)
        images.push(globals.enemies.images[key]);
    globals.powerups.images.forEach(function(image) {
        images.push(image);
    });

    gamejs.preload(images);
    $('#play').click(function(e) {
        e.preventDefault();

        function authInfo(response) {
            if (!response.session) {
                alert('Необходимо войти с помощью ВКонтакте.');
                return false;
            } else {
                $('div.wrapper').fadeOut('fast', function() {
                    $('#gjs-canvas').fadeIn('fast', function() {
                        $('#back-to-page').removeClass('hide');
                        $('#github-ribbon').addClass('hide');
                        _gaq.push(['_trackPageview', '/play']);
                        gamejs.ready(main);
                    });
                });

            }
        }
        VK.Auth.login(authInfo, 1);
    });
});