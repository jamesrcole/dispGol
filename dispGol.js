
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
        */
        this.calculatePosArray = function(patternRLE) {

            var currRow = 0;
            var currCol = 0;   // col the _next_ item will go into
            var strPos = 0;    // curr pos within RLE string
            var c = patternRLE.charAt(strPos);
            var numberOf = 1;
            var numPatt = /\d+/g;
            var whitespacePatt = /\s+/g;
            while ( c != '!' ) {
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

        KickbackReaction: new Pattern('5bo$6b2o$b2o2b2o$obo$2bo!')

    };

    /*
       @pathSpec - an array of coordinates, where each coordinate is a struct 
                   of the form {x:int,y:int}
       Dependent upon Sequencer instance called sequencer
    */
    function AnimPath( dispObj, pathSpec ) {
        this.dispObj = dispObj;
        this.pathSpec = pathSpec.slice(0);
        this.idx = 0;
        this.dispObj.x = this.pathSpec[0].x;
        this.dispObj.y = this.pathSpec[0].y;
        this.dispObj.visible = false;

        // Next tween on the path.
        // Loops, so after it has gone to the last position it'll start all over again.
        // Note that it *won't* animate from the last position back to the first position.
        this.nextTween = function(duration,dispObj) {
            if (dispObj == null) { dispObj = this.dispObj; }
            var tween = sequencer.getPausedTween(dispObj);
            if (this.idx == 0) { tween.set({visible:true}); }
            this.idx++;

            var prev,curr;
            if (this.idx == this.pathSpec.length) { 
                this.idx = 0;
                prev = this.pathSpec.length-1;
            } else {
                prev = this.idx - 1;
            }
            curr = this.idx;

            var path = this.pathSpec;
            tween
                .to({x:path[prev].x, y:path[prev].y})
                .to({x:path[curr].x, y:path[curr].y},duration)
            ;
            return tween;
        }

        this.getTween = function(fromPathPos,toPathPos,duration,dispObj) {
            if (dispObj == null) { dispObj = this.dispObj; }
            var tween = sequencer.getPausedTween(dispObj);
            tween
                .to({x:this.pathSpec[fromPathPos].x, y:this.pathSpec[fromPathPos].y})
                .to({x:this.pathSpec[toPathPos].x, y:this.pathSpec[toPathPos].y},duration)
            ;
            return tween;
        }

    }


    /* 
       Requires the array flattening func
            flatten(array)
    */
    function Sequencer() {

        this._lastTween = null;
        this._firstTweens = null;  // could be one or more

        this.getPausedTween = function(dispObj) {
            var tween;
            tween = Tween.get(dispObj);
            tween.setPaused(true);
            return tween;
        }

        this.register = function(tween) {
            if (this._firstTweens == null) {
                this._firstTweens = [ tween ];
            } else {
                this._lastTween.play(tween);
            }
            this._lastTween = tween;
        }

        // @tweens - an array of tweens.  can contain nested arrays - will be flattened.
        // ** NOTE: a limitation of this is that it will play the next registered
        //          tween after the last of these tweens has played.... whereas perhaps it
        //          should only do so after all of these have finished!  that is, after the 
        //          longest of these has finished@
        this.registerConcurrent = function(tweens) {
            var flattenedTweensArray = flatten(tweens);
            if (this._firstTweens == null) {
                this._firstTweens = flattenedTweensArray;
            } else {
                for (var i = 0; i < flattenedTweensArray.length; i++) {
                    this._lastTween.play(flattenedTweensArray[i]);
                }
            }
            var longestDuration = 0;
            var longestDurationTween = null;
            for (var i = 0; i < flattenedTweensArray.length; i++) {
                if (flattenedTweensArray[i].duration >= longestDuration) {
                    longestDuration = flattenedTweensArray[i].duration;
                    longestDurationTween = flattenedTweensArray[i];
                }
            }
            //this._lastTween = flattenedTweensArray[flattenedTweensArray.length - 1];
            this._lastTween = longestDurationTween;
        }


        /* should only be called after at least one set of tween(s) have been registered 
           (register/registerConcurrent) with this sequencer. */
        this.start = function() {
            for (var i = 0; i < this._firstTweens.length; i++) {
                Tween.get().play(this._firstTweens[i]);
            }
        }

    }



    function Universe(pattern) {

        this.board = pattern;

        this.time = 0;

        this.getPattern = function() {
            return this.board;
        }

        this.next = function() {
            this.time++;
            var newBoard = [];
            var influencedCells = this.getInfluencedCells();
            var cellCopy;
            for (var i = 0; i < influencedCells.length; i++) {
                cell = influencedCells[i];
                cellCopy = cell.slice(0);
                neighbourCount = this.neighbouringAtomCount(cell);
                if ( this.hasAtom(cell) ) {
                    if ( neighbourCount >= 2 && neighbourCount <= 3 ) {
                        newBoard.push( cellCopy );
                    }
                } else {
                    if ( neighbourCount == 3 ) {
                        newBoard.push( cellCopy );
                    }
                }
            }
            this.board = newBoard;
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

        this.neighbouringAtomCount = function(cell) {
            var count = 0;
            var neighbours = this.getNeighbours(cell);
            for (var i = 0; i < neighbours.length; i++) {
                if ( this.hasAtom(neighbours[i]) ) count++;
            }
            return count;
        }

        this.hasAtom = function(cell) {
            return containsSubArray(this.board,cell);
        }

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

    }

 
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

            this.container2 = new Container();
            this.activeBG = new Shape();
            this.activeBG.alpha = 0;
            this.activeBG.x = 0;
            this.activeBG.y = 0;
            this.activeBG.compositeOperation = "destination-over";
            this.container2.addChild(this.activeBG);
            this.container.addChild(this.container2);
            // ^ without that container2, even though activeBG was the first thing being added, it was
            //   drawing on top of the grid for some weird reason


            this.grid = new Shape();

            this.container.addChildAt(this.grid);
            // ^ fcking weird... if i change that to 'addChild' the activeBG gets put in front of the grid.


        },


        drawActiveBG: function() {
            this.activeBG.graphics
                .beginFill("#CCFFB2")
                .rect(
                    -this.getCellSize(),
                    -this.getCellSize(),
                    this.getWidth()+(2*this.getCellSize()),
                    this.getHeight()+(2*this.getCellSize())
                )
                .endFill()
            ;
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
            if ( atomCellX >= 0 && atomCellX < this.cols && atomCellY >= 0 && atomCellY < this.rows) {
                var atomCenterX = x + (atomCellX*this.getCellSize(isSmall)) + (this.getCellSize(isSmall)/2);
                var atomCenterY = y + (atomCellY*this.getCellSize(isSmall)) + (this.getCellSize(isSmall)/2);

                var atom = new Shape();
                atom.graphics.beginFill(this.atomFillStyle)
                    .arc(atomCenterX,atomCenterY,this.getAtomRadius(isSmall),0,Math.PI*2,false).endFill();

                return atom;
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


    var UpdateSquare = AbstractGrid.extend({

        init: function(x,y,rows,cols,largeCellSize,smallCellSize,universe,updater) {

            this._super(x,y,rows,cols,largeCellSize,smallCellSize,universe);

            this.backgroundColour = "white";

            this.centralCount = "";
            this.catchmentCount = "";

            // display objects
            this.iccBounds;
            this.centralCountLabel;
            this.catchmentCountLabel;

            this.matchShape = new Shape();
            this.matchShape.alpha = 0;

            this.noMatchShape = new Shape();
            this.noMatchShape.alpha = 0;


            // for the {ZeroThree,OneTwo,OneThree}Condition objects, it will be null...
            if (updater != null) {

                this.updater = updater;

                this._countComponentPenX = updater.countComponent.pen.x;
                this.inCountComponentX = this._countComponentPenX + largeGridCellSize;


                this.threeSquareInMatchComponentY = 
                    this.updater.matchComponent.pen.y + this.largeCellSize/2
                ;

                this.oneTwoConditionX = 
                    this.updater.matchComponent.container.localToLocal(
                        this.updater.matchComponent.atomInNextMomentConditionsRow.oneTwoCondition.x,
                        0,
                        this.updater.container
                    ).x
                ;
                this.oneThreeConditionX = 
                    this.updater.matchComponent.container.localToLocal(
                        this.updater.matchComponent.atomInNextMomentConditionsRow.oneThreeCondition.x,
                        0,
                        this.updater.container
                    ).x
                ;

            }


            this.path = [ 
                {x:this.x,                 y:this.y},
                {x:this.inCountComponentX, y:this.y},
                {x:this.inCountComponentX, y:this.threeSquareInMatchComponentY},
                {x:this.oneTwoConditionX,  y:this.threeSquareInMatchComponentY},
                {x:this.oneThreeConditionX, y:this.threeSquareInMatchComponentY}
            ];
            this.animPath = new AnimPath(this.container,this.path);


        },


        drawAllOfCatchmentArea: function(catchmentCenterCellX,catchmentCenterCellY) {

            var background = new Shape();
            var w = this.getCellSize()*3;
            var h = w;
            if (this.backgroundColour == null) { this.backgroundcolour = nearWhite };
            background.graphics.beginFill(this.backgroundColour).rect(0,0,w,h).endFill();
            this.container.addChild(background);


            this.container.x = this.x;
            this.container.y = this.y;

            this.drawBoundariesOfInnerCellAndCatchment();

            this.drawAtomsInCatchmentSquare(catchmentCenterCellX,catchmentCenterCellY);

            this.centralCountLabel = this.drawCentralCount(catchmentCenterCellX,catchmentCenterCellY);
            this.catchmentCountLabel = this.drawCatchmentCount(catchmentCenterCellX,catchmentCenterCellY);

            this.container.addChild(this.matchShape);
            this.container.addChild(this.noMatchShape);

            this.container.addChild(this.iccBounds);

            var cellIter = new RowByRowGridIterator(this);
            var cellPos;
            var atomGraphic;
            while (cellIter.hasNext()) {
                cellPos = cellIter.getNext();
                atomGraphic = this.getAtom(cellPos);
                if (atomGraphic != null) {
                    this.container.addChild(atomGraphic);
                }
            }

            this.container.addChild(this.centralCountLabel);
            this.container.addChild(this.catchmentCountLabel);

            return this.container;
        },


        drawBoundariesOfInnerCellAndCatchment: function(isSmall) {
            var cellSize = this.getCellSize(isSmall);
            var catchmentWidth = cellSize*3;

            this.matchShape.graphics
                .beginStroke(matchColour)
                .rect(0,0,catchmentWidth,catchmentWidth)
                .rect(cellSize,cellSize,cellSize,cellSize)
                .endStroke()
            ;

            this.noMatchShape.graphics
                .beginStroke(noMatchColour)
                .rect(0,0,catchmentWidth,catchmentWidth)
                .rect(cellSize,cellSize,cellSize,cellSize)
                .endStroke()
            ;


            this.iccBounds = new Shape();

            this.iccBounds.graphics
                .beginStroke("#000000")
                .rect(0,0,catchmentWidth,catchmentWidth)
                .rect(cellSize,cellSize,cellSize,cellSize)
                .endStroke()
            ;
        },


        /*
        even though updateSquare is just a three by three square, it is 
        meant to be a square on the universe
        so the coordinates of its cells aren't

            0,0  1,0  2,0
            0,1  1,1  2,1
            0,2  1,2  2,2

        they are the coordinates of the grid cells, so if its top-left 
        square was at 2,1, it'd be

            2,1  3,1  4,1
            2,2  3,2  4,2
            2,3  3,3  4,3

        when it comes to drawing the atoms in the cells... it is calling 
        the same drawing method that draws to a usual grid.  so it won't 
        simply be drawing relative to the x and y of the updateSquare

        so it needs to determine where the x and y of the 'virtual grid' 
        would be.
         */
        drawAtomsInCatchmentSquare: function(catchmentCenterCellX,catchmentCenterCellY) {
            var atom;
            for (var cellY = catchmentCenterCellY - 1; cellY < catchmentCenterCellY + 2; cellY++) {
                for (var cellX = catchmentCenterCellX - 1; cellX < catchmentCenterCellX + 2; cellX++) {
                    if (this.universe != null && this.universe.hasAtom([cellX,cellY])) {
                        atom = 
                            this.drawAtomInCell(
                                this.getGridTLCx(catchmentCenterCellX),
                                this.getGridTLCy(catchmentCenterCellY),
                                cellX,
                                cellY
                            )
                        ;
                        if (atom != null) {
                            this.addAtom([cellX,cellY], atom); 
                        }
                    }
                }
            }
        },

        drawCentralCount: function(catchmentCenterCellX,catchmentCenterCellY) {
            var gridTLCx,gridTLCy;

            gridTLCx = this.getGridTLCx(catchmentCenterCellX);
            gridTLCy = this.getGridTLCy(catchmentCenterCellY);

            var label = new Text(this.centralCount, "16px Arial", "#222222");
            label.x = gridTLCx + catchmentCenterCellX*this.getCellSize() + this.getCellSize()/2.5;
            label.y = gridTLCy + catchmentCenterCellY*this.getCellSize() + this.getCellSize()/1.5;
            return label;
        },


        drawCatchmentCount: function(catchmentCenterCellX,catchmentCenterCellY) {
            var gridTLCx,gridTLCy;

            gridTLCx = this.getGridTLCx(catchmentCenterCellX);
            gridTLCy = this.getGridTLCy(catchmentCenterCellY);

            var label = new Text(this.catchmentCount, "16px Arial", "#222222");
            label.x = gridTLCx + (catchmentCenterCellX+1)*this.getCellSize() + this.getCellSize()/2.5;
            label.y = gridTLCy + (catchmentCenterCellY+1)*this.getCellSize() + this.getCellSize()/1.5;
            return label;
        },


        showTween: function() {
            var tween;
            tween = sequencer.getPausedTween(this.container)
                        .wait(100)
                        .to({visible:true});
            return tween;
        },


        moveToCountPenTween: function(threeSquareInCountComponentPenX) {
            var duration = 200;
            return this.animPath.nextTween(duration);
        },



        count: function(catchmentCenterCellX,catchmentCenterCellY) {

            var iter = new ClockwiseFromBLCCatchmentIterator(catchmentCenterCellX,catchmentCenterCellY); 

            var count = 0;

            var pos;
            var atomGraphic;

            var scaleAmt = 1.04;

            // central count
            pos = [catchmentCenterCellX,catchmentCenterCellY];
            atomGraphic = this.getAtom(pos);
            if (atomGraphic != null) {
                sequencer.register(
                    sequencer.getPausedTween(atomGraphic)
                        .to({scaleX:scaleAmt,scaleY:scaleAmt},90)
                );
                sequencer.registerConcurrent([
                    sequencer.getPausedTween(atomGraphic)
                        .to({alpha:0,scaleX:1,scaleY:1},90),
                    sequencer.getPausedTween(this.centralCountLabel)
                        .set({text:"1"})
                ]);
                this.centralCount = 1;
            } else {
                sequencer.register(
                    sequencer.getPausedTween(this.centralCountLabel)
                        .wait(90).set({text:"0"})
                );
                this.centralCount = 0;
            }


            if (this.centralCount != 0) {
                sequencer.register(
                    sequencer.getPausedTween(this.centralCountLabel)
                        .wait(120)
                );
            }


            // refactoring: set the labels to the value of the object's count variables! ****
            
            // catchmentCount
            var i = 0;
            while( iter.hasNext() && i < 10 ) {
                pos = iter.getNext();
                i++;
                atomGraphic = this.getAtom(pos);
                if (atomGraphic != null) {
                    count++;
                    // make them disappear
                    sequencer.register(
                        sequencer.getPausedTween(atomGraphic)
                            .wait(40)
                            .to({scaleX:scaleAmt,scaleY:scaleAmt},90)
                    );
                    sequencer.registerConcurrent([
                        sequencer.getPausedTween(atomGraphic)
                            .to({alpha:0,scaleX:1,scaleY:1},90),
                        sequencer.getPausedTween(this.catchmentCountLabel)
                            .set({text:count})
                    ]);
                }
            }
            // in case there are no atoms
            sequencer.register(
                sequencer.getPausedTween(this.catchmentCountLabel)
                    .wait(90)
                    .set({text:"" + count})
            );
            this.catchmentCount = count;


            // just to put a bit of a pause at the end of the counting
            sequencer.register(
                sequencer.getPausedTween(this.centralCountLabel)
                    .wait(100)
            );
            

        },

        moveToMatchPenTween: function() {
            var duration = 150;
            var tween;
            tween = this.animPath.nextTween(duration).wait(200);
            return tween;
        },


        getAtOneTwoConditionX: function() {
            var oneTwoConditionX = 
                this.updater.matchComponent.container.localToLocal(
                    this.updater.matchComponent.atomInNextMomentConditionsRow.oneTwoCondition.x,
                    0,
                    this.updater.container
                ).x
            ;
            return oneTwoConditionX;
        },

        getMoveToOneTwoConditionTween: function(duration) {
            return this.animPath.nextTween(duration).wait(100);
        },


        getMoveToOneThreeConditionTween: function(duration) {
            return this.animPath.nextTween(duration).wait(100);
        },

        dissolveTween: function(duration) {
            return sequencer.getPausedTween(this.container)
                        .to({alpha:0},duration)
                        .wait(300)
        },


        showMatchTween: function() {
            var tween;
            tween = sequencer.getPausedTween(this.matchShape)
                        .to({alpha:1},300)
                        .wait(300)
            ;
            return tween;
        },
        
        hideMatchTween: function() {
            var tween;
            tween = sequencer.getPausedTween(this.matchShape)
                        .to({alpha:0},50)
            ;
            return tween;
        },

        showNoMatchTween: function() {
            var tween;
            tween = sequencer.getPausedTween(this.noMatchShape)
                        .to({alpha:1},300)
                        .wait(300)
            ;
            return tween;
        },
        
        hideNoMatchTween: function() {
            var tween;
            tween = sequencer.getPausedTween(this.noMatchShape)
                        .to({alpha:0},300)
            ;
            return tween;

        }


    });



    function ClockwiseFromBLCCatchmentIterator(catchmentCenterCellX,catchmentCenterCellY) {

        this.catchmentCenterCellX = catchmentCenterCellX;
        this.catchmentCenterCellY = catchmentCenterCellY;

        this.row = catchmentCenterCellY + 1; 
        this.col = catchmentCenterCellX + 2; // so the first call to getNext returns the first (0th) column 
        
        this.getNext = function() {

            var next;

            if (this.row == this.catchmentCenterCellY + 1) {
                if (this.col == this.catchmentCenterCellX - 1) {
                    this.row = this.catchmentCenterCellY;
                } else {
                    this.col--;
                }
            } else if (this.row == this.catchmentCenterCellY) {
                if (this.col == this.catchmentCenterCellX - 1) {
                    this.row--;
                }
            } else {
                if (this.col == this.catchmentCenterCellX + 1) {
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

    /***
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




    function TopArm(updater,padding,cellSize,gridWidth,threeSquareWidth,threeSquareX,threeSquareY) { 

        this.updater = updater;
        this.threeSquareWidth = threeSquareWidth;
        this.armPadding = padding;

        this.x = threeSquareX - this.armPadding;
        this.rightPadding = cellSize * 3;
        // The cellSize/4 is so, on large grids, the left edge of updater body
        // doesn't sit flush with grid lines, which i think is a little 
        // aesthetically unpleasing.
        this.width = this.armPadding + cellSize*5 + this.rightPadding + cellSize/4;
        this.x2 = this.x + this.width;
        this.y = threeSquareY - this.armPadding;
        this.height = this.threeSquareWidth + (this.armPadding * 2);
        this.y2 = this.y + this.height;


        this.activeBG = new Shape();
        this.activeBG.visible = false;
        this.activeBG.x = this.x+1;
        this.activeBG.y = this.y+1;
        this.activeBG.graphics
            .beginFill(activeBGColour)
            .rect(0,0,this.width-2,this.height-2)
            .endFill()
        ;


        // temp measure!
        this.threeSquare = {
            y: threeSquareY
        }

        this.draw = function() {

            this.updater.container.addChild(this.activeBG);


            this.updater.shape.graphics
                .beginFill(this.updater.fillColour)
                .rect(this.x,this.y,this.width,this.height)
                .endFill()
            ;
            this.updater.shape.graphics
                .beginStroke("black")
                .moveTo(this.x2,this.y)
                .lineTo(this.x,this.y)
                .lineTo(this.x,this.y2)
                .lineTo(this.x2,this.y2)
                .endStroke()
            ;
            this.holeDims = {
                x: this.x + this.armPadding,
                y: this.y + this.armPadding,
                width: this.threeSquareWidth,
                height: this.threeSquareWidth,
                x2: null,
                y2: null
            }
            this.holeDims.x2 = this.holeDims.x + this.holeDims.width;
            this.holeDims.y2 = this.holeDims.y + this.holeDims.width;

            var hole = new Shape();
            hole.compositeOperation = "destination-out";
            hole.alpha = 1;
            hole.x = this.holeDims.x;
            hole.y = this.holeDims.y;
            hole.graphics
                .beginStroke("gray").beginFill("white")
                .rect(
                    0,
                    0,
                    this.holeDims.width,
                    this.holeDims.height
                )
                .endStroke().endFill()
            ;
            this.updater.container.addChild(hole);


            var holeHorizShadowLine = new Shape();
            holeHorizShadowLine.x = this.x + this.armPadding;
            holeHorizShadowLine.y = this.y + this.armPadding;
            holeHorizShadowLine.graphics
                .beginStroke("gray")
                .moveTo(0,0)
                .lineTo(this.threeSquareWidth,0)
                .endStroke()
            ;
            holeHorizShadowLine.shadow =
                new Shadow(
                    "black",
                    shadowOffset,
                    shadowOffset,
                    shadowBlur
                )
            ;
            this.updater.container.addChild(holeHorizShadowLine);


            var holeVertShadowLine = new Shape();
            holeVertShadowLine.x = this.x + this.armPadding;
            holeVertShadowLine.y = this.y + this.armPadding;
            holeVertShadowLine.graphics
                .beginStroke("gray")
                .moveTo(0,0)
                .lineTo(0,this.threeSquareWidth)
                .endStroke()
            ;
            holeVertShadowLine.shadow =
                new Shadow(
                    "black",
                    shadowOffset,
                    shadowOffset,
                    shadowBlur
                )
            ;
            this.updater.container.addChild(holeVertShadowLine);



            this.updater.shape.graphics
                .beginStroke("darkgray")
                .rect(
                    hole.x-1,
                    hole.y-1,
                    this.threeSquareWidth+2,
                    this.threeSquareWidth+2
                )
                .endStroke()
            ;


            var bottomShadowLine = new Shape();
            bottomShadowLine.x = this.x;
            bottomShadowLine.y = this.y2;
            bottomShadowLine.graphics
                .beginStroke("gray")
                .moveTo(0,0)
                .lineTo(this.width,0)
                .endStroke()
            ;
            bottomShadowLine.shadow =
                new Shadow(
                    "black",
                    outerShadowOffset,
                    outerShadowOffset,
                    outerShadowBlur
                )
            ;
            this.updater.container.addChild(bottomShadowLine);


            var guideLines = new Shape();
            guideLines.x = this.holeDims.x2 + this.updater.cellSize/2;
            guideLines.y = this.holeDims.y;
            var guideLinesWidth = this.x2 - guideLines.x;
            guideLines.graphics
                .beginStroke(guideLinesColour)
                .moveTo(0,0)
                .lineTo(guideLinesWidth,0)
                .moveTo(0,this.holeDims.height)
                .lineTo(guideLinesWidth,this.holeDims.height)
                .endStroke();
            ;
            this.updater.container.addChild(guideLines);

        }


        this.showActiveBGTween = function() {
            var tween;
            tween = sequencer.getPausedTween(this.activeBG)
                        .to({alpha:0,visible:true})
                        .to({alpha:1},250)
                        .wait(50)
            ;
            return tween;
        } 
        

        this.hideActiveBGTween = function() {
            var tween;
            tween = sequencer.getPausedTween(this.activeBG)
                        // .wait(4800)
                        .to({alpha:0},400)
                        // .wait(500)
                        // .to({visible:false})
            ;
            return tween;
        } 
    }


    function BottomArm(updater,padding,cellSize) { 

        this.updater = updater;

        this.activeBG = new Shape();
        this.activeBG.alpha = 0;

        this.armPadding = padding;
        this.cellSize = cellSize;

        this.x = updater.topArm.x;
        this.width = updater.topArm.width;
        this.x2 = this.x + this.width;

        // this might be slightly off***
        this.y = updater.addAtomPen.y;

        this.height = this.cellSize + (this.armPadding * 2);
        this.y2 = this.y + this.height;


        this.cellHole = {
            x:     this.x + this.armPadding*2,
            y:     this.y + this.armPadding,
            width: this.cellSize,
            x2:    null,
            y2:    null
        }; 
        this.cellHole.x2 = this.cellHole.x + this.cellHole.width;
        this.cellHole.y2 = this.cellHole.y + this.cellHole.width;



        this.guideLinesDims = {
            x: this.cellHole.x2 + this.updater.padding/2,
            y: this.updater.addAtomPen.guideLinesDims.y,
            width: null,
            height: this.updater.addAtomPen.guideLinesDims.height
        }
        this.guideLinesDims.width  = this.x2 - this.guideLinesDims.x;
        
        this.guideLines = new Shape();
        this.guideLines.x = this.guideLinesDims.x;
        this.guideLines.y = this.guideLinesDims.y;
        this.guideLines.graphics
            .beginStroke(guideLinesColour)
            .moveTo(0,0)
            .lineTo(this.guideLinesDims.width,0)
            .moveTo(0,this.guideLinesDims.height)
            .lineTo(this.guideLinesDims.width,this.guideLinesDims.height)
            .endStroke()
        ;




        this.draw = function() {

            this.updater.container.addChild(this.activeBG);
            this.updater.container.addChild(this.guideLines);


            this.updater.shape.graphics
                .beginFill(this.updater.fillColour)
                .rect(this.x,this.y,this.width,this.height)
                .endFill()
            ;
            this.updater.shape.graphics
                .beginStroke("black")
                .moveTo(this.x2,this.y2)
                .lineTo(this.x,this.y2)
                .lineTo(this.x,this.y)
                .lineTo(this.x2,this.y)
                .endStroke()
            ;

            this.activeBG.graphics
                .beginFill(activeBGColour)
                .rect(this.x+1,this.y+1,this.width-2,this.height-2)
                .endFill()
            ;


            var hole = new Shape();
            hole.compositeOperation = "destination-out";
            hole.alpha = 1;
            hole.x = this.cellHole.x
            hole.y = this.cellHole.y
            hole.graphics
                .beginStroke("gray").beginFill("white")
                .rect(
                    0,
                    0,
                    this.cellHole.width,
                    this.cellHole.width
                )
                .endStroke().endFill()
            ;
            this.updater.container.addChild(hole);


            this.updater.shape.graphics
                .beginStroke("darkgray")
                .rect(
                    this.cellHole.x-1,
                    this.cellHole.y-1,
                    this.cellHole.width+2,
                    this.cellHole.width+2
                )
                .endStroke()
            ;



            var holeHorizShadowLine = new Shape();
            holeHorizShadowLine.x = this.cellHole.x;
            holeHorizShadowLine.y = this.cellHole.y;
            holeHorizShadowLine.graphics
                .beginStroke("gray")
                .moveTo(0,0)
                .lineTo(this.cellHole.width,0)
                .endStroke()
            ;
            holeHorizShadowLine.shadow =
                new Shadow(
                    "black",
                    shadowOffset,
                    shadowOffset,
                    shadowBlur
                )
            ;
            this.updater.container.addChild(holeHorizShadowLine);


            var holeVertShadowLine = new Shape();
            holeVertShadowLine.x = this.cellHole.x;
            holeVertShadowLine.y = this.cellHole.y;
            holeVertShadowLine.graphics
                .beginStroke("gray")
                .moveTo(0,0)
                .lineTo(0,this.cellHole.width)
                .endStroke()
            ;
            holeVertShadowLine.shadow =
                new Shadow(
                    "black",
                    shadowOffset,
                    shadowOffset,
                    shadowBlur
                )
            ;
            this.updater.container.addChild(holeVertShadowLine);



            var bottomShadowLine = new Shape();
            bottomShadowLine.x = this.x;
            bottomShadowLine.y = this.y2;
            bottomShadowLine.graphics
                .beginStroke("gray")
                .moveTo(0,0)
                .lineTo(this.width,0)
                .endStroke()
            ;
            bottomShadowLine.shadow =
                new Shadow(
                    "black",
                    outerShadowOffset,
                    outerShadowOffset,
                    outerShadowBlur
                )
            ;
            this.updater.container.addChild(bottomShadowLine);

        }

        this.showActiveBGTween = function() {
            var tween;
            tween = sequencer.getPausedTween(this.activeBG)
                        .to({alpha:1},400)
                        .wait(200);
            return tween;
        }

        this.hideActiveBGTween = function() {
            var tween;
            tween = sequencer.getPausedTween(this.activeBG)
                        .to({alpha:0},200)
                        // it's really weird.. if i put wait(5000), and then have a .to({alpha:0},500)
                        // it seems to ignore the wait.... why????... instead it seems to wait _after_
                        // the alpha....
            ;
            return tween;
        }
    }

    

    function CountComponentPen(updater,countComponent,threeSquareWidth) {

        this.countComponent = countComponent;

        this.x = countComponent.x + updater.padding;
        this.y = countComponent.y + updater.padding;

        this.width =  threeSquareWidth + updater.padding*2
        this.height = threeSquareWidth + updater.padding*2
        this.x2 = this.x + this.width;
        this.y2 = this.y + this.height;

        this.updater = updater;

        this.shape = new Shape();

        this.activePen = new Shape();
        this.activePen.visible = false;

        // draw on countComponent shape
        this.draw = function() {

            this.shape.x = this.x;
            this.shape.y = this.y;
            this.shape.graphics
                .beginStroke("black")
                .drawRoundRect(0,0,this.width,this.height,this.updater.roundedCnrRadius)
                .endStroke();
            this.shape.shadow = new 
                Shadow(
                    "black",
                    shadowOffset,
                    shadowOffset,
                    shadowBlur
                )
            ;

            this.activePen.x = this.x;
            this.activePen.y = this.y;
            this.activePen.graphics
                .beginStroke(activeColour)
                .drawRoundRect(0,0,this.width,this.height,this.updater.roundedCnrRadius)
                .endStroke()
            ;

        }


        this.showActivePenTween = function() {
            var tween;
            tween = sequencer.getPausedTween(this.activePen)
                        .to({alpha:0})
                        .to({visible:true},50)
                        .to({alpha:1},400)
                        .wait(100);
            return tween;
        }


        this.hideActivePenTween = function() {
            var tween;
            tween = sequencer.getPausedTween(this.activePen)
                        .to({visible:false},100);
            return tween;
        } 


    }
 

    /*
       A separate shape.  Because we want to change its colour while three square is in it
    */
    function CountComponent(updater) {

        this.container = new Container();

        this.activeBG = new Shape();
        this.activeBG.visible = false;
        this.container.addChild(this.activeBG);

        this.shape = new Shape();
        this.container.addChild(this.shape);

        this.updater = updater;


        this.x = updater.updaterBody.x + updater.padding;
        this.y = updater.topArm.threeSquare.y - updater.padding*2;

        this.pen = new CountComponentPen(updater,this,updater.updateSquareWidth);

        this.width = this.pen.width + updater.padding*2;
        this.height = this.pen.height + updater.padding*2;
        this.x2 = this.x + this.width;
        this.y2 = this.y + this.height;

        this.inToGap = (this.height - updater.updateSquareGapWidth) / 2;


        this.draw = function() {

            this.shape.x = 0;
            this.shape.y = 0;
            this.container.x = this.x;
            this.container.y = this.y;


            this.activeBG.x = 0;
            this.activeBG.y = 0;
            this.activeBG.graphics
                .beginFill(activeBGColour)
                .rect(1,1,this.width-2,this.height-2)
                .endFill()
            ;

            this.shape.graphics
                .beginStroke(this.updater.innerBoundaryColour)
                .moveTo(0,0+this.inToGap)
                .lineTo(0,0)
                .lineTo(this.width,0)
                .lineTo(this.width,this.height)
                .lineTo(this.width-this.inToGap,this.height)
                .moveTo(0+this.inToGap,this.height)
                .lineTo(0,this.height)
                .lineTo(0,this.height-this.inToGap)
                .endStroke();
            ;


            var guideLines = new Shape();

            // refactoring: dodgy.. to bring it flush with edge of updater body.
            guideLines.x = -this.updater.padding;
            // refactoring: so dodgy... basically "hard-coding" this.

            var penPos =
                this.updater.container.localToLocal(this.pen.x2,this.pen.y,this.container)
            ;
            guideLines.y = penPos.y + this.updater.padding;

            // refactoring: ""

            var topGuideLineWidth = penPos.x - this.updater.padding - guideLines.x;

            var bottomGuideLineWidth = topGuideLineWidth - this.updater.updateSquareWidth;
            guideLines.graphics
                .beginStroke(guideLinesColour)
                .moveTo(0,0)
                .lineTo(topGuideLineWidth,0)
                .lineTo(topGuideLineWidth,this.height)
                .moveTo(0,this.updater.updateSquareWidth)
                .lineTo(bottomGuideLineWidth,this.updater.updateSquareWidth)
                .lineTo(bottomGuideLineWidth,this.height)
                .endStroke();
            ;
            this.container.addChild(guideLines);


            this.pen.draw();

        }


        this.showActiveBGTween = function() {
            var tween;
            tween = sequencer.getPausedTween(this.activeBG)
                        .wait(50)
                        .to({alpha:0,visible:true},50)
                        .to({alpha:1,visible:true},500)
                        .wait(50);
            return tween;
        }


        this.hideActiveBGTween = function() {
            var tween;
            tween = sequencer.getPausedTween(this.activeBG)
                        .wait(50)
                        .to({alpha:0},250)
            ;
            return tween;
        } 


    }

    function MatchComponentCurrThreeSquareRow(updater,matchComponent) {

        this.x = updater.padding*2;
        this.y = updater.padding;
        this.width = updater.updateSquareWidth*3 + updater.padding*2;
        this.height = updater.updateSquareWidth;
        this.x2 = this.x + this.width;
        this.y2 = this.y + this.height;

        this.draw = function() {

            // guideLines
            matchComponent.shape.graphics
                .beginStroke(guideLinesColour)
                .moveTo(this.x+updater.updateSquareWidth,this.y)
                .lineTo(this.x2,this.y)
                .lineTo(this.x2,this.y2)
                .lineTo(this.x,this.y2)
                .lineTo(this.x,this.y)
                .endStroke()
            ;
        }
    }

    var AtomCondition = Class.extend({

        init: function(updater,matchComponent,matchComponentAtomInNextMomentConditionsRow,posInRow,centralCount,catchmentCount) {

            this.container;
            this.matchComponent = matchComponent;
            this.posInRow = posInRow;


            this.width = updater.updateSquareWidth;
            this.height = updater.updateSquareWidth;
        
            this.x = 
                matchComponentAtomInNextMomentConditionsRow.x +
                this.posInRow*this.width +
                this.posInRow*updater.padding
            ;
            this.y = matchComponentAtomInNextMomentConditionsRow.y;
            this.x2 = this.x + this.width;
            this.y2 = this.y + this.height;

            this.updateSquare = 
                new UpdateSquare(this.x,this.y,gridRows,gridCols,largeGridCellSize,smallGridCellSize)
            ;
            this.updateSquare.backgroundColour = "#E6E6E6";
            this.updateSquare.centralCount = centralCount;
            this.updateSquare.catchmentCount = catchmentCount;
            this.container =  this.updateSquare.drawAllOfCatchmentArea(0,0);
            this.matchComponent.container.addChild(this.container);

        },

        draw: function() {

            this.container.visible = true;
        }

    });



    var ZeroThreeCondition = AtomCondition.extend({

        init: function(updater,matchComponent,matchComponentAtomInNextMomentConditionsRow) {

            var posInRow = 0;
            this._super(updater,matchComponent,matchComponentAtomInNextMomentConditionsRow,posInRow,"0","3");

        }

    });

    var OneTwoCondition = AtomCondition.extend({

        init: function(updater,matchComponent,matchComponentAtomInNextMomentConditionsRow) {

            var posInRow = 1;
            this._super(updater,matchComponent,matchComponentAtomInNextMomentConditionsRow,posInRow,"1","2");

        }

    });

    var OneThreeCondition = AtomCondition.extend({

        init: function(updater,matchComponent,matchComponentAtomInNextMomentConditionsRow) {

            var posInRow = 2;
            this._super(updater,matchComponent,matchComponentAtomInNextMomentConditionsRow,posInRow,"1","3");

        }

    });




    function MatchComponentAtomInNextMomentConditionsRow(updater,matchComponent) {
        
        this._numConditions = 3;
        this._betweenConditionsPadding = (this._numConditions-1) * updater.padding;

        this.x = updater.padding*2;
        this.y = matchComponent.currThreeSquareRow.y2 + updater.padding; 
        this.width =
            (updater.updateSquareWidth * this._numConditions) +
            this._betweenConditionsPadding + 
            updater.padding*4
        ;
        this.height = updater.updateSquareWidth + updater.padding;
        this.x2 = this.x + this.width;
        this.y2 = this.y + this.height;

        this.zeroThreeCondition = new ZeroThreeCondition(updater,matchComponent,this);
        this.oneTwoCondition = new OneTwoCondition(updater,matchComponent,this);
        this.oneThreeCondition = new OneThreeCondition(updater,matchComponent,this);

        this.draw = function() {

            this.zeroThreeCondition.draw();
            this.oneTwoCondition.draw();
            this.oneThreeCondition.draw();

        }

    }
    

    function MatchComponentPen(updater,matchComponent,threeSquareWidth) {

        this.updater = updater;
        this.matchComponent = matchComponent;

        this.shape = new Shape();

        this.activePen = new Shape();
        this.activePen.visible = false;

        this.x = matchComponent.x + updater.padding + updater.padding/2;
        this.y = matchComponent.y + updater.padding/2;

        this.width =  threeSquareWidth + (updater.padding/2)*2;
        this.height = threeSquareWidth*2 + updater.padding + (updater.padding/2)*2;
        this.x2 = this.x + this.width;
        this.y2 = this.y + this.height;


        this._getAtOneTwoConditionX = function() {
            var oneTwoConditionX =
                this.matchComponent.x + 
                this.matchComponent.atomInNextMomentConditionsRow.oneTwoCondition.x - 
                this.updater.padding/2
            ;
            return oneTwoConditionX;
        }
        this.oneThreeConditionX = 
            matchComponent.x + 
            matchComponent.atomInNextMomentConditionsRow.oneThreeCondition.x - 
            this.updater.padding/2
        ;


        this.path = [ 
            {x:this.x,                        y:this.y},
            {x:this._getAtOneTwoConditionX(), y:this.y},
            {x:this.oneThreeConditionX, y:this.y}
        ];
        this.animPath = new AnimPath(this.shape,this.path);

            

        this.draw = function() {
            // refactoring: note that this.animPath is meant to take care of setting the shape's x 
            //              and y!!!! ***
            // this.shape.x = this.x;
            // this.shape.y = this.y;
            this.shape.graphics
                .beginStroke("black")
                .drawRoundRect(0,0,this.width,this.height,this.updater.roundedCnrRadius)
                .endStroke()
            ;
            this.shape.shadow = new 
                Shadow(
                    "black",
                    shadowOffset,
                    shadowOffset,
                    shadowBlur
                )
            ;


            this.activePen.x = this.x;
            this.activePen.y = this.y;
            // ^ note that with the shape this is done by the AnimPath!

            this.activePen.graphics
                .beginStroke(activeColour)
                .drawRoundRect(0,0,this.width,this.height,this.updater.roundedCnrRadius)
                .endStroke()
            ;

        }


        this.getMoveToOneTwoConditionTweens = function(duration) {
            var tweens;
            tweens = [
                this.animPath.getTween(0,1,duration).wait(100),
                this.animPath.getTween(0,1,duration,this.activePen).wait(100)
            ]
            return tweens;

        }

        this.getMoveToOneThreeConditionTweens = function(duration) {
            var tweens;
            tweens = [
                this.animPath.getTween(1,2,duration).wait(100),
                this.animPath.getTween(1,2,duration,this.activePen).wait(100)
            ]
            return tweens;
        }

        // note the duplication of functionality b/ween this and penToCrossbarWire version...
        this.resetPositionTweens = function(matchPos,duration) {
            var fromPos;
            if (matchPos == -1) {
                fromPos = 2;
            } else {
                fromPos = matchPos;
            }
            var tweens;
            tweens = [ 
                this.animPath.getTween(fromPos,0,duration).wait(300),
                this.animPath.getTween(fromPos,0,duration,this.activePen).wait(300)
            ];
            return tweens;
        }


        this.showActivePenTween = function() {
            var tween;
            tween = sequencer.getPausedTween(this.activePen)
                        .wait(70)
                        .to({visible:true},100)
                        .wait(230)
            return tween;
        }

        this.hideActivePenTween = function() {
            var tween;
            tween = sequencer.getPausedTween(this.activePen)
                        .to({visible:false},100);
            return tween;
        } 



    }
    

    function MatchComponent(updater) {

        this.container = new Container();

        this.activeBG = new Shape();
        this.activeBG.visible = false;
        this.activeBG.x = 0;
        this.activeBG.y = 0;
        this.container.addChild(this.activeBG);

        this.shape = new Shape();

        this.updater = updater;

        this.x = updater.updaterBody.x + updater.padding;
        this.y = updater.countComponent.y2 + updater.padding;

        this.shape.x = 0;
        this.shape.y = 0;
        this.container.x = this.x;
        this.container.y = this.y;

        this.currThreeSquareRow = new MatchComponentCurrThreeSquareRow(updater,this);

        this.atomInNextMomentConditionsRow = 
            new MatchComponentAtomInNextMomentConditionsRow(updater,this)
        ;

        this.pen = new MatchComponentPen(updater,this,updater.updateSquareWidth);
        this.pen.shape.visible = true;

        this.height =
            updater.padding +
            this.currThreeSquareRow.height +
            updater.padding +
            this.atomInNextMomentConditionsRow.height  +
            updater.padding + // and crossbar drawn there
            updater.padding
        ;
        this.width = this.atomInNextMomentConditionsRow.width;
        this.x2 = this.x + this.width;
        this.y2 = this.y + this.height;

        this.container.addChild(this.shape);
        

        this.draw = function() {
            this.shape.graphics
                .beginStroke(this.updater.innerBoundaryColour)
                .moveTo(0,0)
                .lineTo(0+this.updater.countComponent.inToGap,0)
                .moveTo(0+this.updater.countComponent.inToGap + this.updater.updateSquareGapWidth,0)
                .lineTo(this.width,0)
                .lineTo(this.width,this.height)
                .lineTo((this.width/2)+14,this.height)
                .moveTo((this.width/2)-14,this.height)
                .lineTo(0,this.height)
                .lineTo(0,0)
                .endStroke();
            ;

            this.activeBG.graphics
                .beginFill(activeBGColour)
                .rect(1,1,this.width-2,this.height-2)
                .endFill()
            ;


            this.currThreeSquareRow.draw();
            this.atomInNextMomentConditionsRow.draw();
            this.pen.draw();
        }


        this.showActiveBGTween = function() {
            var tween;
            tween = sequencer.getPausedTween(this.activeBG)
                        .wait(200)
                        .to({alpha:0})
                        .to({visible:true})
                        .to({alpha:1},200)
            ;
            return tween;
        }

        this.hideActiveBGTween = function() {
            var tween;
            tween = sequencer.getPausedTween(this.activeBG)
                        .to({alpha:0},200)
            ;
            return tween;
        }
    }


    function MatchComponentToAtomOutputComponentWires(updater) {

        this.updater = updater;

        this.shape = new Shape();

        var localX = 
                updater.matchComponent.atomInNextMomentConditionsRow.zeroThreeCondition.x +
                updater.matchComponent.atomInNextMomentConditionsRow.zeroThreeCondition.width/2
        ;
        var localY = 
                updater.matchComponent.atomInNextMomentConditionsRow.y2 + updater.padding
        ;
        var point1 = updater.matchComponent.shape.localToLocal(localX,localY,updater.shape);    

        localX = 
                updater.matchComponent.atomInNextMomentConditionsRow.oneThreeCondition.x +
                updater.matchComponent.atomInNextMomentConditionsRow.oneThreeCondition.width/2
        ;
        var point2 = updater.matchComponent.shape.localToLocal(localX,localY,updater.shape);    
            

        this.crossBar = {
            x: point1.x,
            y: point1.y,
            x2: point2.x
        }

        this.sink = {
            x: this.crossBar.x + (this.crossBar.x2 - this.crossBar.x)/2,
            y: this.crossBar.y,
            y2: updater.addAtomPen.y
        }


        // draws on updater's shape
        this.draw = function() {

            // crossbar
            this.shape.graphics
                .beginStroke("black")
                .moveTo(this.crossBar.x,this.crossBar.y)
                .lineTo(this.crossBar.x2,this.crossBar.y)
                .endStroke()
            ;

            // sink
            this.shape.graphics
                .beginStroke("black")
                .moveTo(this.sink.x,this.sink.y)
                .lineTo(this.sink.x,this.sink.y2)
                .endStroke()
            ;

        }

    }


    function PenToCrossbarWire(updater,matchComponent) {

        this.updater = updater;

        this.shape = new Shape();

        var pos = 
            matchComponent.container.localToLocal(
                matchComponent.atomInNextMomentConditionsRow.x,
                0,
                updater.container
            )
        ;

        this.x  = pos.x + (matchComponent.atomInNextMomentConditionsRow.zeroThreeCondition.width)/2;
        this.y = matchComponent.pen.y2;

        this.y2 = updater.matchComponentToAtomOutputComponentWires.crossBar.y;
        this.height = this.y2 - this.y;


        this.oneTwoConditionX = this.updater.matchComponentToAtomOutputComponentWires.sink.x;
        this.oneThreeConditionXForPenToCrossbarWire = 
            this.updater.matchComponentToAtomOutputComponentWires.crossBar.x2
        ;

        this.path = [ 
            {x:this.x,                                      y:this.y},
            {x:this.oneTwoConditionX,                       y:this.y},
            {x:this.oneThreeConditionXForPenToCrossbarWire, y:this.y}
        ];
        this.animPath = new AnimPath(this.shape,this.path);



        this.endPointRadius = 2;

        this.draw = function() {
            this.shape.x = this.x;
            this.shape.y = this.y;
            this.shape.graphics
                .beginStroke("black")
                .moveTo(0,0)
                .lineTo(0,this.height)
                .endStroke()
            ;
            this.shape.graphics
                .beginFill("black")
                .arc(0,this.height,this.endPointRadius,0,Math.PI*2,false)
                .endFill()
        }

        this.getMoveToOneTwoConditionTween = function(duration) {
            return this.animPath.getTween(0,1,duration).wait(100);
        }

        this.getMoveToOneThreeConditionTween = function(duration) {
            return this.animPath.getTween(1,2,duration).wait(100);
        }


        // note the duplication of functionality b/ween this and MatchComponentPen version...
        this.resetPositionTween = function(matchPos,duration) {
            var fromPos;
            if (matchPos == -1) {
                fromPos = 2;
            } else {
                fromPos = matchPos;
            }
            return this.animPath.getTween(fromPos,0,duration).wait(300);
        }

    }


    function AddAtomPen(updater,updateSquareWidth) {

        this.shape = new Shape();
        this.updater = updater;

        this.activeBG = new Shape();
        this.activeBG.alpha = 0;
        this.activeBG.visible = true;

        this.x = 
            updater.matchComponent.shape.localToLocal(
                updater.matchComponent.atomInNextMomentConditionsRow.oneTwoCondition.x,
                0,
                updater.container
            ).x
        ;
        this.y = updater.matchComponent.y2 + updater.padding;
        this.width =  updateSquareWidth;
        this.height = updateSquareWidth;
        this.x2 = this.x + this.width;
        this.y2 = this.y + this.height;


        this.guideLinesDims = {
            x:  updater.updaterBody.x,
            y:  this.y+this.updater.padding/1.1,
            width: null,
            height: null
        }
        this.guideLinesDims.width = this.x - this.guideLinesDims.x + this.updater.padding/2;
        this.guideLinesDims.height = this.updater.cellSize;

        this.guideLines = new Shape();
        this.guideLines.visible = true;
        this.guideLines.x = this.guideLinesDims.x;
        this.guideLines.y = this.guideLinesDims.y;


        this.draw = function() {

            this.activeBG.x = this.x;
            this.activeBG.y = this.y;
            this.activeBG.graphics
                .beginFill(activeBGColour)
                .drawRoundRect(1,1,this.width-2,this.height-2,this.updater.roundedCnrRadius)
                .endFill()
            ;

            this.guideLines.graphics
                .beginStroke(guideLinesColour)
                .moveTo(0,0)
                .lineTo(this.guideLinesDims.width,0)
                .moveTo(0,this.guideLinesDims.height)
                .lineTo(this.guideLinesDims.width,this.guideLinesDims.height)
                .endStroke()
            ;


            this.shape.x = this.x;
            this.shape.y = this.y;
            this.shape.graphics
                .beginStroke("black")
                .drawRoundRect(0,0,this.width,this.height,this.updater.roundedCnrRadius)
                .endStroke()
            ;
            this.shape.shadow = new Shadow(
                "black",
                shadowOffset,
                shadowOffset,
                shadowBlur
            );

        }

        this.showActiveBGTween = function() {
            var tween;
            tween = sequencer.getPausedTween(this.activeBG)
                        .to({alpha:1},150)
                        .wait(100)
            ;
            return tween;
        }

        this.hideActiveBGTween = function() {
            var tween;
            tween = sequencer.getPausedTween(this.activeBG)
                        .wait(200)
                        .to({alpha:0},900)
            ;
            return tween;
        }



    }

    function NewAtom(updater,cellSize) {

        this.shape = new Shape();

        // this is bounding-box x and y, not atom's center.
        this.radius = updater.grid.getAtomRadius();

        this.x = updater.addAtomPen.x + updater.addAtomPen.width/2 - this.radius;
        this.y = updater.addAtomPen.y + updater.addAtomPen.height/2 - this.radius;

        this.updater = updater;


        this.draw = function() {
            this.shape.x = this.x;
            this.shape.y = this.y;
            this.shape.graphics
                .beginFill("black")
                .arc(this.radius,this.radius,this.radius,0,Math.PI*2,false)
                .endFill()
            ;
        }

        this.showTween = function() {
            var tween;
            tween = sequencer.getPausedTween(this.shape)
                        .to({alpha:1},400)
                        .wait(100)
            return tween;
        }


        /*
           There was a match - move this new atom to the current cell in the bottom grid 
           representing the next moment in time.
        */
        this.moveToGridTween = function() {

            var x = updater.bottomArm.cellHole.x + this.radius/2;
            var y = updater.bottomArm.cellHole.y + this.radius/2; 

            var newAtom = this; // for use in the call func below...

            var duration = 250;

            var tween;
            tween = sequencer.getPausedTween(this.shape)
                    .to({x:x,y:y},duration)
                    .call(function() {
                        var pos =
                            newAtom.updater.container.localToLocal(x,y,updater.getBottomGrid().container)
                        ;
                        newAtom.x = pos.x;
                        newAtom.y = pos.y;
                        newAtom.shape.x = newAtom.x;
                        newAtom.shape.y = newAtom.y;
                        newAtom.updater.container.removeChild(newAtom.shape);
                        newAtom.updater.getBottomGrid().container.addChildAt(newAtom.shape);
                        //***more of that stupid addChildAt with just one param stuff!!!

                        // *** refactoring: you can see the dangers of duplicating x and y 
                        //     coords.  I think i should clean this up!! and only store the
                        //     x and y on the shape...
                    })
            ;
            return tween;
        }

    }


    function TimeDisp(x,y,timeStep) {

        this.x = x;
        this.y = y;


        this.container = new Container();
        this.shape = new Shape();
        
        this.shape.x = 0;
        this.shape.y = 0;

        var px = 28;

        var fontSpec = "Italic " + (px - 8) + "px Arial";
        this.timeLabel = new Text("time\n",fontSpec,"gray");
        this.timeLabel.textBaseline = "top";
        this.timeLabel.textAlign = "center";

        this.stepLabel = new Text("" + timeStep, px + "px Arial", "gray");
        this.stepLabel.textBaseline = "top";
        this.stepLabel.textAlign = "center";


        this.container.addChild(this.timeLabel);
        this.container.addChild(this.stepLabel);
        this.container.addChild(this.shape);

        this.container.x = x;
        this.container.y = y;


        // hack to 'hard-code' these values here...
        var gridWidth = gridRows*largeGridCellSize;
        var gridHeight = gridCols*largeGridCellSize;

        // needs to be enough so that the updater arm never obscures the time text
        // refactoring: should really calculated it based on geometry of arm... ***
        var betweenLabelAndGridPadding = 2.5*largeGridCellSize;

        var afterGridPadding = 2*largeGridCellSize;
        this.labelAndPaddingWidth = this.timeLabel.getMeasuredWidth() + betweenLabelAndGridPadding;
        this.width = this.labelAndPaddingWidth + gridWidth + afterGridPadding;
        this.height =  gridHeight + largeGridCellSize*3;
        this.x2 = this.x + this.width;
        this.y2 = this.y + this.height;

        this.gridX = this.container.x + this.labelAndPaddingWidth;
        this.gridY = this.container.y + this.height/2 - gridHeight/2;


        // it seems when you set textAlign to center, it doesn't just center the text
        // it draws it centered on its x and y coords
        this.timeLabel.x = this.timeLabel.getMeasuredWidth()/2 + largeGridCellSize/2;
        this.timeLabel.y = this.height/2 - px;

        this.stepLabel.x = this.timeLabel.x;
        this.stepLabel.y = this.timeLabel.y + px;

        this.draw = function() {

            this.shape.alpha = 1;

            this.shape.graphics.beginFill(gridBGColour).rect(0,0,this.width,this.height).endFill();

            var border = new Shape();
            border.graphics.beginStroke("lightgray").rect(0,0,this.width,this.height).endStroke();
            border.shadow =
                new Shadow("black", outerShadowOffset, outerShadowOffset, outerShadowBlur)
            ;
            this.container.addChild(border);
            
        }


        this.topPosToOffScreenTween = function(duration) {
            var tween;
            tween = sequencer.getPausedTween(this.container)
                        .to({y:topTimeDispY})
                        .to({y:offTopOfScreenTimeDispY},duration)
            ;
            return tween;
        }


        this.bottomPosToTopPosTween = function(duration) {
            var tween;
            tween = sequencer.getPausedTween(this.container)
                        .to({y:bottomTimeDispY})
                        .to({y:topTimeDispY},duration)
            ;
            return tween;
        }


        this.offScreenToBottomPosTween = function(duration) {
            var tween;
            tween = sequencer.getPausedTween(this.container)
                        .to({y:offBottomOfScreenTimeDispY})
                        .to({y:bottomTimeDispY},duration)
            ;
            return tween;
        }


    }
    

    function CurrentMomentDisp(topTimeDisp) {

        this.container = new Container();
        this.shape = new Shape();

        var px = 18; // 22;
        this.text = new Text("n\no\nw",px + "px Arial", "gray");

        // this.width = this.text.getMeasuredWidth(); // doesn't seem to work
        this.width = px + px/2;
        this.x = topTimeDisp.x - this.width;
        this.y = topTimeDisp.y;
        this.x2 = topTimeDisp.x;
        this.y2 = topTimeDisp.y2;
        this.height = this.y2 - this.y;

        this.shape.x = this.x;
        this.shape.y = this.y;

        this.text.textBaseline = "top";
        this.text.x = this.x + px/3;
        this.text.y = this.y + px*1.6;



        this.container.addChild(this.text);
        this.container.addChild(this.shape);


        this.draw = function() {

            var aPaleGreen = "#F2FFF2"; // "#CCFFCC";

            this.shape.graphics
                .beginFill(aPaleGreen)
                .rect(0,0,this.width,this.height)
                .endFill();
            ;
            this.shape.graphics
                .beginStroke(aPaleGreen)
                .rect(0,0,this.width+topTimeDisp.width,this.height)
                .endStroke()
            ;

        }

    }


    function Updater(stage,grid,gridX,gridY) {

        this.stage = stage;
        this.grid = grid;
        this.bottomGrid = null;

        this.cellSize = grid.largeCellSize;
        this.padding = this.cellSize;
        this.updateSquareWidth = this.cellSize*3;
        this.gridRows = grid.rows;
        this.gridCols = grid.cols;
        this.gridWidth = this.gridCols*this.cellSize;

        this.fillColour = "lightgray";
        this.innerBoundaryColour = "DimGray";

        this.alpha = 0.97;

        this.roundedCnrRadius = this.cellSize/2;

        this.updateSquareGapWidth = this.updateSquareWidth + this.cellSize/2;

        // this.offToSideDistanceFromGrid = 4*this.cellSize;
        // this.offToSideX = this.grid.x2 + this.offToSideDistanceFromGrid;
        this.offToSideDistanceFromGrid = 7*this.cellSize;
        this.offToSideX = this.grid.getWidth() + this.offToSideDistanceFromGrid;


        // temp
        var updateSquareX = gridX - this.cellSize;
        var updateSquareY = gridY - this.cellSize;

        this.topArm = 
            new TopArm(
                this,
                this.padding,
                this.cellSize,
                this.gridWidth,
                this.updateSquareWidth,
                updateSquareX,
                updateSquareY
            )
        ;

        // y is defined further down, after we've figured out geometry of 
        // contents of updater body
        this.updaterBody = {
            x: null,
            y: null,
            x2: null,
            y2: null,
            width: null,
            height: null
        }
        this.updaterBody.x = this.topArm.x2;


        this.shape = new Shape();
        this.container = new Container();
        this.container.alpha = this.alpha;

        this.countComponent = new CountComponent(this);
        this.matchComponent = new MatchComponent(this);
        this.addAtomPen     = new AddAtomPen(this,this.updateSquareWidth);
        this.matchComponentToAtomOutputComponentWires = 
            new MatchComponentToAtomOutputComponentWires(this)
        ;
        this.penToCrossbarWire = new PenToCrossbarWire(this,this.matchComponent);
        this.penToCrossbarWire.shape.visible = true;
        this.newAtom = new NewAtom(this,this.cellSize);


        this.bottomArm = new BottomArm(this,this.padding,this.cellSize);



        this.updaterBody.x2 = this.matchComponent.x2 + this.padding; 
        this.updaterBody.y = this.countComponent.y - this.padding;
        this.updaterBody.y2 = this.addAtomPen.y2 + this.padding;
        this.updaterBody.width = this.updaterBody.x2 - this.updaterBody.x;
        this.updaterBody.height = this.updaterBody.y2 - this.updaterBody.y;


        this.container.addChild(this.shape);
        this.container.addChild(this.countComponent.container);
        this.container.addChild(this.matchComponent.container);
        this.container.addChild(this.penToCrossbarWire.shape);

        this.container.addChild(this.addAtomPen.activeBG);
        this.container.addChild(this.addAtomPen.guideLines);
        this.container.addChild(this.addAtomPen.shape);
        // if there's a match, it'll be removed from this container and added to the stage.
        this.container.addChild(this.newAtom.shape);

        this.container.addChild(this.matchComponentToAtomOutputComponentWires.shape);

        this.container.addChild(this.countComponent.pen.shape);
        this.container.addChild(this.countComponent.pen.activePen);
        this.container.addChild(this.matchComponent.pen.shape);
        this.container.addChild(this.matchComponent.pen.activePen);


        this.stage.addChild(this.container);


        this.getBottomGrid = function() {
            return this.bottomGrid;
        }

        this.setBottomGrid = function(bottomGrid) {
            this.bottomGrid = bottomGrid;
        }


        this.draw = function() {

            this.shape.graphics
                .beginFill(this.fillColour)
                .rect(
                    this.updaterBody.x,
                    this.updaterBody.y,
                    this.updaterBody.width,
                    this.updaterBody.height)
                .endFill()
            ;
            this.shape.graphics
                .beginStroke("black")
                .moveTo(this.updaterBody.x,this.topArm.y)
                .lineTo(this.updaterBody.x,this.updaterBody.y)
                .lineTo(this.updaterBody.x2,this.updaterBody.y)
                .lineTo(this.updaterBody.x2,this.updaterBody.y2)
                .lineTo(this.updaterBody.x,this.updaterBody.y2)
                .lineTo(this.updaterBody.x,this.bottomArm.y2)
                .moveTo(this.updaterBody.x,this.bottomArm.y)
                .lineTo(this.updaterBody.x,this.topArm.y2)
                .endStroke()
            ;

            var rightShadowLine = new Shape();
            rightShadowLine.x = this.updaterBody.x2;
            rightShadowLine.y = this.updaterBody.y;
            rightShadowLine.graphics
                .beginStroke("gray")
                .moveTo(0,0)
                .lineTo(0,this.updaterBody.height)
                .endStroke()
            ;
            rightShadowLine.shadow =
                new Shadow("black",outerShadowOffset,outerShadowOffset,outerShadowBlur)
            ;
            this.container.addChild(rightShadowLine);


            var bottomShadowLine = new Shape();
            bottomShadowLine.x = this.updaterBody.x;
            bottomShadowLine.y = this.updaterBody.y2;
            bottomShadowLine.graphics
                .beginStroke("gray")
                .moveTo(0,0)
                .lineTo(this.updaterBody.width,0)
                .endStroke()
            ;
            bottomShadowLine.shadow =
                new Shadow("black",outerShadowOffset,outerShadowOffset,outerShadowBlur)
            ;
            this.container.addChild(bottomShadowLine);



            this.topArm.draw();
            this.countComponent.draw();
            this.matchComponent.draw();
            this.matchComponentToAtomOutputComponentWires.draw();
            this.penToCrossbarWire.draw();
            this.addAtomPen.draw();
            this.newAtom.draw();
            this.bottomArm.draw();
        }


        this.showUpdatingForGrid = function(universe,topGrid,bottomGrid,topGridX,topGridY) {
            var matchPos;
            for (var cellY = 0; cellY < topGrid.rows; cellY++) {
                for (var cellX = 0; cellX < topGrid.cols; cellX++) {

                    matchPos =
                        this.showUpdatingForCell(universe,topGrid,bottomGrid,topGridX,topGridY,cellX,cellY);
                    ;

                    var notInLastCell = !(cellX == topGrid.cols-1 && cellY == topGrid.rows-1);
                    if (notInLastCell) {
                        sequencer.registerConcurrent([
                            this.topArm.showActiveBGTween(),
                            topGrid.showActiveBGTween(),
                            this.resetComponentsTweens(matchPos),
                            this.moveToNextPositionTween(topGrid,cellX,cellY)
                        ]);
                    }
                }
            }
            return matchPos;
        }

        this.moveToNextPositionTween = function(topGrid,cellX,cellY) {
            var lastPos, newPos;
            lastPos = this.getPosFor(topGrid,cellX,cellY);
            var notInLastColumn = cellX < topGrid.cols-1;
            if (notInLastColumn) {
                newPos = this.getPosFor(topGrid,cellX+1,cellY);
                duration = 500;
            } else {
                newPos = this.getPosFor(topGrid,0,cellY+1);
                duration = 700;
            }
            return this.moveToTween(lastPos,newPos,duration);
        }

        this.moveToTween = function(lastPos,newPos,duration) {
            var tween;
            tween = sequencer.getPausedTween(this.container);
            tween.to({x:lastPos.x,y:lastPos.y}).to({x:newPos.x,y:newPos.y},duration,Ease.circInOut);
            return tween;
        }

        /* where cellX and cellY are cell coords for cells in topGrid */
        this.getPosFor = function(topGrid,cellX,cellY) {
            var x, y;
            // remember that container's x & y are set so that hole for updateSquare is 
            // positioned over topGrid's 0,0 cell
            x = this.container.x + topGrid.largeCellSize*cellX;
            y = this.container.y + topGrid.largeCellSize*cellY;
            return {x:x,y:y};
        }

        this.showUpdatingForCell = function(universe,topGrid,bottomGrid,gridX,gridY,currCellX,currCellY) {

            var updateSquareX = gridX-largeGridCellSize;
            var updateSquareY = gridY-largeGridCellSize;
            var updateSquare = 
                new UpdateSquare(
                    updateSquareX,
                    updateSquareY,
                    gridRows,
                    gridCols,
                    largeGridCellSize,
                    smallGridCellSize,
                    universe,
                    this
                )
            ;

            // refactoring: recently added... should be used instead of passing update 
            // square around..
            this.updateSquare = updateSquare;

            var updateSquareContainer =
                updateSquare.drawAllOfCatchmentArea(currCellX,currCellY);
            updateSquareContainer.visible = false;


            /* this means that update container will sit underneath the 
               match and count pen's and active pen's. in display order the countComponent
               pen is the first of those four */
            var index = this.container.getChildIndex(this.countComponent.pen.shape);
            this.container.addChildAt(updateSquareContainer,index);
            

            sequencer.register( updateSquare.showTween() );

            sequencer.registerConcurrent([
                updateSquare.moveToCountPenTween(),
                this.topArm.hideActiveBGTween(),
                topGrid.hideActiveBGTween(),
                this.countComponent.pen.showActivePenTween(),
                this.countComponent.showActiveBGTween()
            ]);

            updateSquare.count(currCellX,currCellY);

            sequencer.registerConcurrent([
                this.countComponent.pen.hideActivePenTween(),
                this.countComponent.hideActiveBGTween(),
                updateSquare.moveToMatchPenTween(),
                this.matchComponent.showActiveBGTween(),
                this.matchComponent.pen.showActivePenTween()
            ]);

            var matchPos;

            matchPos = this.animateMatching(updateSquare);

            if (matchPos != -1) {
                new ResultPulse(this,matchPos).moveToBottomOfSinkThenDisappear();
                sequencer.register( this.addAtomPen.showActiveBGTween() );
                sequencer.registerConcurrent([
                    this.addAtomPen.hideActiveBGTween(),
                    this.newAtom.moveToGridTween(),
                    this.bottomArm.showActiveBGTween(),
                    bottomGrid.showActiveBGTween()
                ]);
                sequencer.registerConcurrent([
                    bottomGrid.hideActiveBGTween(),
                    this.bottomArm.hideActiveBGTween() 
                ]);
            } else {
                sequencer.register(this.matchComponent.hideActiveBGTween());
            }

            return matchPos;

        }


        this.showInPositionOffToSide = function() {
            sequencer.register(
                sequencer.getPausedTween(this.container)
                    .to({alpha:0})
                    .to({visible:true,x:this.offToSideX})
                    .wait(500)
                    .to({alpha:this.alpha},1000)
                    .wait(1500)
            );
        }

        this.moveOntoGridTween = function() {
            var tween;
            tween = sequencer.getPausedTween(this.container)
                        .to({x:this.offToSideX})
                        .to({x:this.container.x},2000,Ease.in)
                        .wait(500);
            return tween;
        }

        this.moveBackOffToSideTween = function() {
            // refactoring: ideally it wouldn't hard-code that, but would simply be able to get its last pos.
            var pos = this.getPosFor(this.grid,this.grid.cols-1,this.grid.rows-1);
            var tween;
            tween = sequencer.getPausedTween(this.container)
                        .to({x:pos.x,y:pos.y})
                        .to({x:this.offToSideX,y:this.container.y},2000)
            ;
            return tween;
        }



        this.resetComponentsTweens = function(matchPos) {

            var duration = 200;

            var tweens = [
                this.updateSquare.dissolveTween(duration),
                this.matchComponent.pen.resetPositionTweens(matchPos,duration),
                this.penToCrossbarWire.resetPositionTween(matchPos,duration)
            ];

            if (matchPos != -1) {
                this.newAtom = new NewAtom(this,this.cellSize);
                this.newAtom.shape.alpha = 0;
                this.newAtom.draw();
                this.container.addChild(this.newAtom.shape);
                tweens.push(
                    this.newAtom.showTween()
                );
            }

            return tweens;
        }

                
        this.animateMatching = function(updateSquare) {
            var matchPos;
            var condRow = this.matchComponent.atomInNextMomentConditionsRow;

            if ( (updateSquare.centralCount == 0) && (updateSquare.catchmentCount == 3) ) {
                
                sequencer.registerConcurrent([
                    updateSquare.showMatchTween(),
                    condRow.zeroThreeCondition.updateSquare.showMatchTween()
                ]);
                sequencer.register(this.matchComponent.pen.hideActivePenTween());
                sequencer.registerConcurrent([
                    updateSquare.hideMatchTween(),
                    condRow.zeroThreeCondition.updateSquare.hideMatchTween()
                ]);
                matchPos = 0;
                return matchPos;

            } else { 
                /*
                sequencer.registerConcurrent([
                    updateSquare.showNoMatchTween(),
                    condRow.zeroThreeCondition.updateSquare.showNoMatchTween()
                ]);
                sequencer.registerConcurrent([
                    updateSquare.hideNoMatchTween(),
                    condRow.zeroThreeCondition.updateSquare.hideNoMatchTween()
                ]);
                */

                var duration = 170;
                sequencer.registerConcurrent([
                    updateSquare.getMoveToOneTwoConditionTween(duration),
                    this.matchComponent.pen.getMoveToOneTwoConditionTweens(duration),
                    this.penToCrossbarWire.getMoveToOneTwoConditionTween(duration)
                ]);

                if ( (updateSquare.centralCount == 1) && (updateSquare.catchmentCount == 2) ) {

                    sequencer.registerConcurrent([
                        updateSquare.showMatchTween(),
                        condRow.oneTwoCondition.updateSquare.showMatchTween()
                    ]);
                    sequencer.register(this.matchComponent.pen.hideActivePenTween());
                    sequencer.registerConcurrent([
                        updateSquare.hideMatchTween(),
                        condRow.oneTwoCondition.updateSquare.hideMatchTween()
                    ]);
                    matchPos = 1;
                    return matchPos;

                } else {

                    /*
                    sequencer.registerConcurrent([
                        updateSquare.showNoMatchTween(),
                        condRow.oneTwoCondition.updateSquare.showNoMatchTween()
                    ]);
                    sequencer.registerConcurrent([
                        updateSquare.hideNoMatchTween(),
                        condRow.oneTwoCondition.updateSquare.hideNoMatchTween()
                    ]);
                    */

                    // move to oneThreeCondition position
                    sequencer.registerConcurrent([
                        updateSquare.getMoveToOneThreeConditionTween(duration),
                        this.matchComponent.pen.getMoveToOneThreeConditionTweens(duration),
                        this.penToCrossbarWire.getMoveToOneThreeConditionTween(duration)
                    ]);

                    if ( (updateSquare.centralCount == 1) && (updateSquare.catchmentCount == 3) ) {

                        sequencer.registerConcurrent([
                            updateSquare.showMatchTween(),
                            condRow.oneThreeCondition.updateSquare.showMatchTween()
                        ]);
                        sequencer.register(this.matchComponent.pen.hideActivePenTween());
                        sequencer.registerConcurrent([
                            updateSquare.hideMatchTween(),
                            condRow.oneThreeCondition.updateSquare.hideMatchTween()
                        ]);

                        matchPos = 2;
                        return matchPos;
                    } else {

                        /*
                        sequencer.registerConcurrent([
                            updateSquare.showNoMatchTween(),
                            condRow.oneThreeCondition.updateSquare.showNoMatchTween()
                        ]);
                        sequencer.registerConcurrent([
                            updateSquare.hideNoMatchTween(),
                            condRow.oneThreeCondition.updateSquare.hideNoMatchTween()
                        ]);
                        */

                        
                        sequencer.register(this.matchComponent.pen.hideActivePenTween());
                        matchPos = -1;  // no match
                        return matchPos;
                    }
                }
            }
        }
    }





    function ResultPulse(updater,matchPos) {

        this.shape = new Shape();

        this.shape.visible = false;

        this.updater = updater;

        this.radius = 6;

        this.matchPos = matchPos;

        this._getX = function(matchPos) {
            var x;
            var nextMntRow = this.updater.matchComponent.atomInNextMomentConditionsRow;
            if (matchPos == 0) {
                x = 
                    this.updater.matchComponent.container.localToLocal(
                        nextMntRow.zeroThreeCondition.x,
                        0,
                        this.updater.container
                    ).x
                    + 
                    this.updater.updateSquareWidth/2
                ;
            } else if (matchPos == 1) {
                x = 
                    this.updater.matchComponent.container.localToLocal(
                        nextMntRow.oneTwoCondition.x,
                        0,
                        this.updater.container
                    ).x
                    + 
                    this.updater.updateSquareWidth/2
                ;
            } else if (matchPos == 2) {
                x = 
                    this.updater.matchComponent.container.localToLocal(
                        nextMntRow.oneThreeCondition.x,
                        0,
                        this.updater.container
                    ).x
                    + 
                    this.updater.updateSquareWidth/2
                ;
            } else {
                alert("ERROR: invalid matchPos");
            }
            x -= this.radius/2;
            return x;
        }


        this.x = this._getX(matchPos);

        this.y = updater.penToCrossbarWire.y - this.radius/2;
            

        this.shape.x = this.x;
        this.shape.y = this.y;


        var crossBarY = updater.matchComponentToAtomOutputComponentWires.crossBar.y;
        var sinkX = updater.matchComponentToAtomOutputComponentWires.sink.x;
        var sinkY2 = updater.matchComponentToAtomOutputComponentWires.sink.y2;

        // refactoring: rationalise all this ' - this.radius/2' stuff into a func... ***
        this.path = [ 
            {x:this.x, y:this.y},
            {x:this.x, y:crossBarY - this.radius/2},
            {x:sinkX - this.radius/2, y:crossBarY - this.radius/2},
            {x:sinkX - this.radius/2, y:sinkY2 - this.radius/2}
        ];
        this.animPath = new AnimPath(this.shape,this.path);


        this.shape.graphics
            .beginFill("green")
            .arc(0 + this.radius/2,0 + this.radius/2,this.radius,0,Math.PI*2,false)
            .endFill()
        ;
        this.updater.container.addChild(this.shape);


        this.moveToBottomOfSinkThenDisappear = function() {
            this.moveToCrossbar();
            if (this.matchPos != 1) {
                this.moveToMiddleOfCrossBar();
            }
            // refactoring - dodgy to be doing this updater stuff here... but i really need
            // the 'branch' sequencer op to do it better.... ***
            sequencer.registerConcurrent([
                this.updater.matchComponent.hideActiveBGTween(),
                this.moveToBottomOfSinkTween()
            ]);
            this.disappear();
        }



        this.moveToCrossbar = function() {
            var crossbarY = this.updater.matchComponentToAtomOutputComponentWires.crossBar.y;
            var duration = 170;
            sequencer.register(
                sequencer.getPausedTween(this.shape)
                    .set({visible:true,alpha:1})
                    .to({y:crossbarY - this.radius/2},duration)
            );
        }

        this.moveToMiddleOfCrossBar = function() {
            var duration = 170;
            sequencer.register( this.animPath.getTween(1,2,duration) );
        }

        this.moveToBottomOfSinkTween = function() {
            var duration = 170;
            var tween;
            tween = this.animPath.getTween(2,3,duration);
            return tween;
        }

        this.disappear = function() {
            sequencer.register( 
                sequencer.getPausedTween(this.shape).to({alpha:0},100)
            )
        }

    }

    



    function PauseScreen(canvas,stage,updaterAnimation) {

        this.updaterAnimation = updaterAnimation;

        this.stage = stage;

        this._PAUSE_MODE = 2;
        this._RESTART_MODE = 3;

        this.mode = this._PAUSE_MODE;

        this.container = new Container();
        if (!Ticker.getPaused()) { 
            this.container.visible = false; 
        } else {
            this.container.visible = true;
        }


        this.container.x = 0;
        this.container.y = 0;

        this.screen = new Shape();
        this.screen.x = 0;
        this.screen.y = 0;
        this.screen.alpha = 0.7;
        this.screen.graphics
            .beginFill("LightSteelBlue")
            .rect(0,0,canvas.width,canvas.height)
            .endFill()
        ;
        this.container.addChild(this.screen);

        this.playButton = new Shape();
        var centerX = canvas.width / 2;
        var centerY = canvas.height / 2;
        var squareWidth = 100;
        var squareX = centerX - squareWidth/2;
        var squareY = centerY - squareWidth/2;
        this.playButton.graphics
            .beginFill("#303030")
            .drawRoundRect(squareX,squareY,squareWidth,squareWidth,5)
            .endFill()
        ;

        this.restartButton = this.playButton.clone(true);


        var oneThirdWidth = squareWidth / 3;
        var triangleX = squareX + oneThirdWidth;
        var triangleY = squareY + oneThirdWidth - 5;
        var triangleY2 = squareY+squareWidth-oneThirdWidth+5;
        this.playButton.graphics
            .beginFill("white")
            .moveTo(triangleX, triangleY)
            .lineTo(triangleX, triangleY2)
            .lineTo(triangleX+oneThirdWidth,triangleY + ((triangleY2-triangleY)/2))
            .closePath()
            .endFill()
        ;
        this.container.addChild(this.playButton);



        this.restartBox = new Container();
        this.restartBox.visible = false;

        var px = 20;
        var fontSpec = px + "px Arial";
        var restartLabel = new Text("replay",fontSpec,"white");
        restartLabel.textBaseline = "middle";
        restartLabel.textAlign = "center";
        restartLabel.x = squareX + squareWidth/2;
        restartLabel.y = squareY + squareWidth/2;

        this.restartBox.addChild(this.restartButton);
        this.restartBox.addChild(restartLabel);
        this.container.addChild(this.restartBox);


        this.play = function() {
            this.container.visible = false;
            Ticker.setPaused(false);
        }

        this.pause = function() {
            this.container.visible = true;
            Ticker.setPaused(true);
        }

        this.pauseAndShowResetScreen = function() {
            this.restartBox.visible = true;
            this.playButton.visible = false;
            this.pause();
            this.mode = this._RESTART_MODE;
        }

        this.toggle = function() {
            if (Ticker.getPaused()) {
                this.play();
            } else {
                this.pause();
            }
        }

        this.canvasClick = function() {
            if (this.mode == this._PAUSE_MODE) {
                this.toggle();
            } else if (this.mode == this._RESTART_MODE) {
                this.mode = this._PAUSE_MODE;
                this.playButton.visible = true;
                this.restartBox.visible = false;
                this.stage.removeAllChildren();
                Ticker.removeListener(this.stage);
                Ticker.setPaused(false);
                this.updaterAnimation.cueAnimation();
            } else {
                alert("Invalid PauseScreen mode");
            }
        }

    }

    var pauseScreen;


    function UpdaterAnimation(dispGolDiv) {

        this.topTimeDisp;
        this.bottomTimeDisp;
        this.topGrid;
        this.topGridX;
        this.bottomGrid;
        this.currentMomentDisp;
        this.updater;

        this.patternName = $(dispGolDiv).attr('pattern');

        if (patterns[this.patternName] == null) {
            alert("UpdaterAnimation, ERROR: invalid @pattern: " + this.patternName);
        }

        this.numSteps  = $(dispGolDiv).attr('steps');
        var gridWidth  = $(dispGolDiv).attr('gridWidth');
        var gridHeight = $(dispGolDiv).attr('gridHeight');

        // global vars stuff to sort out.... ***
        // also, end up renaming gridWidth and gridHeight!! to rows/cols **
        gridRows = gridHeight;
        gridCols = gridWidth;

        var canvasHtml = 
            "<canvas width='900' height='700' onclick='pauseScreen.canvasClick();'></canvas>"
        ;
        $(dispGolDiv).append(canvasHtml);
        this.canvas = $(dispGolDiv).children("canvas").first().get(0);


        this.start = function() {

            Ticker.setFPS(25);
            Ticker.setPaused(true);
            this.cueAnimation();

        }

        this.cueAnimation = function() {


            var stage = new Stage(this.canvas);

            sequencer = new Sequencer();

            pauseScreen = new PauseScreen(this.canvas,stage,this);

            var universe = new Universe( patterns[this.patternName].getPattern_PosArray().clone() );

            this.cueUpdatingAnimation(stage,universe);

            // pause it after it has finished playing. 
            sequencer.register(
                sequencer.getPausedTween()
                    .wait(1000).call(
                    function() { pauseScreen.pauseAndShowResetScreen(); }
                )
            );

            this.setBackground(stage);

            stage.addChild(pauseScreen.container);

            sequencer.start();

            Ticker.addListener(stage,false);
        }


        this.cueUpdatingAnimation = function(stage,universe) {

            var topGridX;
            
            topGridX = this.createSetupAndAddDispItems(stage,universe);

            this.updater.showInPositionOffToSide();

            var posOfFinalMatch;

            for (var timeStep = 0; timeStep < this.numSteps; timeStep++) {

                sequencer.registerConcurrent([
                    this.updater.moveOntoGridTween(),
                    this.updater.topArm.showActiveBGTween(),
                    this.topGrid.showActiveBGTween()
                ])

                posOfFinalMatch = 
                    this.updater.showUpdatingForGrid(universe,this.topGrid,this.bottomGrid,topGridX,topGridY)
                ;

                sequencer.registerConcurrent([
                    this.updater.resetComponentsTweens(posOfFinalMatch),
                    this.updater.moveBackOffToSideTween()
                ]);


                var showNewGrid;
                var notLastTimestep = timeStep < (this.numSteps - 1);
                var newItems;
                if (notLastTimestep) {
                    newItems = this.scrollGridsAndTimeDetailsUp(stage,timeStep,showNewGrid=true);
                    this.topTimeDisp    = this.bottomTimeDisp;
                    this.topGrid        = this.bottomGrid;
                    this.bottomTimeDisp = newItems[0];
                    this.bottomGrid     = newItems[1];

                    var bg = this.bottomGrid;
                    var up = this.updater;
                    var ua = this;
                    sequencer.register(
                        sequencer.getPausedTween()
                            .call(ua.setUpdatersBottomGrid,[up,bg])
                    );
                    this.updater.bottomGrid = this.bottomGrid;

                    universe.next();

                } else {
                    this.scrollGridsAndTimeDetailsUp(stage,timeStep,showNewGrid=false);
                }
            }
        }

        /* can't use 'this' in this method, as it's called by an event and 'this' would
         * ref that event.
         */
        this.setUpdatersBottomGrid = function(updater,bottomGrid) {
            updater.setBottomGrid(bottomGrid);
        }


        this.createSetupAndAddDispItems = function(stage,universe) {

            var topTimeDispX = 60;
            topTimeDispY = 80;
            
            this.topTimeDisp = new TimeDisp(topTimeDispX,topTimeDispY,0);
            this.topTimeDisp.container.compositeOperation = "destination-over";
            this.topTimeDisp.draw();


            var topGridX = this.topTimeDisp.gridX;
            topGridY = this.topTimeDisp.gridY;

            this.topGrid = 
                new Grid(
                    topGridX,
                    topGridY,
                    gridRows,
                    gridCols,
                    largeGridCellSize,
                    smallGridCellSize,
                    universe,
                    0
                )
            ;

            this.updater = new Updater(stage,this.topGrid,topGridX,topGridY);
            this.updater.container.visible = false;
            this.updater.draw();


            // if I don't do this, and add it after updater, the 'arm hole' 
            // cuts through the updater arm and also the grid!
            this.topGrid.drawGrid();
            this.topGrid.drawPattern();
            this.topGrid.container.compositeOperation = "destination-over";
            stage.addChild(this.topGrid.container);

            stage.addChild(this.topTimeDisp.container);

            this.currentMomentDisp = new CurrentMomentDisp(this.topTimeDisp);
            this.currentMomentDisp.container.compositeOperation = "destination-over";
            this.currentMomentDisp.draw();
            stage.addChild(this.currentMomentDisp.container);


            var bottomGridX = this.updater.bottomArm.x + largeGridCellSize*2;
            bottomGridY = this.updater.bottomArm.y + largeGridCellSize;


            this.bottomGrid = 
                new Grid(bottomGridX,bottomGridY,gridRows,gridCols,largeGridCellSize,smallGridCellSize,null,1)
            ;
            this.bottomGrid.drawGrid();
            this.bottomGrid.container.compositeOperation = "destination-over";
            stage.addChild(this.bottomGrid.container);
            this.updater.bottomGrid = this.bottomGrid;
            var bg = this.bottomGrid;
            var up = this.updater;
            sequencer.register(
                sequencer.getPausedTween(this.updater.container)
                    .call(function() {
                        up.setBottomGrid(bg);
                    })
            );


            bottomTimeDispX = topTimeDispX;
            bottomTimeDispY = topTimeDispY + (bottomGridY - topGridY);
            this.bottomTimeDisp = new TimeDisp(bottomTimeDispX,bottomTimeDispY,1);
            this.bottomTimeDisp.container.compositeOperation = "destination-over";
            this.bottomTimeDisp.draw();

            stage.addChild(this.bottomTimeDisp.container);


            // setup these global vars that are used elsewhere.
            var distanceBetweenGrids = bottomGridY - topGridY;
            offTopOfScreenGridY = topGridY - distanceBetweenGrids;
            offTopOfScreenTimeDispY = topTimeDispY - distanceBetweenGrids;
            offBottomOfScreenGridY = bottomGridY + distanceBetweenGrids; 
            offBottomOfScreenTimeDispY = bottomTimeDispY + distanceBetweenGrids;

            return topGridX;

        }



        this.scrollGridsAndTimeDetailsUp =
            function(stage,timeStep,showNewGrid) {

            var duration = 3000;

            var tweens = [
                    this.topTimeDisp.topPosToOffScreenTween(duration),
                    this.topGrid.topPosToOffScreenTween(duration),

                    this.bottomTimeDisp.bottomPosToTopPosTween(duration),
                    this.bottomGrid.bottomPosToTopPosTween(duration)
            ];

            var newItems = null;

            if (showNewGrid) {

                var newBottomGrid = 
                    new Grid(
                        this.topGrid.x,
                        offBottomOfScreenGridY,
                        this.topGrid.rows,
                        this.topGrid.cols,
                        this.topGrid.largeCellSize,
                        this.topGrid.smallCellSize,
                        null,
                        timeStep+2
                    )
                ;
                newBottomGrid.drawGrid();
                newBottomGrid.container.compositeOperation = "destination-over";
                
                var newBottomTimeDisp = 
                    new TimeDisp(
                        this.bottomTimeDisp.x,
                        offBottomOfScreenTimeDispY,
                        timeStep+2
                    );
                ;
                newBottomTimeDisp.container.compositeOperation = "destination-over";
                newBottomTimeDisp.draw();
            
                stage.addChild(newBottomGrid.container);
                stage.addChild(newBottomTimeDisp.container);

                tweens.push(
                    newBottomTimeDisp.offScreenToBottomPosTween(duration)
                );
                tweens.push(
                    newBottomGrid.offScreenToBottomPosTween(duration)
                );

                newItems = [ newBottomTimeDisp, newBottomGrid ];
            }

            sequencer.registerConcurrent(tweens);

            return newItems;

        }


        this.setBackground = function(stage) {

            //var img = new Bitmap("abs.png");
            // var img = new Bitmap("204-clouds.jpg");
            // var img = new Bitmap("seamlesstexture21_1200.jpg");
            // var img = new Bitmap("seamlesstexture10_1200.jpg");   // frm http://lostandtaken.com/
            // var img = new Bitmap("seamlesstexture24_1200.jpg");
            
            var img = new Bitmap("img/seamlesstexture1_1200.jpg");  // **
            var canvas = this.canvas;
            img.image.onload = function() {
                var background = new Shape();
                background.x = 0;
                background.y = 0;
                background.compositeOperation = "destination-over";
                background.graphics
                    .beginBitmapFill(img.image)
                    .rect(0,0,canvas.width,canvas.height)
                    .endFill()
                ;
                stage.addChild(background);
            }

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



