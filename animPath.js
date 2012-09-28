

    /*
       @pathSpec - an array of coordinates, where each coordinate is a struct 
                   of the form {x:int,y:int}
       Dependent upon Sequencer instance called sequencer
    */
    function AnimPath( dispObj, pathSpec ) {
        this.dispObj = dispObj;
        this.pathSpec = pathSpec.slice(0);
        this.idx = 0;
        this.dispObj.x = this.pathSpec[0].x;
        this.dispObj.y = this.pathSpec[0].y;
        this.dispObj.visible = false;

        // Next tween on the path.
        // Loops, so after it has gone to the last position it'll start all over again.
        // Note that it *won't* animate from the last position back to the first position.
        this.nextTween = function(duration,dispObj) {
            if (dispObj == null) { dispObj = this.dispObj; }
            var tween = sequencer.getPausedTween(dispObj);
            if (this.idx == 0) { tween.set({visible:true}); }
            this.idx++;

            var prev,curr;
            if (this.idx == this.pathSpec.length) { 
                this.idx = 0;
                prev = this.pathSpec.length-1;
            } else {
                prev = this.idx - 1;
            }
            curr = this.idx;

            var path = this.pathSpec;
            tween
                .to({x:path[prev].x, y:path[prev].y})
                .to({x:path[curr].x, y:path[curr].y},duration)
            ;
            return tween;
        }

        this.getTween = function(fromPathPos,toPathPos,duration,dispObj) {
            if (dispObj == null) { dispObj = this.dispObj; }
            var tween = sequencer.getPausedTween(dispObj);
            tween
                .to({x:this.pathSpec[fromPathPos].x, y:this.pathSpec[fromPathPos].y})
                .to({x:this.pathSpec[toPathPos].x, y:this.pathSpec[toPathPos].y},duration)
            ;
            return tween;
        }

    }



