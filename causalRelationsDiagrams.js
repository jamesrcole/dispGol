


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








        this.show = function() {

            var stage = new Stage(this.canvas);

            var universe = new Universe( patterns[this.patternName].getPattern_PosArray().clone() );

            this.drawDiagram(stage,universe);


        }


        this.drawDiagram = function(stage,universe) {

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
                        universe,
                        timeStep
                    )
                ;
                this.grids[timeStep].drawGrid();
                this.grids[timeStep].drawPattern();
                stage.addChild(this.grids[timeStep].container);

                //**
                this.grids[timeStep].container.mouseEnabled = true;
                this.grids[timeStep].container.onClick = clickHandler;

                stage.update();

                var notLastTimestep = timeStep < (this.numSteps - 1);
                if (notLastTimestep) {
                    universe.next();
                    topGridX += this.grids[timeStep].getWidth(false) + this.betweenGridPadding + this.gridFadeOffEdging;
                }

            }





            var highlight;

            // hard-coding of selected atom
            var selectedAtom = [3,4];
            var selectedAtomTime = 0;
            highlight = this.grids[selectedAtomTime].drawCellHighlighted(selectedAtom[0],selectedAtom[1],false,"yellow");
            this.grids[selectedAtomTime].container.addChild(highlight);

            var descendantsByTime = universe.getAtomsDescendants(selectedAtomTime,selectedAtom,this.numSteps-1);

            for (var t = selectedAtomTime + 1; t < this.numSteps; t++) {

                var descendantAtoms = descendantsByTime[t];
                for (var a = 0; a < descendantAtoms.length; a++) {
                    var descendantAtom = descendantAtoms[a];
                    highlight = this.grids[t].drawCellHighlighted(descendantAtom[0],descendantAtom[1],false,"green");
                    this.grids[t].container.addChild(highlight);
                };
            
            }

            stage.update();

            
        }



    }



    function clickHandler(event) {

        alert("a click: " + event);

    }
    




