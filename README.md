dispGol - display Game of Life animations in webpages
=====================================================

Include animations of Conway's Game of Life in web-pages.  Instead of showing the usual evolution of the Game of Life board, it shows *how* the next state is calculated from the current one.

![screenshot](http://github.com/jamesrcole/dispGol/raw/master/img/screenshot.png)

To see a live example, [click here](http://jamesrcole.github.com/dispGol/).

The code is pure Javascript and draws the animation on the HTML5 canvas using the [CreateJS](http://createjs.com/) library.  It also makes minor use of [JQuery](http://jquery.com/).


Usage
-----

For examples, see the included example files `gliderAnim.html` and `gliderAndEaterAnim.html`.

In the HTML file you wish to include the animation in:

In the `head` element, you need to include the following scripts 
(naturally adjusting their paths if they are located in a different 
location to the HTML file):

    <script type="text/javascript" src="jquery-1.7.2.js"></script>  
    <script type="text/javascript" src="prototypes.js"></script>
    <script type="text/javascript" src="easeljs-0.4.2.min.js"></script>
    <script type="text/javascript" src="tweenjs-0.2.0.min.js"></script>
    <script type="text/javascript" src="Ease.js"></script>
    <script type="text/javascript" src="dispGol.js"></script>

`dispGol.js` generates the animation, making use of the code in the other files to do so.

Then in the `body` of your HTML file, include a `div` where you wish the 
animation to be displayed:

    <div class="dispGol"
         display="updater"
         pattern="EaterAndGliderWithGliderCloser"
         gridWidth="9"
         gridHeight="9"
         steps="7">
    </div>

The `class` and `display` attributes must always be as shown in the 
example.

The `pattern` attribute indicates which Game of Life pattern to show the updating for.  Presently the following are supported

  *  glider: a [Glider](http://conwaylife.com/wiki/Glider)

  *  TLglider: a Glider, but positioned closer to the top-left of the grid 

  *  block: a [Block](http://conwaylife.com/wiki/Block) still life.  

  *  tub: a [Tub](http://conwaylife.com/wiki/Tub) still life.

  *  beehive: a [Beehive](http://conwaylife.com/wiki/Beehive) still life

  *  blinker: a [Blinker](http://conwaylife.com/wiki/Blinker) oscillator

  *  LWSS: a [Lightweight spaceship](http://conwaylife.com/wiki/LWSS).  

  *  EaterAndGlider: an [Eater 5](http://conwaylife.com/wiki/Eater_5), eating a glider 

  *  EaterAndGliderWithGliderCloser: the same as the above, but with the glider starting a bit closer to the eater.

These patterns are defined in the global variable `patterns` in dispGol.js. Other patterns can be added by modifying adding their details there.

The `gridWidth` attribute indicates how many cells wide the displayed grids will be.

The `gridHeight` attribute indicates how many cells high the displayed 
grids will be.

The `steps` attribute indicates how many steps of the evolution of the 
Game of Life board to show.


Limitations
-----------

  * The animation is only compatible with Firefox and Safari.
     * It doesn't render properly in Chrome.  Versions of Internet Explorer < 9 don't have canvas support, and while there are workarounds for that I haven't investigated these.  I haven't yet tested it in Internet Explorer 9 or in earlier versions of Firefox or Safari.

  * Only one animation can be included in each HTML page.
     * Based on my understanding of CreateJS, while the current version of it lets you have multiple independent animations on the one page, there isn't a way to toggle whether an animation is paused/playing without effecting all of the animations on the page.  I imagine this will be addressed soon.
