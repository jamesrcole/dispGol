


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


            var selectedAtom = [0,1];

            // hard-coding of selected atom
            var highlight;
            highlight = this.grids[0].drawCellHighlighted(selectedAtom[0],selectedAtom[1],false,"yellow");
            this.grids[0].container.addChild(highlight);
        
            // hard-coded highlighting of children
            var childAtoms = universe.snapshotChildren.getRelatedAtomPositions(0,selectedAtom);
            for (var i = 0; i < childAtoms.length; i++) {
                var childAtom = childAtoms[i];
                highlight = this.grids[1].drawCellHighlighted(childAtom[0],childAtom[1],false,"green");
                this.grids[1].container.addChild(highlight);
            };


            stage.update();



            
        }



    }




