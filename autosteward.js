Duties = new Mongo.Collection("duties", {
  transform: function(duty) {
    var waiters = [];
    duty.waiters.forEach(function(brother_id) {
      waiters.push(Brothers.findOne(brother_id));
    });
    duty.waiters = waiters;
    return duty;
  }
});

Brothers = new Mongo.Collection("brothers");
Shifts = new Mongo.Collection("shifts", {
  transform: function(shift) {
    return shift;
  }
});

if (Meteor.isClient) {

  Template.body.helpers({

    brothers: function() {
      return Brothers.find({}, {sort: {last_name: 1}});
    },

    week: function() {
      return moment().startOf('isoweek');
    },

    daysOfCurrentWeek: function() {
      var days = [];
      var monday = moment().startOf('isoweek');
      for (var i = 1; i < 8; i++) {
        days.push(monday.clone().isoWeekday(i).toDate());
      }
      return days;
    },

  });

  Template.dayRow.helpers({
    brothersOnDutyForDay: function() {
      var day = this;
      return Duties.findOne({date: day}, {sort: {name: 1}});
    }
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
      }, {sort: {day: 1, waiter_number: 1}});
    },

    dutiesForCurrentBrother: function() {
      var currentBrother = this;
      return Duties.find({
        brother: currentBrother._id
      });
    },

  });
}

if (Meteor.isServer) {
  Meteor.startup(function () {

    function addFixtures(collection, fixtures) {
      if (collection.find().count() > 0) return;
      console.log("No", collection._name, "in database; adding some!");
      fixtures.forEach(function(doc) {
        collection.insert(doc);
      });
    }

    addFixtures(Brothers, [
      {
        first_name: "Sam",
        last_name: "Zbarsky",
        phone_number: null,
      },
      {
        first_name: "Avi",
        last_name: "Romanoff",
        phone_number: "+1-484-431-6296",
      },
      {
        first_name: "Michael",
        last_name: "Solomon",
        phone_number: null,
      }
    ]);

    var shifts = [];
    var days = "monday,tuesday,wednesday,thursday,friday,saturday,sunday".split(",");

    days.forEach(function(day) {
      var is_weekend = _.contains(["saturday", "sunday"], day);
      var num_waiters = is_weekend ? 1 : 3;
      while (num_waiters > 0) {
        shifts.push({
          day: day,
          semester: "2014-spring",
          waiter_number: num_waiters,
          available_brothers: []
        });
        num_waiters -= 1;
      }
    });
    
    addFixtures(Shifts, shifts);

  });
}
