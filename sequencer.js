

    /* 
       Requires the array flattening func
            flatten(array)
    */
    function Sequencer() {

        this._lastTween = null;
        this._firstTweens = null;  // could be one or more

        this.getPausedTween = function(dispObj) {
            var tween;
            tween = Tween.get(dispObj);
            tween.setPaused(true);
            return tween;
        }

        this.register = function(tween) {
            if (this._firstTweens == null) {
                this._firstTweens = [ tween ];
            } else {
                this._lastTween.play(tween);
            }
            this._lastTween = tween;
        }

        // @tweens - an array of tweens.  can contain nested arrays - will be flattened.
        // ** NOTE: a limitation of this is that it will play the next registered
        //          tween after the last of these tweens has played.... whereas perhaps it
        //          should only do so after all of these have finished!  that is, after the 
        //          longest of these has finished@
        this.registerConcurrent = function(tweens) {
            var flattenedTweensArray = flatten(tweens);
            if (this._firstTweens == null) {
                this._firstTweens = flattenedTweensArray;
            } else {
                for (var i = 0; i < flattenedTweensArray.length; i++) {
                    this._lastTween.play(flattenedTweensArray[i]);
                }
            }
            var longestDuration = 0;
            var longestDurationTween = null;
            for (var i = 0; i < flattenedTweensArray.length; i++) {
                if (flattenedTweensArray[i].duration >= longestDuration) {
                    longestDuration = flattenedTweensArray[i].duration;
                    longestDurationTween = flattenedTweensArray[i];
                }
            }
            //this._lastTween = flattenedTweensArray[flattenedTweensArray.length - 1];
            this._lastTween = longestDurationTween;
        }


        /* should only be called after at least one set of tween(s) have been registered 
           (register/registerConcurrent) with this sequencer. */
        this.start = function() {
            for (var i = 0; i < this._firstTweens.length; i++) {
                Tween.get().play(this._firstTweens[i]);
            }
        }

    }



