Duties = new Mongo.Collection("duties");
Brothers = new Mongo.Collection("brothers");
Shifts = new Mongo.Collection("shifts", {
  transform: function(shift) {
    // var available_brothers = [];
    // _.pluck(shift, "available_brothers").forEach(function(brother_id) {
    //   available_brothers.push(Brothers.findOne(brother_id));
    // });
    // shift.available_brothers = available_brothers;
    return shift;
  }
});


if (Meteor.isClient) {

  Template.body.helpers({

    brothers: function() {
      return Brothers.find({}, {sort: {last_name: 1}});
    },

  });

  Template.phone.rendered = function() {
    // initialize tooltips
    this.$('[data-toggle="tooltip"]').tooltip();
  }

  Template.slab.helpers({

    shiftsForCurrentBrother: function() {
      var currentBrother = this;
      return Shifts.find({
        semester: "2014-spring",
        available_brothers: currentBrother._id
      }, {sort: {day: 1, name: 1}});
    },

    dutiesForCurrentBrother: function() {
      var currentBrother = this;
      return Duties.find({
        brother: currentBrother._id
      });
    },

  });

  // // counter starts at 0
  // Session.setDefault("counter", 0);

  // Template.hello.helpers({
  //   counter: function () {
  //     return Session.get("counter");
  //   }
  // });

  // Template.hello.events({
  //   'click button': function () {
  //     // increment the counter when button is clicked
  //     Session.set("counter", Session.get("counter") + 1);
  //   }
  // });
}

if (Meteor.isServer) {
  Meteor.startup(function () {
    // code to run on server at startup
  });
}
