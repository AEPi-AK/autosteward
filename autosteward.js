var DAYS_OF_WEEK = "monday,tuesday,wednesday,thursday,friday,saturday,sunday".split(",");

Brothers = new Mongo.Collection("brothers");

Duties = new Mongo.Collection("duties", {
  transform: function(duty) {
    duty.brother = Brothers.findOne(duty.brother);
    duty.shift = Shifts.findOne(duty.shift);
    return duty;
  }
});

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
      return Brothers.find({}, {sort: {duty_count: 1}});
    },

    week: function() {
      return moment().startOf('isoweek').toDate();
    },

    datesOfCurrentWeek: function() {
      var dates = [];
      var monday = moment().startOf('isoweek');
      for (var i = 1; i < 8; i++) {
        dates.push(monday.clone().isoWeekday(i).toDate());
      }
      return dates;
    },

  });

  Template.cell.helpers({

    waiter: function(date, waiter_number) {
      var shift = Shifts.findOne({
        semester: "2014-spring",
        day_number: moment(date).isoWeekday(),
        waiter_number: waiter_number
      });
      if (!shift) return;
      var duty = Duties.findOne({shift: shift._id, date: date});
      if (!duty) return;
      return Brothers.findOne(duty.brother);
    },

    availableWaiters: function(date, waiter_number) {
      var shift = Shifts.findOne({
        semester: "2014-spring",
        day_number: moment(date).isoWeekday(),
        waiter_number: waiter_number
      });
      if (!shift) return;
      return Brothers.find({
        _id: {$in: shift.available_brothers} 
      }, {
        sort: {duty_count: 1}
      });
    },

    anyAvailableWaiters: function(date, waiter_number) {
      var shift = Shifts.findOne({
        semester: "2014-spring",
        day_number: moment(date).isoWeekday(),
        waiter_number: waiter_number
      });
      if (!shift) return;
      return Brothers.find({
        _id: {$in: shift.available_brothers} 
      }, {
        sort: {duty_count: 1}
      }).count() > 0;
    },


    currentBrotherIsWaiter: function() {
      var ctx = Template.parentData();
      var current_brother = this;
      var shift = Shifts.findOne({
        semester: "2014-spring",
        day_number: moment(ctx.date).isoWeekday(),
        waiter_number: ctx.waiter_number
      });
      var duty = Duties.findOne({shift: shift._id, date: ctx.date});
      if (!duty) return;
      return duty.brother._id === current_brother._id;
    }

  });

  Template.cell.events({

    "click a.assign-waiter": function() {
      var current_brother = this;
      var ctx = Template.currentData();
      var shift = Shifts.findOne({
        semester: "2014-spring",
        day_number: moment(ctx.date).isoWeekday(),
        waiter_number: ctx.waiter_number
      });
      if (!shift) {
        return alert("shift not found, how is that possible?");
      }
      var duty = Duties.findOne({
        shift: shift._id,
        date: ctx.date
      });
      if (duty) {
        Duties.remove(duty._id);
        Brothers.update(duty.brother._id, {$inc: {duty_count: -1}});
      }
      Duties.insert({
        shift: shift._id,
        brother: current_brother._id,
        date: ctx.date
      });
      Brothers.update(current_brother._id, {$inc: {duty_count: 1}});
    },

    "click a.unassign-waiter": function() {
      var ctx = Template.currentData();
      var shift = Shifts.findOne({
        semester: "2014-spring",
        day_number: moment(ctx.date).isoWeekday(),
        waiter_number: ctx.waiter_number
      });
      var duty = Duties.findOne({
        shift: shift._id,
        date: ctx.date
      });
      Brothers.update(duty.brother._id, {$inc: {duty_count: -1}});
      Duties.remove(duty._id);
    }

  });

  Template.phone.rendered = function() {
    // initialize tooltips
    this.$('[data-toggle="tooltip"]').tooltip();
  }

  Template.phone.events({

    "click .phone-cell-problem > a": function(event, template) {
      var number = prompt("Number:");
      if (number !== null) {
        Brothers.update(this._id, {$set: {phone_number: number}});
      }
      // FIXME: we need to trigger re-render to update tooltip
      // template.view._render();
    }

  });

  Template.slab.helpers({

    currentBrotherHasShift: function() {
      return _.contains(this.available_brothers, this.current_brother_id);
    },

    shifts: function() {
      var current_brother = this;

      return Shifts.find({
        semester: "2014-spring"
      }, {sort: {day_number: 1, waiter_number: 1}}
      ).map(function(shift) {
        shift.current_brother_id = current_brother._id;
        return shift;
      });
    }

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
        duty_count: 0
      },
      {
        first_name: "Avi",
        last_name: "Romanoff",
        phone_number: "+1-484-431-6296",
        duty_count: 0
      },
      {
        first_name: "Michael",
        last_name: "Solomon",
        phone_number: null,
        duty_count: 0
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
