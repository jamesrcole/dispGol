
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



    var selectedAtomPos = [];
    var selectedAtomTime;
    var selectedAtomHighlight;
    var descendantAtomsHighlights = []; 



    function clickHandler(event) {

        var gridX,gridY;
        var adjustment = 3; // just seems to need this for accuracy..
        gridX = event.stageX - event.target.x - adjustment;
        gridY = event.stageY - event.target.y - adjustment;

        var newSelectionCellPos;
        newSelectionCellPos = gridPixelPosToCellPos(gridX,gridY,event.target)

        var grid = event.target.ownerGrid;
        var newSelectionTimeStep = grid.timeStep;


        // remove highlighting of selected cell and descendants
        for (var d = 0; d < descendantAtomsHighlights.length; d++) {
            descendantAtomsHighlights[d].parent.removeChild(descendantAtomsHighlights[d]);
        }
        descendantAtomsHighlights = [];
        if (selectedAtomHighlight != undefined) {
            selectedAtomHighlight.parent.removeChild(selectedAtomHighlight);
            selectedAtomHighlight = null;
        }


        // if clicked on a different cell
        var differentCellPos = !selectedAtomPos.compareArrays(newSelectionCellPos);
        if (differentCellPos || selectedAtomTime != newSelectionTimeStep) {

            selectedAtomTime = newSelectionTimeStep;
            selectedAtomPos  = newSelectionCellPos;


            var highlight;

            selectedAtomHighlight = 
                grid.drawCellHighlighted(selectedAtomPos[0],selectedAtomPos[1],false,"yellow")
            ;
            grid.container.addChild(selectedAtomHighlight);

            var descendantsByTime = causalRelationsDiagram.universe.getAtomsDescendants(selectedAtomTime,selectedAtomPos,numSteps-1);

            for (var t = selectedAtomTime + 1; t < numSteps; t++) {

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

        
        } else {

            selectedAtomTime = -1;
            selectedAtomPos  = [];

        }


        causalRelationsDiagram.stage.update();


    }


    // REFACTORING this should probably go in the Grid's view.
    function gridPixelPosToCellPos(x,y,container) {

        xPos = Math.floor( x / container.ownerGrid.largeCellSize );
        yPos = Math.floor( y / container.ownerGrid.largeCellSize );

        return [xPos,yPos]
    }
    




