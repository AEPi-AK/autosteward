var DAYS_OF_WEEK = "monday,tuesday,wednesday,thursday,friday,saturday,sunday".split(",");

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
    shift.day_name = DAYS_OF_WEEK[shift.day_number - 1];
    return shift;
  }
});

if (Meteor.isClient) {

  Template.registerHelper("formatDate", function(date, format_string) {
    return moment(date).format(format_string);
  });

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
    console.log("phone rendered!");
    this.$('[data-toggle="tooltip"]').tooltip();
  }

  Template.phone.events({

    "click .phone-cell-problem > a": function(event, template) {
      console.log(template);
      var number = prompt("Number:");
      if (number !== null) {
        Brothers.update(this._id, {$set: {phone_number: number}});
      }
      // XXX: we need to trigger re-render to update tooltip
      // template.view._render();
    }

  });

  Template.slab.helpers({

    currentBrotherHasShift: function() {
      return _.contains(this.available_brothers, this.current_brother_id);
    },

    shifts: function() {
      if (!_.has(this, "first_name")) {
        alert("Now ya fucked up!");
        console.log(this);
      }

      var current_brother = this;

      return Shifts.find({
        semester: "2014-spring"
      }, {sort: {day_number: 1, waiter_number: 1}}
      ).map(function(shift) {
        shift.current_brother_id = current_brother._id;
        return shift;
      });
    },

    dutiesForCurrentBrother: function() {
      var current_brother = this;
      return Duties.find({
        brother: current_brother._id
      });
    },

  });

  Template.slab.events({

    "click button.add": function() {
      Shifts.update(this._id, {
        $addToSet: {available_brothers: this.current_brother_id}
      });
    },

    "click button.remove": function() {
      Shifts.update(this._id, {
        $pull: {available_brothers: this.current_brother_id}
      });
    }

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

    DAYS_OF_WEEK.forEach(function(day) {
      var is_weekend = _.contains(["saturday", "sunday"], day);
      var num_waiters = is_weekend ? 1 : 3;
      while (num_waiters > 0) {
        shifts.push({
          semester: "2014-spring",
          day_number: DAYS_OF_WEEK.indexOf(day) + 1,
          waiter_number: num_waiters,
          available_brothers: []
        });
        num_waiters -= 1;
      }
    });

    addFixtures(Shifts, shifts);

  });
}
