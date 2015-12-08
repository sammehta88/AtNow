var express = require("express");
var router = express.Router();
// var Vote = mongoose.model('Vote');
// var User = mongoose.model('User');
var Preference = require("../models/preference");
var Vote = require("../models/vote");
var User = require("../models/user");
var Location = require("../models/location");
// var VoteCount = require("../models/voteCount");

router.get("/", function(req, res){
  Vote.find({}).populate("user").then(function(votes){
    res.json(votes);
  });
});

//TODO: modularize
//TODO: fix downvote - can downvote multiple times
router.post("/", function(req, res){
  var voteInfo = {
    location_id: req.body.location_id,
    vote: req.body.vote === 'true' ? true : false //converts string to boolean
  };
  console.log('body', req.body);
  console.log('body vote',req.body.vote);
  console.log('voteInfo', voteInfo);
  var match, prevVote;
  // var currentUser = global.currentUser;
  User.findOne({"local.email": "sammehta88@gmail.com"}, function(err, currentUser){
    var votesArray = currentUser.votes;
    console.log(votesArray);

    //TODO: change so if vote matches do nothing, if opposite, update and subtract
    function findMatch() {
      for (var i = 0; i < votesArray.length; i++) {
        if (votesArray[i].location_id === voteInfo.location_id){
          match = i;
          prevVote = votesArray[i].vote;
          return;
          // return match;
        }
      }
    }
    findMatch();
    console.log('match', match);
    console.log('prevvote', prevVote);

    if (!match) {
      console.log('no match');
      currentUser.votes.push(new Vote(voteInfo));
      currentUser.save().then(function(){
        //TODO: refactor, separate out code into different function
        Location.findOne({"location_id": voteInfo.location_id}, function(err, loc){
          if (loc){
            loc.count = voteInfo.vote ? loc.count + 1 : loc.count - 1;
          } else {
            loc = new Location({
              "location_id": voteInfo.location_id,
              "count": voteInfo.vote ? 1 : 0  //TODO: -1 or 0? can they have negative votes?
            });
          }
          loc.save();
          res.json(loc);
        });
      });
    } else if (voteInfo.vote === prevVote){
      console.log('match - same');
      res.json(currentUser.votes.length);
    } else {
      console.log(voteInfo.vote === votesArray[match].vote);
      console.log(votesArray[match].vote);
      console.log('match - different');
      currentUser.votes.vote = voteInfo.vote;
      currentUser.save().then(function(){ //or !currentUser.votes.vote?
        Location.findOne({"location_id": voteInfo.location_id}, function(err, loc){
          loc.count = prevVote ? loc.count - 2 : loc.count + 2;
          loc.save();
          res.json(loc);
        }); //do i need these in promises??
      });
    }
  });
});

// module.exports = (function() {
// 	return {
//           update: function(req, res){
//           			User.findOne({id: req.body.user})
//           				.populate('votes')
//           				.exec(function(err, post){
//           				if(err){
//           					console.log(err);
//           				} else {
//           					if(req.vote > 0){
//           						post.upvotes += 1;
//           					} else {
//           						post.downvotes += 1;
//           					}
//           					post.save(function(err){
//           						if(err){
//           							console.log(err);
//           						} else {
//           							res.json({message: 'Vote updated'});
//           						}
//           					});
//           				}
//           			});
//           		}
//             }
module.exports = router;
