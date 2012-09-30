
/*
 
This software is distributed under the MIT License.
 
The MIT License (MIT)
Copyright (c) 2012, James Cole

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

*/


/*

Notes:

- updating the bottomGrid reference as the animation plays

    When, in the animation, we go to move the new atom from the updater 
    container to the bottomGrid container, we need that bottomGrid member 
    to point to the grid that is the bottomGrid at that point in the 
    animation.

    Thus we need to update the bottomGrid reference _when the animation 
    starts_, and _when the animation has scrolled the new bottom grid up_.  
    That is, we need to register tweens to do these.
    
    I originally had the tween call a closure to update the bottomGrid ref.  
    But I didn't really understand exactly how variable refs in closures 
    worked - I didn't realise the ref to external vars would be to whatever 
    they are at the time the closure is actually executed, which mean that 
    it was always setting the bottomGrid to the final grid that was created 
    (as that's what it would be at the time the contruction of the 
    animation was all done).

    So I changed it from a closure to a method call and that worked.


 */

// obtained from http://ejohn.org/blog/simple-javascript-inheritance/

    /* Simple JavaScript Inheritance
     * By John Resig http://ejohn.org/
     * MIT Licensed.
     */
    // Inspired by base2 and Prototype
    (function(){
      var initializing = false, fnTest = /xyz/.test(function(){xyz;}) ? /\b_super\b/ : /.*/;
      // The base Class implementation (does nothing)
      this.Class = function(){};
      
      // Create a new Class that inherits from this class
      Class.extend = function(prop) {
        var _super = this.prototype;
        
        // Instantiate a base class (but only create the instance,
        // don't run the init constructor)
        initializing = true;
        var prototype = new this();
        initializing = false;
        
        // Copy the properties over onto the new prototype
        for (var name in prop) {
          // Check if we're overwriting an existing function
          prototype[name] = typeof prop[name] == "function" && 
            typeof _super[name] == "function" && fnTest.test(prop[name]) ?
            (function(name, fn){
              return function() {
                var tmp = this._super;
                
                // Add a new ._super() method that is the same method
                // but on the super-class
                this._super = _super[name];
                
                // The method only need to be bound temporarily, so we
                // remove it when we're done executing
                var ret = fn.apply(this, arguments);        
                this._super = tmp;
                
                return ret;
              };
            })(name, prop[name]) :
            prop[name];
        }
        
        // The dummy class constructor
        function Class() {
          // All construction is actually done in the init method
          if ( !initializing && this.init )
            this.init.apply(this, arguments);
        }
        
        // Populate our constructed prototype object
        Class.prototype = prototype;
        
        // Enforce the constructor to be what we expect
        Class.prototype.constructor = Class;

        // And make this class extendable
        Class.extend = arguments.callee;
        
        return Class;
      };
    })();




    // from http://stackoverflow.com/a/6082463
    Array.prototype.clone = function() {
        var arr = this.slice(0);
        for( var i = 0; i < this.length; i++ ) {
            if( this[i].clone ) {
                //recursion
                arr[i] = this[i].clone();
            }
        }
        return arr;
    }


    function addUniqueItems( targetArray, sourceArray) {

        for (var i = 0; i < sourceArray.length; i++) {

            if ( !containsSubArray(targetArray, sourceArray[i]) ) {
                targetArray.push(sourceArray[i]);
            }
        }
    }


    function containsSubArray( theArray, subArray ) {

        for (var i = 0; i < theArray.length; i++) {
            if ( theArray[i].compareArrays(subArray) ) return true;
        }
        return false;
    }


    // http://tech.karbassi.com/2009/12/17/pure-javascript-flatten-array/ 
    function flatten(array) {
        var flat = [];
        for (var i = 0, l = array.length; i < l; i++){
            var type = Object.prototype.toString.call(array[i]).split(' ').pop().split(']').shift().toLowerCase();
            if (type) { 
                flat = flat.concat(
                            /^(array|collection|arguments)$/.test(type) ? 
                            flatten(array[i]) : 
                            array[i]
                        ); 
            }
        }
        return flat;
    }



    // ------ start of dispGol.js proper -------
    


    var sequencer;

    // var gridRows = 4;
    // var gridCols = 4;
    var largeGridCellSize = 20;
    var smallGridCellSize = 14;
    var threeSquareWidth = largeGridCellSize*3;


    /*
       refactoring to do with shadows... i noticed that when i kicked the shadow width up a lot it 
       moves a lot to the right of the borders, but stays same thickness... i think that's coz i'm 
       doing a shadow of a line... whereas if it was a shadow of a rect that was placed behind the 
       updater backgroudn that'd wouldn't have that 'gap'... presumign I wanted that... */
    var shadowOffset = 4;
    var shadowBlur = 6; // 8;

    var outerShadowOffset = 6;
    var outerShadowBlur = 6; // 8;


    var nearWhite = "#F8F8F8";
    var activeColour = "DodgerBlue";
    var activeBGColour = "#E6E6EC"; // "GhostWhite";
    var matchColour = "#00FF00"; //"LawnGreen";
    var noMatchColour = "#FF0000";  //"IndianRed";
    var guideLinesColour = "#EBEBEB"; // needs to be lighter than activeBGColour
    // var gridBGColour = "#CEE6DA";
    var gridBGColour = "#DDEEE5";
            

    var offTopOfScreenGridY;
    var topGridY;
    var bottomGridY;
    var offBottomOfScreenGridY;

    var offTopOfScreenTimeDispY;
    var topTimeDispY;
    var bottomTimeDispY;
    var offBottomOfScreenTimeDispY;


    function Pattern(pattern) {

        this.patternPosArray = [];
        this.patternRLE = null;

        /**
            Pattern in RLE format or a PosArray.  It auto determines
            which and loads it.
        */
        this.setPattern = function(pattern) {
            var isPosArray = Array.isArray(pattern);
            if ( isPosArray ) {
                this.setPattern_PosArray(pattern);
            } else { // assume RLE
                this.setPattern_RLE(pattern);
            }
        }


        // sets the RLE _and_ calculates the pos array from it
        this.setPattern_RLE = function(pattern) {
            this.patternRLE = pattern;
            this.calculatePosArray(pattern);
        }

        /*
            ***initially handle cases without comment lines, an without header line

            Details of RLE format: http://conwaylife.com/wiki/Run_Length_Encoded
            and http://psoup.math.wisc.edu/mcell/ca_files_formats.html#RLE
        */
        this.calculatePosArray = function(patternRLE) {

            /*
              RLE format requires patternRLE to end with a '!'.  We'll let this be optional
            */

            var currRow = 0;
            var currCol = 0;   // col the _next_ item will go into
            var strPos = 0;    // curr pos within RLE string
            var c = patternRLE.charAt(strPos);
            var numberOf = 1;
            var numPatt = /\d+/g;
            var whitespacePatt = /\s+/g;
            while ( c != '!' && c != '' ) {
                // first two cases are potentially processing multiple characters
                if ( numPatt.test(c) ) {
                    numPatt.lastIndex = strPos;
                    var numString = numPatt.exec(patternRLE)[0];
                    numberOf = parseInt(numString);
                    strPos += numString.length;
                } else if ( whitespacePatt.test(c) ) {
                    whitespacePatt.lastIndex = strPos;
                    strPos += whitespacePatt.exec(patternRLE)[0].length;
                } else {
                // processing a single character of RLE
                    if (c == 'b') {
                        currCol += numberOf;
                    } else if (c == 'o') {
                        var endPt = currCol + numberOf;
                        for ( ; currCol < endPt; currCol++) {
                            this.patternPosArray.push( [currCol,currRow] );
                        }
                    } else if (c == '$') {
                        currRow += numberOf;
                        currCol = 0;
                    }
                    numberOf = 1;
                    strPos++;
                }
                c = patternRLE.charAt(strPos);
            }
        }


        this.setPattern_PosArray = function(pattern) {
            this.patternPosArray = pattern.clone();
        }

        this.getPattern_PosArray = function() {
            return this.patternPosArray;
        }

        // NOTE: only returns the RLE if it was explicitly set!
        //       otherwise it will return null.
        this.getPattern_RLE = function() {
            return this.patternRLE;
        }


        // the constructor sets the pattern. have to put it down here after funcs
        // it uses have been defined
        this.setPattern(pattern);

    }


    var patterns = {

        test: new Pattern([ [1,0], [3,0], [4,0], [0,1], [1,1], [3,1], [4,1] ]),

        /*
             oo
            o
        turns into 
             o
             o
        and then disappears
         */
        disintegratingPattern1: new Pattern([ [1,0], [2,0], [0,1] ]),

        /*
             o
              o
               o
        becomes
              o
        and then disappears
        */
        disintegratingPattern2: new Pattern([ [0,0], [1,1], [2,2] ]),

        /*
               oo
                 o
               o

        turns into 

                o
               o

        then disappears
        */
        disintegratingPattern3: new Pattern([ [0,0], [1,0], [2,1], [0,2] ]),


        glider:  new Pattern([ [3,1], [3,2], [3,3], [2,3], [1,2] ]),

        TLglider: new Pattern([ [2,0], [2,1], [2,2], [1,2], [0,1] ]),

        block:   new Pattern([ [1,1], [2,1], [1,2], [2,2] ]),

        tub:     new Pattern([ [1,0], [0,1], [2,1], [1,2] ]),

        beehive: new Pattern([ [2,1], [3,1], [1,2], [4,2], [2,3], [3,3] ]),

        blinker: new Pattern([ [1,0], [1,1], [1,2] ]),

        LWSS:    new Pattern([ [0,0], [3,0], [4,1], [0,2], [4,2], [1,3], [2,3], [3,3], [4,3] ]),

        EaterAndGlider: new Pattern([ 
            // the glider
            [3,0], [3,1], [5,1], [3,2], [4,2],

            // the block
            [7,4], [8,4], [7,5], [8,5],

            // the eater head
            [3,5], [2,6], [4,6], [3,7],

            // the eater tail
            [1,7], [1,8], [0,9], [1,9]
        ]),

        EaterAndGliderWithGliderCloser: new Pattern([ 
            // the glider
            [2,0], [4,0], [2,1], [3,1], [3,2],

            // the block
            [7,3], [8,3], [7,4], [8,4],

            // the eater head
            [3,4], [2,5], [4,5], [3,6],

            // the eater tail
            [1,6], [1,7], [0,8], [1,8]
        ]),

        GosperGliderGun: new Pattern([ 

            // left block
            [0,4], [1,4], [0,5], [1,5],

            // right block
            [34,2], [35,2], [34,3], [35,3],

            // left part of left queen bee
            [13,2], [12,2], [11,3], [10,4], [10,5], [10,6], [11,7], [12,8], [13,8],
            // dot in middle of left qb
            [14,5],
            // right part of left qb
            [15,3], [16,4], [16,5], [17,5], [16,6], [15,7],

            // left part of right queen bee
            [22,1], [20,2], [21,2], [20,3], [21,3], [20,4], [21,4], [22,5],
            // right parts of right QB
            [24,0], [24,1], [24,5], [24,6] 

        ]),

        Octagon2: new Pattern('3b2o3b$2bo2bo2b$bo4bob$o6bo$o6bo$bo4bob$2bo2bo2b$3b2o!'),

        QueenBeeShuttle: new Pattern('9bo12b$7bobo12b$6bobo13b$2o3bo2bo11b2o$2o4bobo11b2o$7bobo12b$9bo!'),

        Pulsar: new Pattern('2b3o3b3o2b2$o4bobo4bo$o4bobo4bo$o4bobo4bo$2b3o3b3o2b2$2b3o3b3o2b$o4bob o4bo$o4bobo4bo$o4bobo4bo2$2b3o3b3o!'),

        // requires a 16 x 19 grid to display its evolution properly
        Pentadecathlon: new Pattern('3$3b2bo4bo2b$3b2ob4ob2o$3b2bo4bo!'),

        KickbackReaction: new Pattern('5bo$6b2o$b2o2b2o$obo$2bo!'),

        /*
        P60 relay (two pentadecathlons and a glider.)
            ...........................O....O..
            ................OO.......OO.OOOO.OO
            .................OO........O....O..
            ................O..................
            ..O....O...........................
            OO.OOOO.OO.........................
            ..O....O...........................
        requires being centered in a 41 x 13 grid to display its evolution properly
        */
        P60Relay: 
            new Pattern('3$3b27bo4bo$3b16b2o7b2ob4ob2o$3b17b2o8bo4bo$3b16bo$3b2bo4bo$3b2ob4ob2o$3b2bo4bo!'),

        /*
        Pentadecathlon glider synthesis
        needs a bounding box of 16 x 9
        show 29 steps
        http://www.ericweisstein.com/encyclopedias/life/GliderSynthesis.html
        http://conwaylife.com/wiki/Pentadecathlon
        */
        GliderSynthesisPentadecathlon: new Pattern('6bo$6bobo$6b2o2$3o$2bo$bo5b2o$8b2o$7bo!'),


        /*
           e.g. of production of structures from 'random' patterns
           ends up producing a single blinker. and everything but it dying 
           out.
            ....o
            .o.o
            oo.oo
            ..oo
            ....o
            ...o

            showing its evolution requires 12 steps
            and a grid 6 wide and 9 high, with the pattern shown
            above positioned in the grid's top left corner.
        */
        StructureFromRandomness1: new Pattern('4bo$bobo$2ob2o$2b2o$4bo$3bo!')

    };




    function Universe(pattern) {

        this.board = pattern;

        this.boardSnapshots = [ this.board ];  // the state of the board at each moment

        // for each moment, and each atom in it, its child atoms in following moment.
        this.snapshotChildren = new AtomParentOrChildRelations();

        this.time = 0;

        this.getPattern = function() {
            return this.board;
        }

        this.next = function() {
            var newBoard = [];
            var influencedCells = this.getInfluencedCells();
            var causedAtom;
            for (var i = 0; i < influencedCells.length; i++) {
                cell = influencedCells[i];
                causedAtom = cell.slice(0);
                neighbourCount = this.neighbouringAtomCount(cell);

                var causingAtoms;

                if ( this.hasAtom(cell) ) {
                    if ( neighbourCount >= 2 && neighbourCount <= 3 ) {

                        causingAtoms = [ cell ].concat( this.getNeighbouringAtoms(cell) );
                        this._addCausedAtomAndCausalRelations(causingAtoms,causedAtom,newBoard);

                    }
                } else {
                    if ( neighbourCount == 3 ) {

                        causingAtoms = this.getNeighbouringAtoms(cell);
                        this._addCausedAtomAndCausalRelations(causingAtoms,causedAtom,newBoard);

                    }
                }
            }
            this.time++;
            this.board = newBoard;
            this.boardSnapshots[this.time] = this.board;
        }


        this._addCausedAtomAndCausalRelations = function(causingAtoms,causedAtom,newBoard) {
            newBoard.push( causedAtom );
            for (var i = 0; i < causingAtoms.length; i++) {

                var causingAtom = causingAtoms[i];
                this.snapshotChildren.addRelations(this.time,causingAtom,causedAtom);

                // [and later we'll also add ancestor relns]... and remember for this 
                // we don't use this.time but this.time + 1!
                 
            };                        
        }



        this.getTime = function() {
            return this.time;
        }

        this.clone = function() {
            // Deep copy - see http://stackoverflow.com/a/122704 
            var cloneUniv = jQuery.extend(true, {}, this);
            return cloneUniv;
        }


        this.getInfluencedCells = function() {
            var influencedCells = [];
            var cell;
            for (var i = 0; i < this.board.length; i++) {
                var atomCell = this.board[i];
                addUniqueItems(influencedCells,this.getNeighbours(atomCell));
            }
            return influencedCells;
        }


        this.getNeighbouringAtoms = function(cell) {
            var neighbours = this.getNeighbours(cell);
            var neighbouringAtoms = [];
            for (var i = 0; i < neighbours.length; i++) {
                // don't need to push a copy, do i?
                if ( this.hasAtom(neighbours[i]) ) {
                    neighbouringAtoms.push(neighbours[i]);
                }
            }
            return neighbouringAtoms;
        }

        this.neighbouringAtomCount = function(cell) {
            return this.getNeighbouringAtoms(cell).length;
        }

        this.hasAtom = function(cell) {
            return containsSubArray(this.board,cell);
        }

        /*
         * this is really 'get neighbouring positions'
         */
        this.getNeighbours = function(cell) {
            var neighbours = [];
            var x = cell[0];
            var y = cell[1];
            neighbours.push( [ x - 1, y - 1 ] );
            neighbours.push( [ x - 1, y + 0 ] );
            neighbours.push( [ x - 1, y + 1 ] );
            neighbours.push( [ x + 0, y - 1 ] );
            neighbours.push( [ x + 0, y + 1 ] );
            neighbours.push( [ x + 1, y - 1 ] );
            neighbours.push( [ x + 1, y + 0 ] );
            neighbours.push( [ x + 1, y + 1 ] );
            return neighbours;
        }


        /*
         * REFACTORING: note that in this param is called 'atomPos' whereas
         * similar ones are called 'cell'
         * @toTime - show descendants up until, and including, this moment in time
         */
        this.getAtomsDescendants = function(time,atomPos,toTime) {
            
            var descendantsByTime = [];
            var currentAtoms = [atomPos];

            // it's 'time + 1' coz first descendants of atom is in next moment
            for (var t = time + 1; t <= toTime; t++) {

                descendantsByTime[t] = [];

                for (var j = 0; j < currentAtoms.length; j++) {
                    var currAtomPos = currentAtoms[j];
                    descendantsByTime[t] =
                        descendantsByTime[t].concat(
                            // 't-1' coz its parent was in prev moment
                            this.snapshotChildren.getRelatedAtomPositions(t-1,currAtomPos)
                        )
                    ;
                }

                currentAtoms = descendantsByTime[t];
            }

            return descendantsByTime;

        }



    }

 
    var AtomParentOrChildRelations = Class.extend({

        init: function() {

            // each entry is the an array.  the position of the entry indicates what time moment it is for.
            // e.g. entry for time 0 is the first entry in this array.
            // each entry is an array of two arrays - the first is of the atom position, and the second is of
            // its child or parent positions 
            this._relationsForMoments = [];

        },

        /*
         * Doesn't check whether relatedAtomPosition has already been entered.
         * If it has already, an additional entry for it will be added.
         */
        addRelations: function(time,atomPosition,relatedAtomPosition) {
            var relations = this._relationsForMoments[time];

            if (relations ==  undefined) {
                relations = [];
                this._relationsForMoments[time] = relations;
            }

            // check if there's already an entry for that atom position
            // and if not, create and add it
            var found = false;
            var i = 0;
            for (; i < relations.length; i++) {
                if ( relations[i][0].compareArrays(atomPosition) ) {
                    found = true;
                    break;
                }
            };
            var entryForAtom;
            if (found) {
                entryForAtom = relations[i];
            } else {
                entryForAtom = [ atomPosition, [] ];
                relations.push( entryForAtom );
            }

            entryForAtom[1].push(relatedAtomPosition);
        },

        /*
         * Assumes a valid time.
         */
        getRelatedAtomPositions: function(time,atomPosition) {
            var relations = this._relationsForMoments[time];
            for (var i = 0; i < relations.length; i++) {
                if ( relations[i][0].compareArrays(atomPosition) ) {
                    return relations[i][1];
                }
            };
            return [];
        },

    });



    var AbstractGrid = Class.extend({

        init: function(x,y,rows,cols,largeCellSize,smallCellSize,universe,timeStep) {

            this.timeStep = timeStep;

            this.rows = rows;
            this.cols = cols;
            this.largeCellSize = largeCellSize;
            this.smallCellSize = smallCellSize;
            this.universe = universe;

            this.x = x;
            this.y = y;
            this.x2 = this.x + this.getWidth(); // assuming large size 
            this.y2 = this.y + this.getHeight(); // assuming large size 


            this.lineStyle               = "rgba(0,0,0,1)";
            this.atomFillStyle           = "rgba(0,0,0,1)";
            this.cellHighlightStyle      = "rgba(0,0,255,0.5)";
            this.atomCellHighlightStyle  = "rgba(66,255,33,0.5)";
            this.threeByThreeFillStyle   = "rgba(0,0,200,0.5)";

            // display objects
            this.atoms = [];

            this.container = new Container();
            this.container.x = this.x;
            this.container.y = this.y;

            this.activeBG = new Shape();
            this.activeBG.alpha = 0;
            this.activeBG.x = 0;
            this.activeBG.y = 0;
            this.activeBG.compositeOperation = "destination-over";
            this.container.addChild(this.activeBG);
            
            //   drawing on top of the grid for some weird reason


            this.grid = new Shape();

            this.container.addChildAt(this.grid);
            // ^ fcking weird... if i change that to 'addChild' the activeBG gets put in front of the grid.


        },


        drawActiveBG: function() {
            var x = -this.getCellSize();
            var y = -this.getCellSize();
            var width  = this.getWidth()+(2*this.getCellSize());
            var height = this.getHeight()+(2*this.getCellSize());
            this.activeBG.graphics
                .beginFill("#CCFFB2")
                .rect(x,y,width,height)
                .endFill()
            ;
            
            this.activeBG.cache(x,y,width,height);
        },
                  

        getAtomRadius: function(isSmall) {
           var radius = this.getCellSize(isSmall)/2 - this.largeCellSize/6;
           return radius;
        },
        

        // used by both grid and updateSquare
        getCellSize: function(isSmall) {
            if (isSmall) return this.smallCellSize;
            else return this.largeCellSize;
        },


        getWidth: function(isSmall) {
            return this.getCellSize(isSmall) * this.cols;
        },

        getHeight: function(isSmall) {
            return this.getCellSize(isSmall) * this.rows;
        },

        drawGrid: function(isSmall) {

            this.drawActiveBG();

            this.grid.graphics.moveTo(this.x,this.y).beginStroke("#000000");
                
            // draw rows
            var currY = 0;
            var endX = this.cols*this.getCellSize(isSmall);
            for (var r = 0; r <= this.rows; r++) {
                this.grid.graphics.moveTo(0,currY).lineTo(endX,currY);
                currY += this.getCellSize(isSmall);
            }

            // draw cols
            var currX = 0;
            var endY = this.rows*this.getCellSize(isSmall);
            for (var c = 0; c <= this.cols; c++) {
                this.grid.graphics.moveTo(currX,0).lineTo(currX,endY);
                currX += this.getCellSize(isSmall);
            }

            this.grid.graphics.endStroke();

            this._drawFadeOutGridLines(isSmall);



            this.grid.cache(
                -this.getCellSize(isSmall),
                -this.getCellSize(isSmall),
                endX+2*this.getCellSize(isSmall),
                endY+2*this.getCellSize(isSmall)
            );


        },

        _drawFadeOutColumns: function(y,y2,isSmall) {

            this.grid.graphics.beginLinearGradientStroke(["#000",gridBGColour], [0, 1], 0, y, 0, y2);
            var currX = 0;
            for (var c = 0; c <= this.cols; c++) {
                this.grid.graphics.moveTo(currX,y).lineTo(currX,y2);
                currX += this.getCellSize(isSmall);
            }
            this.grid.graphics.endStroke();
        },


        _drawFadeOutRows: function(x,x2,isSmall) {

            this.grid.graphics.beginLinearGradientStroke(["#000",gridBGColour], [0, 1], x, 0, x2, 0);
            currY = 0;
            for (var r = 0; r <= this.rows; r++) {
                this.grid.graphics.moveTo(x,currY).lineTo(x2,currY);
                currY += this.getCellSize(isSmall);
            }
            this.grid.graphics.endStroke();
        },


        _drawFadeOutGridLines: function(isSmall) {

            // top fade-out columns
            var y = 0;
            var y2 = -this.getCellSize(isSmall);
            this._drawFadeOutColumns(y,y2,isSmall);

            // bottom fade-out columns
            y = this.getHeight(isSmall);
            y2 = y + this.getCellSize(isSmall);
            this._drawFadeOutColumns(y,y2,isSmall);

            // draw left fade-out rows
            var x = 0;
            var x2 = -this.getCellSize(isSmall);
            this._drawFadeOutRows(x,x2,isSmall);

            // draw right fade-out rows
            x = this.getWidth(isSmall);
            x2 = x + this.getCellSize(isSmall);
            this._drawFadeOutRows(x,x2,isSmall);

        },

        // used by both grid and updateSquare
        addAtom: function(position,atomGraphic) {
            if (this.atoms == null) this.atoms = [];
            this.atoms.push( [ position, atomGraphic ] );
        },


        // used by both grid and updateSquare
        getAtom: function(position) {
            for (var i = 0; i < this.atoms.length; i++) {
                if ( this.atoms[i][0].compareArrays(position) ) {
                    return this.atoms[i][1];
                }
            }
            return null;
        },


        // used by both grid and updateSquare
        /*
            if atom's position isn't on the board, don't draw it
        */
        drawAtomInCell: function(x,y,atomCellX,atomCellY,isSmall) {
            var atomWithinBoard = 
                ( atomCellX >= 0 && atomCellX < this.cols && atomCellY >= 0 && atomCellY < this.rows )
            ;
            if (atomWithinBoard) {
                var cellSize = this.getCellSize(isSmall);
                var atomCenterX = x + atomCellX*cellSize + cellSize/2;
                var atomCenterY = y + atomCellY*cellSize + cellSize/2;

                var atom = new Shape();
                var radius = this.getAtomRadius(isSmall);
                atom.graphics.beginFill(this.atomFillStyle)
                    .arc(atomCenterX,atomCenterY,radius,0,Math.PI*2,false).endFill();

                atom.cache(
                    atomCenterX-radius,
                    atomCenterY-radius,
                    atomCenterX+radius,
                    atomCenterY+radius
                );

                return atom;
            }
            return null;
        },


        // new: added to try it out....
        drawCellHighlighted: function(cellX,cellY,isSmall,highlightColour) {
            var cellWithinBoard =
                ( cellX >= 0 && cellX < this.cols && cellY >= 0 && cellY < this.rows )
            ;
            if (cellWithinBoard) {
                var cellSize = this.getCellSize(isSmall);
                var highlight = new Shape();
                highlight.graphics
                    .beginFill(highlightColour)
                    .rect(cellX*cellSize + 1,cellY*cellSize + 1,cellSize - 2,cellSize - 2)
                    .endFill()
                ;
                highlight.alpha = 0.5;
                return highlight;
            }
            return null;
        },


        // used by both grid and updateSquare
        getGridTLCx: function(catchmentCenterCellX) {
            var gridTLCx;
            gridTLCx = 0 - ((catchmentCenterCellX-1) * this.getCellSize());
            return gridTLCx;
        },


        // used by both grid and updateSquare
        getGridTLCy: function(catchmentCenterCellY) {
            var gridTLCy;
            gridTLCy = 0 - ((catchmentCenterCellY-1) * this.getCellSize());
            return gridTLCy;
         },


        showActiveBGTween: function() {
            var tween;
            tween = sequencer.getPausedTween(this.activeBG)
                        .to({alpha:1},200)
            ;
            return tween;
        },
        
        hideActiveBGTween: function() {
            var tween;
            tween = sequencer.getPausedTween(this.activeBG)
                        .to({alpha:0},200)
            ;
            return tween;
        },


        topPosToOffScreenTween: function(duration) {
            var tween;
            tween = sequencer.getPausedTween(this.container)
                        .to({y:topGridY})
                        .to({y:offTopOfScreenGridY},duration)
            ;
            return tween;
        },


        bottomPosToTopPosTween: function(duration) {
            var tween;
            tween = sequencer.getPausedTween(this.container)
                        .to({y:bottomGridY})
                        .to({y:topGridY},duration)
            ;
            return tween;
        },

        offScreenToBottomPosTween: function(duration) {
            var tween;
            tween = sequencer.getPausedTween(this.container)
                        .to({y:offBottomOfScreenGridY})
                        .to({y:bottomGridY},duration)
            ;
            return tween;
        },


    });


    var Grid = AbstractGrid.extend({

        drawPattern: function(isSmall) {
            if (this.universe != null) {
                var pattern = this.universe.getPattern();
                var atom;
                for (var i = 0; i < pattern.length; i++) {
                    atom = this.drawAtomInCell(0,0,pattern[i][0],pattern[i][1],isSmall);
                    if (atom != null) {
                        this.addAtom(pattern[i], atom); 
                        this.container.addChildAt(atom);

                        // ^ temp testing of 'addChildAt' with just a single param helps
                        // ***** stoopid if it does
                    }
                }
            }
        }

    });



    /**
     * Iterates through 'outer' cell positions of 3x3 grid (i.e. does not visit central cell),
     * starting from bottom-left corner and moving in a clockwise direction.
     */
    function ClockwiseFromBLCCatchmentIterator(catchmentCenterCellX,catchmentCenterCellY) {

        this.catchmentCenterCellX = catchmentCenterCellX;
        this.catchmentCenterCellY = catchmentCenterCellY;

        this.row = catchmentCenterCellY + 1; 
        this.col = catchmentCenterCellX + 2; // so the first call to getNext returns the first (0th) column 
        
        this.getNext = function() {

            var next;

            var isBottomRow   = ( this.row == this.catchmentCenterCellY + 1 );
            var isMiddleRow   = ( this.row == this.catchmentCenterCellY );
            var isLeftColumn  = ( this.col == this.catchmentCenterCellX - 1 );
            var isRightColumn = ( this.col == this.catchmentCenterCellX + 1 );
            if (isBottomRow) {
                if (isLeftColumn) {
                    this.row = this.catchmentCenterCellY;
                } else {
                    this.col--;
                }
            } else if (isMiddleRow) {
                if (isLeftColumn) {
                    this.row--;
                }
            } else { // top row
                if (isRightColumn) {
                    this.row++;
                } else {
                    this.col++;
                }
            }

            return [this.col,this.row];

        }

        this.hasNext = function() {

            return !( (this.col == this.catchmentCenterCellX + 1) && (this.row == this.catchmentCenterCellY) );

        }

    }

    /**
     * Iterates through grid positions, starting in top left, moving left-to-right, row-by-row.
     *
     * Note this is diff to the version in the earlier files.  In those 
     * the first call to getNext would get you the second position!!!
     * so I'll need to update the code that refer to old version of it to work with new version!
     */
    function RowByRowGridIterator(grid) {

        this.grid = grid;

        this.row = 0; 

        this.col = -1; // so the first call to getNext returns the first (0th) column 

        this.getNext = function() {

            var next;

            if (this.col < (this.grid.cols - 1)) {
                this.col++;
            } else if (this.row < (this.grid.rows - 1)) {
                this.row++;
                this.col = 0;
            } else {
                return null;
            }

            return [this.col,this.row];

        }

        this.hasNext = function() {

            return ( (this.col < (this.grid.cols - 1)) || (this.row < (this.grid.rows - 1)) );

        }

    }


            
    function DispGol() {

        /*
          processes divs with dispGol class.
          passes the handling of their rendering to the appropriate class.
        */
        this.process = function() {

            $("div.dispGol").each(function() { 

                var dispType = $(this).attr('display');

                if (dispType.toUpperCase() == "UPDATER") {
                    var updaterAnimation = new UpdaterAnimation(this);
                    updaterAnimation.start();
                }
                else if (dispType.toUpperCase() == "CAUSALRELATIONS" ) {
                    var causalRelationsDiagram = new CausalRelationsDiagram(this);
                    causalRelationsDiagram.show();

                } else {
                    alert("DispGol, ERROR: unrecognised @display: " + dispType);
                }

            });

        }
    }



    $(document).ready(function() {
        var dispGol = new DispGol();
        dispGol.process();
    });



