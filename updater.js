

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

            background.cache(0,0,w,h);

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
            this.matchShape.cache(-1,-1,catchmentWidth+2,catchmentWidth+2);

            this.noMatchShape.graphics
                .beginStroke(noMatchColour)
                .rect(0,0,catchmentWidth,catchmentWidth)
                .rect(cellSize,cellSize,cellSize,cellSize)
                .endStroke()
            ;
            this.noMatchShape.cache(-1,-1,catchmentWidth+2,catchmentWidth+2);
                

            this.iccBounds = new Shape();
            this.iccBounds.graphics
                .beginStroke("#000000")
                .rect(0,0,catchmentWidth,catchmentWidth)
                .rect(cellSize,cellSize,cellSize,cellSize)
                .endStroke()
            ;
            this.iccBounds.cache(-1,-1,catchmentWidth+2,catchmentWidth+2);

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
        var activeBGWidth = this.width-2;
        var activeBGHeight = this.height-2;
        this.activeBG.graphics
            .beginFill(activeBGColour)
            .rect(0,0,activeBGWidth,activeBGHeight)
            .endFill()
        ;

        this.activeBG.cache(0,0,activeBGWidth,activeBGHeight);


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

            hole.cache(-2,-2,this.holeDims.width+4,this.holeDims.height+4);

            this.updater.container.addChild(hole);


            var holeHorizShadowLine = new Shape();
            holeHorizShadowLine.x = this.x + this.armPadding;
            holeHorizShadowLine.y = this.y + this.armPadding;
            holeHorizShadowLineWidth = this.threeSquareWidth;
            holeHorizShadowLine.graphics
                .beginStroke("gray")
                .moveTo(0,0)
                .lineTo(holeHorizShadowLineWidth,0)
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
            
            holeHorizShadowLine.cache(0,0,holeHorizShadowLineWidth,shadowOffset+5);

            this.updater.container.addChild(holeHorizShadowLine);


            var holeVertShadowLine = new Shape();
            holeVertShadowLine.x = this.x + this.armPadding;
            holeVertShadowLine.y = this.y + this.armPadding;
            holeVertShadowLineHeight = this.threeSquareWidth;
            holeVertShadowLine.graphics
                .beginStroke("gray")
                .moveTo(0,0)
                .lineTo(0,holeVertShadowLineHeight)
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

            holeVertShadowLine.cache(0,0,shadowOffset+5,holeVertShadowLineHeight);

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

            bottomShadowLine.cache(0,0,this.width,outerShadowOffset+5);

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

            guideLines.cache(0,-4,guideLinesWidth+4,this.holeDims.height+8);

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

        this.guideLines.cache(0,-4,this.guideLinesDims.width+4,this.guideLinesDims.height+8);
        



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

            hole.cache(-2,-2,this.cellHole.width+4,this.cellHole.width+4);

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
            var holeHorizShadowLineWidth = this.cellHole.width;
            holeHorizShadowLine.graphics
                .beginStroke("gray")
                .moveTo(0,0)
                .lineTo(holeHorizShadowLineWidth,0)
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

            holeHorizShadowLine.cache(0,-4,holeHorizShadowLineWidth,8);

            this.updater.container.addChild(holeHorizShadowLine);


            var holeVertShadowLine = new Shape();
            holeVertShadowLine.x = this.cellHole.x;
            holeVertShadowLine.y = this.cellHole.y;
            var holeVertShadowLineHeight = this.cellHole.width;
            holeVertShadowLine.graphics
                .beginStroke("gray")
                .moveTo(0,0)
                .lineTo(0,holeVertShadowLineHeight)
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

            holeVertShadowLine.cache(-4,0,8,holeVertShadowLineHeight);

            this.updater.container.addChild(holeVertShadowLine);



            var bottomShadowLine = new Shape();
            bottomShadowLine.x = this.x;
            bottomShadowLine.y = this.y2;
            var bottomShadowLineWidth = this.width;
            bottomShadowLine.graphics
                .beginStroke("gray")
                .moveTo(0,0)
                .lineTo(bottomShadowLineWidth,0)
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

            bottomShadowLine.cache(0,-4,bottomShadowLineWidth,8);

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

            this.shape.cache(-4,-4,this.width+shadowOffset+8,this.height+shadowOffset+8);

            this.activePen.x = this.x;
            this.activePen.y = this.y;
            this.activePen.graphics
                .beginStroke(activeColour)
                .drawRoundRect(0,0,this.width,this.height,this.updater.roundedCnrRadius)
                .endStroke()
            ;

            this.activePen.cache(-4,-4,this.width+8,this.height+8);

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
            
            this.activeBG.cache(-4,-4,this.width+8,this.height+8);

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

            this.shape.cache(-4,-4,this.width+8,this.height+8);


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

            guideLines.cache(-4,-4,topGuideLineWidth+8,Math.max(this.height,this.updater.updateSquareWidth)+8);

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

    /*
       Visual representation of one of the conditions under which central 
       cell in the 3x3 square will contain an atom in the next moment.
     */
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

            // this.updateSquare.container.cache(-4,-4,this.updateSquare.width+8,this.updateSquare.height+8);
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
            this.shape.shadow =
                new Shadow(
                    "black",
                    shadowOffset,
                    shadowOffset,
                    shadowBlur
                )
            ;

            this.shape.cache(-4,-4,this.width+8+shadowOffset,this.height+8+shadowOffset);


            this.activePen.x = this.x;
            this.activePen.y = this.y;
            // ^ note that with the shape this is done by the AnimPath!

            this.activePen.graphics
                .beginStroke(activeColour)
                .drawRoundRect(0,0,this.width,this.height,this.updater.roundedCnrRadius)
                .endStroke()
            ;

            this.activePen.cache(-4,-4,this.width+8,this.height+8);

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
            this.currThreeSquareRow.draw(); // draws guidelines on matchComponent shape, so have 2do it b4 caching

            this.shape.cache(-4,-4,this.width+8,this.height+8);

            this.activeBG.graphics
                .beginFill(activeBGColour)
                .rect(1,1,this.width-2,this.height-2)
                .endFill()
            ;

            this.activeBG.cache(-3,-3,this.width+6,this.height+6);


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
            x2: point2.x,
            width: null
        }
        this.crossBar.width = this.crossBar.x2 - this.crossBar.x;

        this.sink = {
            x: this.crossBar.x + (this.crossBar.x2 - this.crossBar.x)/2,
            y: this.crossBar.y,
            y2: updater.addAtomPen.y,
            height: null
        }
        this.sink.height = this.sink.y2 - this.sink.y;


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

            this.shape.cache(this.crossBar.x-4,this.crossBar.y-4,this.crossBar.width+8,this.sink.height+8);

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
            ;

            this.shape.cache(-4-this.endPointRadius/2,-4,8+this.endPointRadius,this.height+8+this.endPointRadius);
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

            this.activeBG.cache(-3,-3,this.width+6,this.height+6);

            this.guideLines.graphics
                .beginStroke(guideLinesColour)
                .moveTo(0,0)
                .lineTo(this.guideLinesDims.width,0)
                .moveTo(0,this.guideLinesDims.height)
                .lineTo(this.guideLinesDims.width,this.guideLinesDims.height)
                .endStroke()
            ;

            this.guideLines.cache(-4,-4,this.guideLinesDims.width+8,this.guideLinesDims.height+8);


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

            this.shape.cache(-4,-4,this.width+8+shadowOffset,this.height+8+shadowOffset);

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

            this.shape.cache(-4,-4,this.radius*2+8,this.radius*2+8);

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
        var gridWidth = gridCols*largeGridCellSize;
        var gridHeight = gridRows*largeGridCellSize;

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


            // the following does not work!  it causes text labels not to be visible and the shadow to be 
            // visible over the top of the timedisp shape!  text labels are drawn before this is called
            // and i can't think of anything that could legitimately cause shadow to be above the thing it is
            // a shadow of!
            // i suspect this is an EaselJS bug.
            // this.container.cache(-4,-4,this.width+8+outerShadowOffset,this.height+8+outerShadowOffset);
            
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

            // like with trying to cache the TimeDisp container, this doesn't work
            // makes it all completely disappear
            // this.container.cache(-4,-4,this.width+8,this.height+8);

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


            this.shape.cache(
                this.topArm.x-4,
                this.updaterBody.y,
                this.topArm.width+this.updaterBody.width+8+outerShadowOffset,
                this.updaterBody.height+8+outerShadowOffset
            );

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

        this.shape.cache(-4,-4,this.radius*2+8,this.radius*2+8);

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



