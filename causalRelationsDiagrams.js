
    // hack, so these details is accessible to click handler
    var numSteps;
    var causalRelationsDiagram;

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

                //**
                this.grids[timeStep].container.mouseEnabled = true;
                this.grids[timeStep].container.onClick = clickHandler;

                this.stage.update();

                var notLastTimestep = timeStep < (this.numSteps - 1);
                if (notLastTimestep) {
                    this.universe.next();
                    topGridX += this.grids[timeStep].getWidth(false) + this.betweenGridPadding + this.gridFadeOffEdging;
                }

            }

            
        }


    }



    // these two indicate what the current selection is.  
    var selectedAtomPos = [];   // empty array indicates no selected items
    var selectedAtomTime;       // value of -1 indicates no selected items

    var selectedAtomHighlight;
    var descendantAtomsHighlights = []; 




    function mouseClickEventToWithinGridPixelPos(event) {

        var gridPixelX,gridPixelY;
        var adjustment = 3; // just seems to need this for accuracy..
        gridPixelX = event.stageX - event.target.x - adjustment;
        gridPixelY = event.stageY - event.target.y - adjustment;

        return [gridPixelX,gridPixelY];

    }


    function removeHighlightingOfSelectedCellAndDescendants() {
        for (var d = 0; d < descendantAtomsHighlights.length; d++) {
            descendantAtomsHighlights[d].parent.removeChild(descendantAtomsHighlights[d]);
        }
        descendantAtomsHighlights = [];
        if (selectedAtomHighlight != undefined) {
            selectedAtomHighlight.parent.removeChild(selectedAtomHighlight);
            selectedAtomHighlight = null;
        }
    }

    function createAndAddHighlightForSelectedAtom(selectedAtomPos,grid) {
        selectedAtomHighlight = grid.drawCellHighlighted(selectedAtomPos[0],selectedAtomPos[1],false,"yellow");
        grid.container.addChild(selectedAtomHighlight);
    }


    function createAndAddHighlightsForAtomDescendants(selectedAtomPos,selectedAtomTime) {

        var descendantsByTime = causalRelationsDiagram.universe.getAtomsDescendants(selectedAtomTime,selectedAtomPos,numSteps-1);

        for (var t = selectedAtomTime + 1; t < numSteps; t++) {

            var highlight;

            var descendantAtoms = descendantsByTime[t];
            for (var a = 0; a < descendantAtoms.length; a++) {
                var descendantAtom = descendantAtoms[a];
                highlight = 
                    causalRelationsDiagram.grids[t].drawCellHighlighted(descendantAtom[0],descendantAtom[1],false,"green")
                ;
                // highlight will be null if the ancestor is positioned off the edge of the visible grid
                if (highlight != null) {
                    descendantAtomsHighlights.push(highlight);
                    causalRelationsDiagram.grids[t].container.addChild(highlight);
                }
            };
        
        }

    }

    /*
     * At this point there may be 0, 1 or many selected cells (all within same grid).
     */
    function clickHandler(event) {

        var altKeyDown = event.nativeEvent.altKey;
        

        var grid = event.target.ownerGrid;
        var withinGridPixelPos = mouseClickEventToWithinGridPixelPos(event);
        var newSelectionCellPos  = gridPixelPosToCellPos(withinGridPixelPos[0],withinGridPixelPos[1],event.target);
        var newSelectionTimeStep = grid.timeStep;

        removeHighlightingOfSelectedCellAndDescendants();


        if (altKeyDown) {


        } else {

            var differentCellPos = !selectedAtomPos.compareArrays(newSelectionCellPos);
            var differentTime = (selectedAtomTime != newSelectionTimeStep);
            var clickedOnDifferentCell = (differentCellPos || differentTime);

            if (clickedOnDifferentCell) {

                createAndAddHighlightForSelectedAtom(newSelectionCellPos,grid);
                createAndAddHighlightsForAtomDescendants(newSelectionCellPos,newSelectionTimeStep);

                selectedAtomPos = newSelectionCellPos;
     
                selectedAtomTime = newSelectionTimeStep;
                 

            } else {

                selectedAtomTime = -1;
                selectedAtomPos  = [];

            }

        }

        causalRelationsDiagram.stage.update();


    }


    // REFACTORING this should probably go in the Grid's view.
    function gridPixelPosToCellPos(x,y,container) {

        xPos = Math.floor( x / container.ownerGrid.largeCellSize );
        yPos = Math.floor( y / container.ownerGrid.largeCellSize );

        return [xPos,yPos]
    }
    




