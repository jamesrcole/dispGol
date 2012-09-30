


    function CausalRelationsDiagram(dispGolDiv) {

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
            "<canvas width='900' height='700'></canvas>"
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

            var topGridX = 50;
            topGridY = 50;

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

                stage.update();

                var notLastTimestep = timeStep < (this.numSteps - 1);
                if (notLastTimestep) {
                    universe.next();
                    topGridX += 170;
                }

            }





            var highlight;

            // hard-coding of selected atom
            var selectedAtom = [1,0];
            var selectedAtomTime = 1;
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




