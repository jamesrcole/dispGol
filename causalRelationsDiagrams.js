
    // hack, so these details is accessible to click handler
    var numSteps;
    var causalRelationsDiagram;


    // these two indicate what the current selection is.  
    var selectedAtomPositions = [];
    var selectedAtomsTime = -1;       // value of -1 indicates no selected items

    var selectedAtomHighlights = [];
    var descendantAtomsHighlights = []; 




    function CausalRelationsDiagram(dispGolDiv) {

        causalRelationsDiagram = this;

        this.patternName = $(dispGolDiv).attr('pattern');

        if (patterns[this.patternName] == null) {
            alert("UpdaterAnimation, ERROR: invalid @pattern: " + this.patternName);
        }

        this.numSteps  = $(dispGolDiv).attr('steps');
        numSteps = this.numSteps;
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
            for (var d = 0; d < descendantAtomsHighlights.length; d++) {
                descendantAtomsHighlights[d].parent.removeChild(descendantAtomsHighlights[d]);
            }
            descendantAtomsHighlights = [];

            for (var i = 0; i < selectedAtomHighlights.length; i++) {
                var highlight = selectedAtomHighlights[i];
                highlight.parent.removeChild(highlight);
            }
            selectedAtomHighlights = [];
        }


        this.createAndAddHighlightsForSelectedAtoms = function(selectedAtomPositions,grid) {
            for (var i = 0; i < selectedAtomPositions.length; i++) {
                var atom = selectedAtomPositions[i];
                this.createAndAddHighlightForSelectedAtom(atom,grid);
            };
        }

        this.createAndAddHighlightForSelectedAtom = function(selectedAtomPos,grid) {
            // ** is it really ok if position is off grid and highlight ends up null here?
            var highlight = grid.drawCellHighlighted(selectedAtomPos[0],selectedAtomPos[1],false,"yellow");
            selectedAtomHighlights.push( highlight );
            grid.container.addChild( highlight );
        }

        /*
         * Note: this assumes we're showing the descendants for all the
         *       selected atoms.
         */ 
        this.addCellToSelection = function(newSelectionCellPos,newSelectionTimeStep,grid) {

            selectedAtomPositions.push(newSelectionCellPos);
            selectedAtomsTime = newSelectionTimeStep;

            this.createAndAddHighlightsForSelectedAtoms(selectedAtomPositions,grid);

            this.createAndAddHighlightsForMultipleAtomsDescendants(selectedAtomPositions,newSelectionTimeStep);

        }


        /*
         * Note: the mouse click handler removes all highlights each time mouse is clicked
         * so we don't need to do that here.
         */
        this.removeCellFromSelection = function(selectedCellPos,selectionTimeStep,grid) {

            // Remove selectedCellPos from selectedAtomPositions.
            // remember that you can't use indexOf to find an array witin an array.
            for (var i = 0; i < selectedAtomPositions.length; i++) {
                if ( selectedAtomPositions[i].compareArrays(selectedCellPos) )  {
                    selectedAtomPositions.splice(i,1);   
                    break;
                }
            }
            
            if (selectedAtomPositions.length > 0) {

                this.createAndAddHighlightsForSelectedAtoms(selectedAtomPositions,grid);

                this.createAndAddHighlightsForMultipleAtomsDescendants(selectedAtomPositions,selectionTimeStep);
     
            } else {
                selectedAtomsTime = -1;
            }
        }


        this.addAndRegisterAtomHighlight = function(atomPos, time) {

            var highlight = 
                causalRelationsDiagram.grids[time].drawCellHighlighted(atomPos[0],atomPos[1],false,"green")
            ;
            // highlight will be null if the ancestor is positioned off the edge of the visible grid
            if (highlight != null) {
                descendantAtomsHighlights.push(highlight);
                causalRelationsDiagram.grids[time].container.addChild(highlight);
            }

        }


        this.createAndAddHighlightsForAtomDescendants = function(atomPos,atomTime) {

            var descendantsByTime = causalRelationsDiagram.universe.getAtomsDescendants(atomTime,atomPos,numSteps-1);

            for (var t = atomTime + 1; t < numSteps; t++) {

                var descendantAtoms = descendantsByTime[t];
                for (var a = 0; a < descendantAtoms.length; a++) {
                    this.addAndRegisterAtomHighlight( descendantAtoms[a], t );
                };
            
            }

        }
        

        this.createAndAddHighlightsForMultipleAtomsDescendants = function(selectedAtomPositions,newSelectionTimeStep) {

            // Get descendants for each of selected atom positions
            var descendantsForEachAtom = []; // each entry in this will be the descendants of an atom.
            for (var i = 0; i < selectedAtomPositions.length; i++) {
                atomPos = selectedAtomPositions[i];
                descendantsForEachAtom[i] = 
                    causalRelationsDiagram.universe.getAtomsDescendants(newSelectionTimeStep,atomPos,numSteps-1)
                ;
            }

            // Get the unique set of descendants for each moment in time to show
            var uniqueDescendantsForEachTimestep = [];
            for (var timeStep = newSelectionTimeStep + 1; timeStep < numSteps; timeStep++) {
                uniqueDescendantsForEachTimestep[timeStep] = [];
                for (var atomIdx = 0; atomIdx < descendantsForEachAtom.length; atomIdx++) {
                    addUniqueItems( uniqueDescendantsForEachTimestep[timeStep], descendantsForEachAtom[atomIdx][timeStep] );
                }
            }

            // Add and register these
            for (timeStep = newSelectionTimeStep + 1; timeStep < numSteps; timeStep++) {
                var atomPositions = uniqueDescendantsForEachTimestep[timeStep];
                for (var posIdx = 0; posIdx < atomPositions.length; posIdx++) {
                    var atomPos = atomPositions[posIdx];
                    this.addAndRegisterAtomHighlight( atomPos, timeStep )
                }
            }
        }


        this.selectNothing = function() {

            selectedAtomsTime = -1;
            selectedAtomPositions = [];

        }


        /**
         * select only this cell
         */
        this.selectCell = function(newSelectionCellPos,newSelectionTimeStep,grid) {
        
            selectedAtomPositions = [ newSelectionCellPos ];
            selectedAtomsTime = newSelectionTimeStep;

            this.createAndAddHighlightsForSelectedAtoms(selectedAtomPositions,grid);
            this.createAndAddHighlightsForAtomDescendants(newSelectionCellPos,newSelectionTimeStep);

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

            var clickedInDifferentGrid = ( selectedAtomsTime != -1 && selectedAtomsTime != newSelectionTimeStep );

            if (altKeyDown) {

                if ( clickedInDifferentGrid ) {

                    // **this applies regardless of whether alt-key down or not... so should probably adjust logic structure

                    this.selectCell(newSelectionCellPos,newSelectionTimeStep,grid);

                } else {

                    var clickedOnASelectedCell = containsSubArray(selectedAtomPositions,newSelectionCellPos);

                    if (clickedOnASelectedCell) {
                        
                        this.removeCellFromSelection(newSelectionCellPos,newSelectionTimeStep,grid);

                    } else {

                        this.addCellToSelection(newSelectionCellPos,newSelectionTimeStep,grid);
                        
                    }
                
                }

            } else {  // alt key not held down - selecting cells one at a time

                var noCurrentSelection     = (selectedAtomPositions.length == 0);
                var multSelections         = (selectedAtomPositions.length > 1);
                var clickedOnDifferentCell = !containsSubArray(selectedAtomPositions,newSelectionCellPos);

                if (noCurrentSelection || multSelections || clickedInDifferentGrid || clickedOnDifferentCell) {
                    
                    // In case of mult-selection, regardless of whether clicking within or 
                    // outside of selection, make selected cell the only selected cell.

                    this.selectCell(newSelectionCellPos,newSelectionTimeStep,grid);

                } else {

                    this.selectNothing();

                }

            }

            causalRelationsDiagram.stage.update();

        }


        // REFACTORING this should probably go in the Grid's view.
        this.gridPixelPosToCellPos = function(x,y,container) {

            xPos = Math.floor( x / container.ownerGrid.largeCellSize );
            yPos = Math.floor( y / container.ownerGrid.largeCellSize );

            return [xPos,yPos]
        }
        

    }



