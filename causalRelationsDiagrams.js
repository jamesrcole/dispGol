



    function CausalRelationsDiagram(dispGolDiv) {

        this.patternName = $(dispGolDiv).attr('pattern');

        if (patterns[this.patternName] == null) {
            alert("CausalRelations diagram, ERROR: invalid @pattern: " + this.patternName);
        }

        this.numSteps  = $(dispGolDiv).attr('steps');
        var gridWidth  = $(dispGolDiv).attr('gridWidth'); // in number of cells
        var gridHeight = $(dispGolDiv).attr('gridHeight');

        // global vars stuff to sort out.... ***
        // also, end up renaming gridWidth and gridHeight!! to rows/cols **
        gridRows = gridHeight;
        gridCols = gridWidth;


        this.betweenGridPadding = 15;

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
            "<canvas width='" + this.canvasWidth + "' height='" + this.canvasHeight + "' " +
                       "style='cursor: pointer;'></canvas>"
        ;
        $(dispGolDiv).append(canvasHtml);
        this.canvas = $(dispGolDiv).children("canvas").first().get(0);


        // the grid for each moment
        this.grids = [];


        // these two indicate what the current selection is.  
        this.selectedAtomPositions = [];
        this.selectedAtomsTime = -1;       // value of -1 indicates no selected items

        this.selectedAtomHighlights = [];
        this.descendantAndAncestorHighlights = []; 

        this.selectedCellColour = "Gray";
        this.ancestorColour = "#75ACFF"; // "LightBlue";
        this.commonAncestorColour = "#0099FF";   // "Orchid";
        this.descendantColour = "LightGreen";
        this.commonDescendantColour = "#00E68A"; // "Orchid"; // Purple and Orange also work ok.


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


                var thisCausalRelnsDiagram = this;
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


        this.removeHighlightingOfSelectedCellAndItsAncestorsAndDescendants = function() {
            for (var d = 0; d < this.descendantAndAncestorHighlights.length; d++) {
                this.descendantAndAncestorHighlights[d].parent.removeChild(this.descendantAndAncestorHighlights[d]);
            }
            this.descendantAndAncestorHighlights = [];

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


        /*
         * Note: this assumes we're showing the ancestors and descendants for all
         *       of the selected atoms.
         */ 
        this.addCellToSelection = function(newSelectionCellPos,newSelectionTimeStep,grid) {

            this.selectedAtomPositions.push(newSelectionCellPos);
            this.selectedAtomsTime = newSelectionTimeStep;

            this.createAndAddHighlightsForSelectedAtoms(grid);
            this.createAndAddHighlightsForMultipleAtomsDescendants(newSelectionTimeStep);
            this.createAndAddHighlightsForMultipleAtomsAncestors(newSelectionTimeStep);
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
                this.createAndAddHighlightsForMultipleAtomsAncestors(selectionTimeStep);
     
            } else {
                this.selectedAtomsTime = -1;
            }
        }


        this.createAndAddHighlightForSelectedAtom = function(selectedAtomPos,grid) {
            var highlight = grid.drawCellHighlighted(selectedAtomPos[0],selectedAtomPos[1],false,this.selectedCellColour);
            if (highlight != null) {
                this.selectedAtomHighlights.push( highlight );
                grid.container.addChild( highlight );
            }
        }
        
        this.addAndRegisterAtomHighlight = function(atomPos,time,colour) {

            if (colour == null) { colour = "Pink"; }

            var highlight = this.grids[time].drawCellHighlighted(atomPos[0],atomPos[1],false,colour);

            // highlight will be null if the ancestor is positioned off the edge of the visible grid
            if (highlight != null) {
                this.descendantAndAncestorHighlights.push(highlight);
                this.grids[time].container.addChild(highlight);
            }

        }



        this.createAndAddHighlightsForAtomDescendants = function(atomPos,atomTime) {

            var descendantsByTime = this.universe.getAtomsDescendants(atomTime,atomPos,this.numSteps-1);

            for (var t = atomTime + 1; t < this.numSteps; t++) {
                var descendantAtoms = descendantsByTime[t];
                for (var a = 0; a < descendantAtoms.length; a++) {
                    this.addAndRegisterAtomHighlight(descendantAtoms[a],t,this.descendantColour);
                };
            }
        }


        /**
         * Note: the starting time-step maybe > 0, which means that the first
         * relevant entry of the returned array will be at index > 0
         */
        this.getCommonDescendantsOfAtomsByTimestep = function(atomTimeStep,descendantsForEachAtom) {

            var commonDescendantsByTimestep = [];
            for (var timeStep = atomTimeStep + 1; timeStep < this.numSteps; timeStep++) {
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


        this.getCommonAncestorsOfAtomsByTimestep = function(atomTimeStep,ancestorsForEachAtom) {

            var commonAncestorsByTimestep = [];
            for (var timeStep = atomTimeStep - 1; timeStep >= 0; timeStep--) {
                for (var atomIdx = 0; atomIdx < ancestorsForEachAtom.length; atomIdx++) {
                    if (atomIdx == 0) {
                        commonAncestorsByTimestep[timeStep] =
                            ancestorsForEachAtom[0][timeStep]
                        ;
                    } else {
                        commonAncestorsByTimestep[timeStep] = 
                            intersectArraysOfArrays(
                                commonAncestorsByTimestep[timeStep],
                                ancestorsForEachAtom[atomIdx][timeStep]
                            )
                        ;
                    }
                }
            }
            return commonAncestorsByTimestep;
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



        this.addAndRegisterDescendantHighlights = function(
                newSelectionTimeStep,uniqueDescendantsByTimestep,commonDescendantsByTimestep) {

            for (var timeStep = newSelectionTimeStep + 1; timeStep < this.numSteps; timeStep++) {

                var descendantPositions = uniqueDescendantsByTimestep[timeStep];
                for (var posIdx = 0; posIdx < descendantPositions.length; posIdx++) {
                    var descendantPos = descendantPositions[posIdx];
                    this.addAndRegisterAtomHighlight(descendantPos,timeStep,this.descendantColour);
                }

                // if only a single atom selected, don't use the special highlight for common-descendants
                // strictly-speaking, this is wrong, but i think i'll be less confusing to user.
                // ***LIMITATION: this is actually the number of cell selected. it could be greater
                // than 1 but still only 1 of those selected cell contain an atom!
                if (this.selectedAtomPositions.length > 1) {
                    var commonDescendantPositions = commonDescendantsByTimestep[timeStep];
                    for (var posIdx = 0; posIdx < commonDescendantPositions.length; posIdx++) {
                        var commonDescendantPos = commonDescendantPositions[posIdx];
                        this.addAndRegisterAtomHighlight(commonDescendantPos,timeStep,this.commonDescendantColour);  
                    }
                }
            }
        }



        this.createAndAddHighlightsForMultipleAtomsDescendants = function(newSelectionTimeStep) {

            var descendantsForEachAtom = this.getDescendantsForAtoms(this.selectedAtomPositions,newSelectionTimeStep);

            var uniqueDescendantsByTimestep = this.getUniqueDescendantsByTimestep(descendantsForEachAtom,newSelectionTimeStep);

            var commonDescendantsByTimestep = 
                this.getCommonDescendantsOfAtomsByTimestep(newSelectionTimeStep,descendantsForEachAtom)
            ;

            this.addAndRegisterDescendantHighlights(newSelectionTimeStep,uniqueDescendantsByTimestep,commonDescendantsByTimestep);
        }



        this.addAndRegisterAncestorHighlights = function(newSelectionTimeStep,uniqueAncestorsByTimestep,commonAncestorsByTimestep) {
            for (var timeStep = newSelectionTimeStep - 1; timeStep >= 0; timeStep--) {

                var ancestorPositions = uniqueAncestorsByTimestep[timeStep];
                for (var posIdx = 0; posIdx < ancestorPositions.length; posIdx++) {
                    var ancestorPos = ancestorPositions[posIdx];
                    this.addAndRegisterAtomHighlight(ancestorPos,timeStep,this.ancestorColour);
                }

                // if only a single atom selected, don't use the special highlight for common-ancestors
                // strictly-speaking, this is wrong, but i think i'll be less confusing to user.
                // ***LIMITATION: this is actually the number of cell selected. it could be greater
                // than 1 but still only 1 of those selected cell contain an atom!
                if (this.selectedAtomPositions.length > 1) {
                    var commonAncestorPositions = commonAncestorsByTimestep[timeStep];
                    for (var posIdx = 0; posIdx < commonAncestorPositions.length; posIdx++) {
                        var commonAncestorPos = commonAncestorPositions[posIdx];
                        this.addAndRegisterAtomHighlight(commonAncestorPos,timeStep,this.commonAncestorColour);  
                    }
                }

            } 
        }



        this.getAncestorsForAtoms = function(atomPositions,atomsTimeStep) {
            var ancestorsForEachAtom = []; // each entry in this will be the ancestors of an atom.
            for (var i = 0; i < atomPositions.length; i++) {
                var atomPos = atomPositions[i];
                ancestorsForEachAtom[i] = 
                    this.universe.getAtomsAncestors(atomsTimeStep,atomPos)
                ;
            }
            return ancestorsForEachAtom;
        }


        this.getUniqueAncestorsByTimestep = function(ancestorsForEachAtom,atomsTimeStep) {
            var uniqueAncestorsByTimestep = [];
            for (var timeStep = atomsTimeStep - 1; timeStep >= 0; timeStep--) {
                uniqueAncestorsByTimestep[timeStep] = [];
                for (var atomIdx = 0; atomIdx < ancestorsForEachAtom.length; atomIdx++) {
                    addUniqueItems(uniqueAncestorsByTimestep[timeStep], ancestorsForEachAtom[atomIdx][timeStep]);
                }
            }
            return uniqueAncestorsByTimestep;
        }


        this.createAndAddHighlightsForMultipleAtomsAncestors = function(newSelectionTimeStep) {

            var ancestorsForEachAtom = this.getAncestorsForAtoms(this.selectedAtomPositions,newSelectionTimeStep);

            var uniqueAncestorsByTimestep = this.getUniqueAncestorsByTimestep(ancestorsForEachAtom,newSelectionTimeStep);

            var commonAncestorsByTimestep = this.getCommonAncestorsOfAtomsByTimestep(newSelectionTimeStep,ancestorsForEachAtom);

            this.addAndRegisterAncestorHighlights(newSelectionTimeStep,uniqueAncestorsByTimestep,commonAncestorsByTimestep);
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
            this.createAndAddHighlightsForMultipleAtomsAncestors(newSelectionTimeStep); // handles case of single atom 

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

            if (newSelectionCellPos[0] < 0 || newSelectionCellPos[1] < 0 || 
                newSelectionCellPos[0] >= gridCols || newSelectionCellPos[1] >= gridRows) { return; }

            this.removeHighlightingOfSelectedCellAndItsAncestorsAndDescendants();

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

