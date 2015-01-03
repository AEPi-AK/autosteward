Shifts = new Mongo.Collection("shifts");
Duties = new Mongo.Collection("duties");
Brothers = new Mongo.Collection("brothers");


if (Meteor.isClient) {

  Template.body.helpers({

    brothers: function() {
      return Brothers.find({}, {sort: {last_name: 1}});
    }

  });

  Template.phone.rendered = function() {
    // initialize tooltips
    this.$('[data-toggle="tooltip"]').tooltip();
  }

  Template.schedule.helpers({

    shifts: function() {
      return Shifts.find({
        semester: "2014-spring"
      }, {sort: {day: 1, name: 1}});
    }

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
