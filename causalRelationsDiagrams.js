


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




        this.show = function() {

            var stage = new Stage(this.canvas);

            var universe = new Universe( patterns[this.patternName].getPattern_PosArray().clone() );

            this.drawDiagram(stage,universe);


        }


        this.drawDiagram = function(stage,universe) {

            // draw the initial universe state

            var topGridX = 50;
            topGridY = 50;

            var timeStep = 0;

            this.topGrid = 
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

            this.topGrid.drawGrid();
            this.topGrid.drawPattern();
            stage.addChild(this.topGrid.container);

            var highlight;
            highlight = this.topGrid.drawCellHighlighted(2,2,false,"yellow");
            this.topGrid.container.addChild(highlight);
            

            stage.update();

            for (; timeStep < this.numSteps; timeStep++) {

                topGridX += 170;

                var notLastTimestep = timeStep < (this.numSteps - 1);

                if (notLastTimestep) {

                    universe.next();

                    this.topGrid = 
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

                    this.topGrid.drawGrid();
                    this.topGrid.drawPattern();
                    stage.addChild(this.topGrid.container);

                    stage.update();

                }
            }
            
            debugger;
        }


    }







