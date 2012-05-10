dispGol - display Game of Life animations in webpages
=====================================================

Include animations of Conway's Game of Life in web-pages.  Instead of showing the usual evolution of the Game of Life board, it shows *how* the next state is calculated from the current one.

![](http://github.com/jamesrcole/dispGol/raw/master/img/screenshot.png) 

The animation is done using the HTML5 canvas.  


Usage
-----

For examples, see the included files `gliderAnim.html` and `gliderAndEaterAnim.html`.

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

  *  TLglider: a Glider, but positioned more to the top-left of the grid 

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


