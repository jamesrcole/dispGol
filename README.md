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

License
-------

This software is distributed under the [MIT License](http://opensource.org/licenses/MIT).


Limitations
-----------

  * Requires recent version of Firefox or Safari, or Internet Explorer 9.
     * Chrome doesn't render animation properly.  Current version of animation is too slow (skips frames) in Opera.  Earlier versions of Internet Explorer  don't have canvas support, and while there are workarounds for that I haven't investigated these.

  * Only one animation can be included in each HTML page.
     * Based on my understanding of CreateJS, while the current version of it lets you have multiple independent animations on the one page, there isn't a way to toggle whether an animation is paused/playing without effecting all of the animations on the page.  I imagine this will be addressed soon.

  * 'Boundary' atoms (on cells) aren't shown.
     * if the definition of the animation specifies a N x M sized grid, then the animation will show a N+2 x M+2 sized grid.  That is, it shows a 'boundary' layer of cells around the edge of the grid.  The grid-lines for these cells fade out towards the edges.  It shows these because the updating for each cell takes into account the surrounding cells, and we want to show the cells surrounding the cells on the outside edges of the N x M grid.  However, if the pattern includes atoms any of those 'boundary' cells, they won't be shown on the grid or included in the update animation (i.e. not shown in the updateSquare).
     * however, the calculation of the state of the variable that represents the next grid state does factor into account all of the atoms, and if the 'hidden' atoms did create new atoms in the next moment, even though they won't be shown on the grid when that next state becomes the current state, those atoms will appear on the updateSquares.
     * this issue would be addressed if the grid size was automatically adjusted to fit in all of the atoms in the pattern (see below).


Future work
-----------


  * possible enhancements to make meaning of the animation clearer
     * make matches more prominent
        * try making the updateSquare and the matching condition's backgrounds turn green when there's a match.
        * could also highlight the counts.  After all, they are what determine whether there is a match or not.
     * highlight just the part of the grid the top arm hole is over
        * rather than all of the top grid.  
     * highlight the area the bottom arm hole is over.
        * this might make it clearer that the bottom arm hole corresponds to the same grid position as the central cell of the top arm hole.  For that matter, you could highlight that central cell in the top arm the same colour as the bottom arm hole cell, and then the rest of the top arm hole cells in a slightly different colour.
     * initially draw grid-lines over the updateSquare, but fade them out as it moves to the count component or when it is in the count component.
     * improve the positioning of the count labels in the updateSquare and matching conditions.  They're a bit 'out'.
     * ideas for improve the atom-count animation
        * highlight the cell whose cell is currently being counted.
        * get the atom to increase in size without also moving down and to the right.
     * make it look like there is a much greater 'gulf' between the top and bottom grids, to reinforce the idea that the only way that atoms are put onto the bottom grid is via the updater.  Ideas:
        * Increase the size of the shadow for the updater and grids (but not the shadows inside the updater).
        * Try making the timeDisps more like strip that extends across the full width of the canvas.
        * Make the background look like a "deep, nebulous gulf" - that is, as something that is quite distant from the grids and updater.
     * give the updater rounded corners.  Everything else that represents a process in the diagram has rounded corners.
     * put little arrows on the guidelines showing the direction things will move, though this may be overdoing things.
     * possibility: have new atom pen horizontally aligned with count atoms pen, and the down wire from match component sill coming down from center of that, but then having another arm that goes to the left to match up with left edge of new atom pen.


  * other enhancements
     * cache the display objects!
        * to improve performance of animation on things like mobile devices
        * also, labels in the match condition's seem to 'jiggle' when the updater moves.  Caching may help that.
     * add a way to increase the speed of the animation
        * e.g. so user can speed it up when the updater is processing an empty area on the grid.
     * add a way to jump time forwards by a certain amount, or to a certain grid position or to a certain timestep.
     * auto re-size the grids
        * at each timestep, automatically set the size of the grid such that it snugly fits the atoms on it.  This would prevent cases like with the 'gliderAndEater' pattern where after time 3 the glider has disappeared so the top few rows of the grid are completely empty.
     * calculate the canvas size
        * currently it's hard-coded.  It should be a function of the grid-size.
     * possibly get it to display information about what it is showing, e.g. 'showing first N time steps'.
     * add a 'branch' operation to the sequencer, enabling tweens to run in parallel to the "mainline" tweens.  In the normal sequence, the current tweens must finish before the following tweens can start, but the tween on a branch run would run independently on this and there would be no tween depending on them to finish before they could start.

  * planned future features
     * choose from a library of patterns which one to show evolution of 
     * interactively draw patterns
     * paste in pattern definitions in the standard formats (RLE etc)
     * a suite of different ways to show patterns and pattern evolution, 
       e.g.
        * show animations of the ordinary evolution of a pattern (i.e.  
          without showing how the next states are calculated).
        * show a static diagram that lays out, one after the other 
          (spatially), a number of steps in the evolution of a pattern.
        * diagrams showing 'causal ancestry'
            * that staticaly show show a number of steps in the evolution 
              of a pattern, but which also let the user see atoms in 
              earlier moments are causal ancestors of an atom in a given 
              moment.  It could statically show this ancestry for a given 
              atom, or let the user interactively choose the particular 
              atom to show it for.
        * similar diagrams, showing 'causal descendance'
     * the current way the updating is shown takes far too long to animate 
       even moderately sized boards - need to have something faster.
        * I think what is really needed is to, instead of showing the updating of cells in a serial fashion, show it in parallel.  How that could work:
           * show an initial step where the grid is cut up into each of the 
             3x3 squares, and then have a (much simpler) update process 
             shown for each of these
           * in the count process, show a '0' for no atom and a tally mark 
             for each atom, and show these directly beside the 3x3 grid (to 
             more easily see the relationship between the counts and the 
             grid contents)
             The central count in top half of square beside 3x3 grid, the 
             catchment count in bottom half.
           * then for the match process, just make each condition (0-III, 
             I-II, I-III) just appear one at a time beside the counts, and 
             then slide over it and highlight if they are the same. The 
             idea is to make it easier to see the quantities and easier to 
             visually recognise when there is a match.  If there's a match 
             make a new atom appear
           * then at the end 'stitch back together' the pieces to form the 
             grid in the next state.
           * I'd originally been hesitant to show the process in parallel 
             as then the viewer can't see exactly what is going on, but I 
             think it's probably ok as long as it is fully clear that all 
             of the updating is just happening via that simple process 
             operating on the 3x3 squares.
       
     
  * to fix
     * when it is displaying a larger grid, e.g. the 'gliderAndEater' animation, the updater arms are longer and it looks as if the updateSquare is appearing to the right of the hole where it should appear.
     * the timeDisp backgrounds only have the correct size when the grids have the same number of rows as columns.
     
     
  * refactoring - heaps of this to do, some misc items:
     * add an Atom class
     * move some of the global vars into the dispGol class.
        * this will be necessary when it's possible to have multiple animations on the one page.
     * rather than hard-coding tween durations for when items move between two positions, could have it calculate the duration based on the distance to be travelled.
        * this would enable things to move at a consistent speed.
     * instead of using separate shapes to make items appear to change colour, could perhaps use Filters.
     * move the Sequencer and AnimPath classes out to their own file or files.


Change history
--------------

Current version 0.1

  * 0.1
     * really messy code: it started out just drawing static diagrams but then I realised an animation would be the best way to present the information so it evolved in that direction.  Having never done graphics/animation before, learnt how the drawing/animation library worked as I was writing the code, so it wasn't clear how to organise things as I was going along.



