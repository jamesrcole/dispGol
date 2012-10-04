



    function CausalRelationsDiagram(dispGolDiv) {

        this.patternName = $(dispGolDiv).attr('pattern');

        if (patterns[this.patternName] == null) {
            alert("UpdaterAnimation, ERROR: invalid @pattern: " + this.patternName);
        }

        this.numSteps  = $(dispGolDiv).attr('steps');
        var gridWidth  = $(dispGolDiv).attr('gridWidth'); // in number of cells
        var gridHeight = $(dispGolDiv).attr('gridHeight');

        // global vars stuff to sort out.... ***
        // also, end up renaming gridWidth and gridHeight!! to rows/cols **
        gridRows = gridHeight;
        gridCols = gridWidth;


        this.betweenGridPadding = 20;

        this.gridFadeOffEdging = largeGridCellSize*1.5*2;

        this.canvasWidth = 
            (gridWidth * largeGridCellSize + this.gridFadeOffEdging) * this.numSteps + 
            this.betweenGridPadding * (this.numSteps-1) + 
            this.betweenGridPadding*2 // for padding on edges of canvas
        ; 
        this.canvasHeight =
            (gridHeight * largeGridCellSize + this.gridFadeOffEdging) + 
            this.betweenGridPadding*2 // for padding on edges of canvas
        ; 


        var canvasHtml = 
            "<canvas width='" + this.canvasWidth + "' height='" + this.canvasHeight + "'></canvas>"
        ;
        $(dispGolDiv).append(canvasHtml);
        this.canvas = $(dispGolDiv).children("canvas").first().get(0);


        // the grid for each moment
        this.grids = [];


        // these two indicate what the current selection is.  
        this.selectedAtomPositions = [];
        this.selectedAtomsTime = -1;       // value of -1 indicates no selected items

        this.selectedAtomHighlights = [];
        this.descendantAtomsHighlights = []; 

        this.ancestorColour = "Blue";



        this.show = function() {

            this.stage = new Stage(this.canvas);

            this.universe = new Universe( patterns[this.patternName].getPattern_PosArray().clone() );

            this.drawDiagram();

        }


        this.drawDiagram = function() {

            var topGridX = this.betweenGridPadding + this.gridFadeOffEdging/2;
            topGridY = topGridX;

            for (var timeStep = 0; timeStep < this.numSteps; timeStep++) {

                this.grids[timeStep] = 
                    new Grid(
                        topGridX,
                        topGridY,
                        gridRows,
                        gridCols,
                        largeGridCellSize,
                        smallGridCellSize,
                        this.universe,
                        timeStep
                    )
                ;
                this.grids[timeStep].container.name = "Grid container, time " + timeStep;
                this.grids[timeStep].drawGrid();
                this.grids[timeStep].drawPattern();
                this.stage.addChild(this.grids[timeStep].container);

                this.grids[timeStep].container.mouseEnabled = true;


                thisCausalRelnsDiagram = this;
                this.grids[timeStep].container.onClick = function(event) {
                    thisCausalRelnsDiagram.canvasClicked(event);
                }



                this.stage.update();

                var notLastTimestep = timeStep < (this.numSteps - 1);
                if (notLastTimestep) {
                    this.universe.next();
                    topGridX += this.grids[timeStep].getWidth(false) + this.betweenGridPadding + this.gridFadeOffEdging;
                }
            }
            
        }



        this.mouseClickEventToWithinGridPixelPos = function(event) {

            var gridPixelX,gridPixelY;
            var adjustment = 3; // just seems to need this for accuracy..
            gridPixelX = event.stageX - event.target.x - adjustment;
            gridPixelY = event.stageY - event.target.y - adjustment;

            return [gridPixelX,gridPixelY];

        }


        this.removeHighlightingOfSelectedCellAndDescendants = function() {
            for (var d = 0; d < this.descendantAtomsHighlights.length; d++) {
                this.descendantAtomsHighlights[d].parent.removeChild(this.descendantAtomsHighlights[d]);
            }
            this.descendantAtomsHighlights = [];

            for (var i = 0; i < this.selectedAtomHighlights.length; i++) {
                var highlight = this.selectedAtomHighlights[i];
                highlight.parent.removeChild(highlight);
            }
            this.selectedAtomHighlights = [];
        }


        this.createAndAddHighlightsForSelectedAtoms = function(grid) {
            for (var i = 0; i < this.selectedAtomPositions.length; i++) {
                var atom = this.selectedAtomPositions[i];
                this.createAndAddHighlightForSelectedAtom(atom,grid);
            };
        }

        this.createAndAddHighlightForSelectedAtom = function(selectedAtomPos,grid) {
            // ** is it really ok if position is off grid and highlight ends up null here?
            var highlight = grid.drawCellHighlighted(selectedAtomPos[0],selectedAtomPos[1],false,"yellow");
            this.selectedAtomHighlights.push( highlight );
            grid.container.addChild( highlight );
        }

        /*
         * Note: this assumes we're showing the descendants for all the
         *       selected atoms.
         */ 
        this.addCellToSelection = function(newSelectionCellPos,newSelectionTimeStep,grid) {

            this.selectedAtomPositions.push(newSelectionCellPos);
            this.selectedAtomsTime = newSelectionTimeStep;

            this.createAndAddHighlightsForSelectedAtoms(grid);
            this.createAndAddHighlightsForMultipleAtomsDescendants(newSelectionTimeStep);
        }


        /*
         * Note: the mouse click handler removes all highlights each time mouse is clicked
         * so we don't need to do that here.
         */
        this.removeCellFromSelection = function(selectedCellPos,selectionTimeStep,grid) {

            // Remove selectedCellPos from selectedAtomPositions.
            // remember that you can't use indexOf to find an array witin an array.
            for (var i = 0; i < this.selectedAtomPositions.length; i++) {
                if ( this.selectedAtomPositions[i].compareArrays(selectedCellPos) )  {
                    this.selectedAtomPositions.splice(i,1);   
                    break;
                }
            }
            
            if (this.selectedAtomPositions.length > 0) {

                this.createAndAddHighlightsForSelectedAtoms(grid);

                this.createAndAddHighlightsForMultipleAtomsDescendants(selectionTimeStep);
     
            } else {
                this.selectedAtomsTime = -1;
            }
        }


        this.addAndRegisterAtomHighlight = function(atomPos,time,colour) {

            if (colour == null) { colour = "green"; }

            var highlight = 
                this.grids[time].drawCellHighlighted(atomPos[0],atomPos[1],false,colour)
            ;
            // highlight will be null if the ancestor is positioned off the edge of the visible grid
            if (highlight != null) {
                this.descendantAtomsHighlights.push(highlight);
                this.grids[time].container.addChild(highlight);
            }

        }


        // NEW
        this.createAndAddHighlightForAtomParents = function(newSelectionCellPos,newSelectionTimeStep) {

            // no parents for cells at time 0
            if (newSelectionTimeStep == 0) { return; }

            var parents = this.snapshotParents.getRelatedAtomPositions(newSelectionTimeStep,newSelectionCellPos);

            var previousMoment = newSelectionCellPos-1;
            for (var i = 0; i < parents.length; i++) {
                var atomPos = parents[i];
                this.addAndRegisterAtomHighlight(atomPos,previousMoment,this.ancestorColour);
            }


        }
        

        this.createAndAddHighlightsForAtomDescendants = function(atomPos,atomTime) {

            var descendantsByTime = this.universe.getAtomsDescendants(atomTime,atomPos,this.numSteps-1);

            for (var t = atomTime + 1; t < this.numSteps; t++) {
                var descendantAtoms = descendantsByTime[t];
                for (var a = 0; a < descendantAtoms.length; a++) {
                    this.addAndRegisterAtomHighlight( descendantAtoms[a], t );
                };
            }
        }


        /**
         * Note: the starting time-step maybe > 0, which means that the first
         * relevant entry of the returned array will be at index > 0
         */
        this.getCommonDescendantsOfAtomsByTimestep = function(newSelectionTimeStep,descendantsForEachAtom) {

            var commonDescendantsByTimestep = [];
            for (var timeStep = newSelectionTimeStep + 1; timeStep < this.numSteps; timeStep++) {
                for (var atomIdx = 0; atomIdx < descendantsForEachAtom.length; atomIdx++) {
                    if (atomIdx == 0) {
                        commonDescendantsByTimestep[timeStep] =
                            descendantsForEachAtom[0][timeStep]
                        ;
                    } else {
                        commonDescendantsByTimestep[timeStep] = 
                            intersectArraysOfArrays(
                                commonDescendantsByTimestep[timeStep],
                                descendantsForEachAtom[atomIdx][timeStep]
                            )
                        ;
                    }
                }
            }
            return commonDescendantsByTimestep;
        }


        this.getDescendantsForAtoms = function(atomPositions,atomsTimeStep) {
            var descendantsForEachAtom = []; // each entry in this will be the descendants of an atom.
            for (var i = 0; i < atomPositions.length; i++) {
                var atomPos = atomPositions[i];
                descendantsForEachAtom[i] = 
                    this.universe.getAtomsDescendants(atomsTimeStep,atomPos,this.numSteps-1)
                ;
            }
            return descendantsForEachAtom;
        }
        

        this.getUniqueDescendantsByTimestep = function(descendantsForEachAtom,atomsTimeStep) {
            var uniqueDescendantsByTimestep = [];
            for (var timeStep = atomsTimeStep + 1; timeStep < this.numSteps; timeStep++) {
                uniqueDescendantsByTimestep[timeStep] = [];
                for (var atomIdx = 0; atomIdx < descendantsForEachAtom.length; atomIdx++) {
                    addUniqueItems( uniqueDescendantsByTimestep[timeStep], descendantsForEachAtom[atomIdx][timeStep] );
                }
            }
            return uniqueDescendantsByTimestep;
        }



        this.createAndAddHighlightsForMultipleAtomsDescendants = function(newSelectionTimeStep) {

            var descendantsForEachAtom = this.getDescendantsForAtoms(this.selectedAtomPositions,newSelectionTimeStep);

            var uniqueDescendantsByTimestep = this.getUniqueDescendantsByTimestep(descendantsForEachAtom,newSelectionTimeStep);

            var commonDescendantsByTimestep = 
                this.getCommonDescendantsOfAtomsByTimestep(newSelectionTimeStep,descendantsForEachAtom)
            ;


            // Add and register these
            for (timeStep = newSelectionTimeStep + 1; timeStep < this.numSteps; timeStep++) {

                var descendantPositions = uniqueDescendantsByTimestep[timeStep];
                for (var posIdx = 0; posIdx < descendantPositions.length; posIdx++) {
                    var descendantPos = descendantPositions[posIdx];
                    this.addAndRegisterAtomHighlight( descendantPos, timeStep );
                }

                // if only a single atom selected, don't use the special highlight for common-descendants
                // strictly-speaking, this is wrong, but i think i'll be less confusing to user.
                // ***LIMITATION: this is actually the number of cell selected. it could be greater
                // than 1 but still only 1 of those selected cell contain an atom!
                if (this.selectedAtomPositions.length > 1) {
                    var commonDescendantPositions = commonDescendantsByTimestep[timeStep];
                    for (var posIdx = 0; posIdx < commonDescendantPositions.length; posIdx++) {
                        var commonDescendantPos = commonDescendantPositions[posIdx];
                        this.addAndRegisterAtomHighlight( commonDescendantPos, timeStep, "Orchid" );  
                            // Purple and Orange also work ok.
                    }
                }

            }
        }


        this.selectNothing = function() {

            this.selectedAtomsTime = -1;
            this.selectedAtomPositions = [];

        }


        /**
         * select only this cell
         */
        this.selectSingleCell = function(newSelectionCellPos,newSelectionTimeStep,grid) {
        
            this.selectedAtomPositions = [ newSelectionCellPos ];
            this.selectedAtomsTime = newSelectionTimeStep;

            this.createAndAddHighlightsForSelectedAtoms(grid);
            this.createAndAddHighlightsForAtomDescendants(newSelectionCellPos,newSelectionTimeStep);
            this.createAndAddHighlightForAtomParents(newSelectionCellPos,newSelectionTimeStep);

        }
        


        /*
         * At this point there may be 0, 1 or many selected cells (all within same grid).
         */
        this.canvasClicked = function(event) {

            var altKeyDown = event.nativeEvent.altKey;
            
            var grid = event.target.ownerGrid;
            var withinGridPixelPos = this.mouseClickEventToWithinGridPixelPos(event);
            var newSelectionCellPos  = this.gridPixelPosToCellPos(withinGridPixelPos[0],withinGridPixelPos[1],event.target);
            var newSelectionTimeStep = grid.timeStep;

            this.removeHighlightingOfSelectedCellAndDescendants();

            var clickedInDifferentGrid = ( this.selectedAtomsTime != -1 && this.selectedAtomsTime != newSelectionTimeStep );

            if (altKeyDown) {

                if ( clickedInDifferentGrid ) {

                    // **this applies regardless of whether alt-key down or not... so should probably adjust logic structure

                    this.selectSingleCell(newSelectionCellPos,newSelectionTimeStep,grid);

                } else {

                    var clickedOnASelectedCell = containsSubArray(this.selectedAtomPositions,newSelectionCellPos);

                    if (clickedOnASelectedCell) {
                        
                        this.removeCellFromSelection(newSelectionCellPos,newSelectionTimeStep,grid);

                    } else {

                        this.addCellToSelection(newSelectionCellPos,newSelectionTimeStep,grid);
                        
                    }
                
                }

            } else {  // alt key not held down - selecting cells one at a time

                var noCurrentSelection     = (this.selectedAtomPositions.length == 0);
                var multSelections         = (this.selectedAtomPositions.length > 1);
                var clickedOnDifferentCell = !containsSubArray(this.selectedAtomPositions,newSelectionCellPos);

                if (noCurrentSelection || multSelections || clickedInDifferentGrid || clickedOnDifferentCell) {
                    
                    // In case of mult-selection, regardless of whether clicking within or 
                    // outside of selection, make selected cell the only selected cell.

                    this.selectSingleCell(newSelectionCellPos,newSelectionTimeStep,grid);

                } else {

                    this.selectNothing();

                }

            }

            this.stage.update();


        }


        // REFACTORING this should probably go in the Grid's view.
        this.gridPixelPosToCellPos = function(x,y,container) {

            xPos = Math.floor( x / container.ownerGrid.largeCellSize );
            yPos = Math.floor( y / container.ownerGrid.largeCellSize );

            return [xPos,yPos]
        }
        

    }


    // Where elements are compared using compareArrays
    function intersectArraysOfArrays(array1,array2) {
        /* cases to handle
            - arrays may be of different lengths
            - an array could be empty.
        */
        var intersection = [];
        for (var a1 = 0; a1 < array1.length; a1++) {
            for (var a2 = 0; a2 < array2.length; a2++) {
                if (array1[a1].compareArrays(array2[a2])) {
                    intersection.push(array1[a1]);
                    break;
                }
            }
        }
        return intersection;
    }

