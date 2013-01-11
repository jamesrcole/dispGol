dispGol - visualise causality in Conway's Game of Life, using HTML5
===================================================================

Ways of visualising causality in Conway's Game of Life.  Two types of visualisation are provided.  *Updater* visualisations are animations of how the Game of Life rules are applied to produce the next moment's configuration.  *Causal Relations* visualisations are interactive diagrams that show the causal relationships between states in different moments.

What the Updater visualisations look like ([watch a live example](http://jamesrcole.github.com/dispGol/)):

![screenshot of an Updater visualisation](http://github.com/jamesrcole/dispGol/raw/master/img/updaterScreenshot.png)

What the Causal Relations visualisations look like ([see a live example](http://jamesrcole.github.com/dispGol/)):

![screenshot of an Causal Relations visualisation](http://github.com/jamesrcole/dispGol/raw/master/img/causalRelationsScreenshot.png)

None of the visualisations are hard-coded.  They're generated from a definition of a Game of Life pattern, and dispGol can generate visualisations for any supplied pattern.

The visualisations are pure Javascript/HTML5.  They are drawn on the HTML5 canvas using the [CreateJS](http://createjs.com/) library.  Minor use is also made of of [JQuery](http://jquery.com/).


Usage
-----

For examples, see the included HTML files (`glider.html`, `gliderAndEater.html` etc).

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
    <script type="text/javascript" src="animPath.js"></script>
    <script type="text/javascript" src="sequencer.js"></script>

To use the Updater diagrams you also need:

    <script type="text/javascript" src="updater.js"></script>

To use the Causal Relationships diagrams you also need:

    <script type="text/javascript" src="causalRelationsDiagrams.js"></script>

Then in the `body` of your HTML file, include a `div` where you wish the 
animation to be displayed:

    <div class="dispGol"
         display="updater"
         pattern="EaterAndGliderWithGliderCloser"
         gridWidth="9"
         gridHeight="9"
         steps="7">
    </div>

The `class` attribute should always have the value of `dispGol`.

The `display` attribute indicates what type of diagram should be displayed.  It's value should be either `updater` or `causalRelations`.

The `pattern` attribute indicates the name of the Game of Life pattern to show the updating for.  Presently the following are supported

  * still lifes
      * `block`: a [Block](http://conwaylife.com/wiki/Block).  
      * `tub`: a [Tub](http://conwaylife.com/wiki/Tub).
      * `beehive`: a [Beehive](http://conwaylife.com/wiki/Beehive).
  * oscillators
      * `blinker`: a [Blinker](http://conwaylife.com/wiki/Blinker).
      * `Pulsar`: a [Pulsar](http://conwaylife.com/wiki/Pulsar).
      * `Pentadecathlon`: a [Pentadecathlon](http://conwaylife.com/wiki/Pentadecathlon).
      * `Octagon2`: an [Octagon 2](http://conwaylife.com/wiki/Octagon_2).
  * spaceships
      * `glider`: a [Glider](http://conwaylife.com/wiki/Glider)
      * `TLglider`: a Glider, but positioned closer to the top-left of the grid 
      * `LWSS`: a [Lightweight spaceship](http://conwaylife.com/wiki/LWSS).  
  * guns
      * `GosperGliderGun`: a [Gosper Glider Gun](http://conwaylife.com/wiki/Gosper_glider_gun)
  * interacting patterns
      * `EaterAndGlider`: an [Eater 5](http://conwaylife.com/wiki/Eater_5), eating a glider.
      * `EaterAndGliderWithGliderCloser`: the same as the above, but with the glider starting a bit closer to the eater.
      * `QueenBeeShuttle`: a [Queen Bee Shuttle](http://conwaylife.com/wiki/Queen_bee_shuttle)
      * `KickbackReaction`: a [Kickback Reaction](http://conwaylife.com/wiki/Kickback_reaction)
      * `P60Relay`: a glider shuttling between two pentadecathlons.
  * some examples of patterns that just "disintegrate" into nothing
      * `disintegratingPattern1`
      * `disintegratingPattern2`
      * `disintegratingPattern3`
  * some examples where the evolution of a "random"-looking pattern results in some structure
      * `StructureFromRandomness1`
  * [glider synthesis](http://conwaylife.com/wiki/Glider_synthesis)
      * `GliderSynthesisPentadecathlon`: glider synthesis of a [Pentadecathlon](http://conwaylife.com/wiki/Pentadecathlon). 

(These patterns are defined in the global variable `patterns` in dispGol.js. Other patterns can be added by adding their details there.)

The `gridWidth` attribute indicates how many cells wide the displayed grids will be.

The `gridHeight` attribute indicates how many cells high the displayed 
grids will be.

The `steps` attribute indicates how many steps of the evolution of the 
Game of Life board to show.

Interacting with Causal Relations diagrams
------------------------------------------

Click on a cell to select it.  Its ancestors (in earlier time moments) and its descendants (in later time moments) will be highlighted. Ancestors are shaded light-blue.  Descendants are shaded light-green.

Cells can be selected from any time moment.

Hold down the ALT key to select multiple cells.  As well as showing ancestors and descendants of the selected cells, it will also show any common ancestors (cells that are ancestors of all of the selected cells) and common descendants.  Common-ancestors are shaded bright-blue.  Common-descendants in bright-green.



License
-------

This software is distributed under the [MIT License](http://opensource.org/licenses/MIT).


Limitations
-----------

  * Requires recent version of Firefox, Safari or Chrome, or Internet Explorer 9.
     * Most recent version of Chrome still doesn't render the shadows properly, but this is just a cosmetic issue and the animations are still quite viewable.  Earlier versions of Chrome had a more severe problem with rendering shadows, which obscured details of the animation.  Current version of animation is too slow (skips frames) in Opera.  Earlier versions of Internet Explorer don't have canvas support, and while there are workarounds for that I haven't investigated these.

  * Only one Updater animation can be included in each HTML page.
     * Based on my understanding of CreateJS, while the current version of it lets you have multiple independent animations on the one page, there isn't a way to toggle whether an animation is paused/playing without effecting all of the animations on the page.  I imagine this will be addressed soon.

  * Updater animation is slow to load for larger patterns and/or animations showing more time-steps
     * Currently it generates the entire animation as part of loading the page.

  * In Updater animation, 'boundary' atoms (on cells) aren't shown.
     * if the definition of the animation specifies a N x M sized grid, then the animation will show a N+2 x M+2 sized grid.  That is, it shows a 'boundary' layer of cells around the edge of the grid.  The grid-lines for these cells fade out towards the edges.  It shows these because the updating for each cell takes into account the surrounding cells, and we want to show the cells surrounding the cells on the outside edges of the N x M grid.  However, if the pattern includes atoms any of those 'boundary' cells, they won't be shown on the grid or included in the update animation (i.e. not shown in the updateSquare).
     * however, the calculation of the state of the variable that represents the next grid state does factor into account all of the atoms, and if the 'hidden' atoms did create new atoms in the next moment, even though they won't be shown on the grid when that next state becomes the current state, those atoms will appear on the updateSquares.
     * this issue would be addressed if the grid size was automatically adjusted to fit in all of the atoms in the pattern (see below).


Future work
-----------

  * highest priority
     * Causal Relations diagrams
        *  Make them show all ancestor/descendant cells, not just those containing atoms.  This will show a more accurate view of the causality.
     * Updater diagrams
        * everything that happens when there's a match (to do with result pulse and new atom moving onto bottom grid) is too slow relative to the rest of the animation - speed it up.
        * make animations faster to load
           * instead of generating entire animation at once, generate the animation for a single time-step at a time, generating the next one while the current one is running.
           * instead of generating animation at page-load time, do it after the page has rendered.
     * 'Concurrent Updates' diagrams - a different type of animation that shows the updates for each cell in parallel.
        * the current way the updating is shown takes far too long to animate even moderately sized boards - need to have something faster.
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
           * allow the user to scroll back to see the full history of the grids and update calculations at each step.
     * Upgrade code to using newer version of CreateJS
     * Add way to generate a conventional animation of a GoL pattern
     * Add a way to generate a static diagram of the steps of the evolution of a GoL pattern.

  * possible enhancements to make meaning of the Updater animation clearer
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


  * other enhancements to Updater animation
     * add a way to increase the speed of the animation
        * e.g. so user can speed it up when the updater is processing an empty area on the grid.
     * add a way to jump time forwards by a certain amount, or to a certain grid position or to a certain timestep.
     * auto re-size the grids
        * at each timestep, automatically set the size of the grid such that it snugly fits the atoms on it.  This would prevent cases like with the 'gliderAndEater' pattern where after time 3 the glider has disappeared so the top few rows of the grid are completely empty.
     * calculate the canvas size
        * currently it's hard-coded.  It should be a function of the grid-size.
     * possibly get it to display information about what it is showing, e.g. 'showing first N time steps'.
     * add a 'branch' operation to the sequencer, enabling tweens to run in parallel to the "mainline" tweens.  In the normal sequence, the current tweens must finish before the following tweens can start, but the tween on a branch run would run independently on this and there would be no tween depending on them to finish before they could start.
     * be able to select atoms in Updater animations and have it highlight their descendants in future moments.

  * enhancements to Causal Relations diagrams
     * try highlighting the 'currently selected grid' (the one containing the selected cells).
     * subtly highlight the cell the mouse is currently over.  Perhaps could draw its border gray.
     * as well as subtly highlighting cell mouse is over, (slightly more) subtly highlight the corresponding cell position in the other time moments.  That might make diagram easier to interpret.
     * option of arranging grids either horizontally or vertically.  Vertical arrangement would suit wide grids.
     * ability to generate static causal relationship diagrams, where the DIV defining the diagram contains the details of which cells to show ancestry/descendance for.
     * ability to select multiple cells by holding down mouse button and dragging mouse (like in a paint program or spreadsheet).
     * be able to view the descendants of one set of atoms in one colour, and the descendants of a different set in a different colour.
     * the ALT key is used for multi-selection rather than the CTRL key is because CTRL+mouse-click opens the browser's context menu (at least in Chrome on Mac).  There's probably a way to get around this by prevening the default mouse behavior within the canvas.
     * a 'normal' animation of GoL (where it's not showing only the latest moment), but where it will highlight descendants of cells that were selected at an earlier time.  This'd be useful for cases where you want to show descendance after many time-steps, and it's just too much to show all of the time steps together on the one diagram.
     * cases to show with Causal Relations diagrams
        * where it's not obvious where the descendance will 'flow', such as when firing a glider into some large sort of still-life or oscillator.  Want to be able to see what, a fair way down the line, has ancestry to the glider.  Does all of it do so?
        * logic gates (AND, OR, etc).  For one thing, you should be able to see that the output has causal 
    descendance from inputs. 
        * herschel conduits / tracks (http://www.conwaylife.com/wiki/Conduit)
        * reflectors.  Would be interesting to see what the produced glider has ancestry from.  (The thing with cases like this is that they involve a serious number of steps).
        * an implementation of a computer
        * sliding-block memory.
        * object conversion. (these are types of conduits) e.g. a pi-heptomino to HWSS converter
     

  * planned future features
     * interactively choose from a library of patterns which one to show evolution of 
     * interactively draw patterns
     * paste in pattern definitions in the standard formats (RLE etc)
     * have a little help or info icon in diagrams.  Clicking it will provide a information about the diagrams.
     * ability to restart animation while it's in progress (for if viewer gets distracted and misses a bit or other such reasons).
     * have a 'timeline' like youtube videos do (the red band down the bottom of them), showing length of animation, how much time has currently elapsed and the ability to jump to any point along that timeline and scrub the current time.
     * a suite of different ways to show patterns and pattern evolution, 
       e.g.
        * show animations of the ordinary evolution of a pattern (i.e.  without showing how the next states are calculated).
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
        * a focus+context view, where part of the view is zoomed right out so 
          the cells and the updater are quite small, and the other part of the 
          view is zoomed right in on the updater and its operation.  The part 
          of the view focusing on the updater would just show the bit of the 
          board it is currently dealing with, to emphasise that it only has a 
          view of the board of the size of a 3x3 square of cells.
        * a view showing how the interaction of one pattern with another 
          changes the evolution of that other pattern.
          It would highlight which cells, at time T after the beginning of that 
          interaction, are only there because of that interaction.

  * refactoring - heaps of this to do, some misc items:
     * add an Atom class
     * move some of the global vars into the dispGol class (a lot of them should go into updater.js).
        * this will be necessary when it's possible to have multiple animations on the one page.
     * rather than hard-coding tween durations for when items move between two positions, could have it calculate the duration based on the distance to be travelled.
        * this would enable things to move at a consistent speed.
     * instead of using separate shapes to make items appear to change colour, could perhaps use Filters.
     * move GoL pattern definitions to a JSON file.  Put documentation of patterns in that file, and instead of describing these patterns in README.md, add means to generate markdown description of patterns from JSON file and link to that from README.md.
     * move all the Updater diagrams animation tweens stuff in the dispGol.js classes (like in AbstractGrid) into updater.js.


     * Causal Relations diagrams
        * not sure the code handles the case where the pattern completely disintegrates and you get empty grids after a certain point.
        * createAndAddHighlightForSelectedAtom and addAndRegisterAtomHighlight essentially do the same thing - remove one of them.
        * each of the 'ancestor' methods is very similar to each of the 'descendants' methods.  Can probably have generic methods that can handle both cases.
        * just as there isn't a special method to createAndAddHighlights of ancestors of a single selected cell (it just uses the case of doing it for multiple selected cells), so it should be for descendants.
        * move these three interrelated (each requires the last) methods in CausalRelationsDiagrams into Universe?  1) getDescendantsForAtoms(this.selectedAtomPositions,newSelectionTimeStep)  2) getUniqueDescendantsByTimestep(descendantsForEachAtom,newSelectionTimeStep) 3) getCommonDescendantsOfAtomsByTimestep(newSelectionTimeStep,descendantsForEachAtom).  (Universe already has: universe.getAtomsDescendants(newSelectionTimeStep,atomPos,this.numSteps-1) ). NOTE: those methods refer to members of the CausalRelationsDiagrams class, so those details would need to be adjusted.
        * Though we're now keeping copy of board for each moment, the Universe methods like getInfluencedCells, neighbouringAtomCount, hasAtom all assume the current board.  This isn't ideal.  Those methods should really be in the Pattern class, too.
        * stuff for handling mouseclicks - the main three entry points 1) selectSingleCell createAndAddHighlightsForSelectedAtoms(grid); createAndAddHighlightsForAtomDescendants 2) removeCellFromSelection & 3) addCellToSelection.  first, making any necessary modifications to selectedAtomPositions and selectedAtomsTime then createAndAddHighlightsForSelectedAtoms(grid); createAndAddHighlightsForMultipleAtomsDescendants(selectionTimeStep); -> since *all* three of these call createAndAddHighlightsForSelectedAtoms(grid), and effectively call createAndAddHighlightsForMultipleAtomsDescendants(selectionTimeStep); (though selectSingleCell calls what is essentially a special case of that, in createAndAddHighlightsForAtomDescendants) ...i think that duplicated stuff should be refactored to only occur once.
   * bugs in Causal Relations diagrams
       * minor: If fade-out cell on RHS of grid is clicked, it clears selection.  But not if you click on fade-out cells on any other sides of grid.
       * minor: Double-clicking a cell selects text in the header above the canvas.  I thought I could deal with this from preventing the event from bubbling up or cancelling the default. I looked at event in debugger to try and find a way of doing this, but couldn't see how.  Tried the following but they didn't work: event.nativeEvent.cancelBubble = true; event.nativeEvent.defaultPrevented = true;
        

 


Change history
--------------

Current version 0.2

  * 2013-01-11 - **v0.2**
     * added Causal Relations diagrams.  Some refactoring and modularisation of code. 

  * 2012-05-28: added caching of the display objects (some exceptions, see technicalNotes.txt)

  * 2012-05-28: fixed problem with incorrect size of timeDisp backgrounds (shown behind the grids) only having the correct size when the grids had the same number of rows as columns.

  * 2012-05: added various new Game of Life pattern definitions

  * 2012-05-12 - **v0.1**
     * really messy code: it started out just drawing static diagrams but then I realised an animation would be the best way to present the information so it evolved in that direction.  Having never done graphics/animation before, learnt how the drawing/animation library worked as I was writing the code, so it wasn't clear how to organise things as I was going along.



