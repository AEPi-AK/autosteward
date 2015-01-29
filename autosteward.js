var DAYS_OF_WEEK = "monday,tuesday,wednesday,thursday,friday,saturday,sunday".split(",");

Brothers = new Mongo.Collection("brothers");
Duties = new Mongo.Collection("duties");
Shifts = new Mongo.Collection("shifts", {
  transform: function(shift) {
    shift.day_name = DAYS_OF_WEEK[shift.day_number - 1];
    shift.day_name_short = shift.day_name.slice(0, 3);    
    return shift;
  }
});

if (Meteor.isClient) {

  Template.registerHelper("formatDate", function(date, format_string) {
    return moment(date).format(format_string);
  });

  Template.body.helpers({

    brothers: function() {
      return Brothers.find({}, {sort: {duty_count: 1, last_name: 1}});
    },

    week: function() {
      return moment().startOf('isoweek').toDate();
    },

    datesOfCurrentWeek: function() {
      var monday = moment().startOf('isoweek');
      return _.range(1, 8).map(function(i) {
        return monday.clone().isoWeekday(i).toDate();
      });
    },

  });

  Template.body.events({

    "click #log-in": function() {
      Meteor.loginWithGoogle(function callback(err) {
        if (err) {
          alert(err);
        }
      });
    },

    "click #log-out": function() {
      Meteor.logout(function callback(err) {
        if (err) {
          alert(err);
        }
      });
    },

    "click #add-brother": function() {
      var first_name = prompt("First Name:");
      if (_.isNull(first_name)) {
        return;
      }
      var last_name = prompt("Last Name:");
      if (_.isNull(last_name)) {
        return;
      }
      Brothers.insert({
        first_name: first_name,
        last_name: last_name,
        phone_number: null,
        duty_count: 0
      });
    },

    "click span.phone-number": function(event, template) {
      var entered = prompt("Number:", Boolean(this.phone_number) ? this.phone_number : "");
      if (_.isNull(entered)) {
        return;
      }
      else if (entered.match(/^\d{3}-\d{3}-\d{4}$/)) {
        Brothers.update(this._id, {
          $set: {phone_number: entered}
        });
      }
      else if (entered === "") {
        Brothers.update(this._id, {
          $unset: {phone_number: entered}
        });
      }
    },

  });

  ReadOnlyCellHelpers = {

    shift: function(date, waiter_number) {
      return Shifts.findOne({
        semester: "2014-spring",
        day_number: moment(date).isoWeekday(),
        waiter_number: waiter_number
      });
    },

    waiter: function() {
      var shift = this;
      var ctx = Template.parentData();
      var duty = Duties.findOne({shift: shift._id, date: ctx.date});
      if (!duty) return;
      return Brothers.findOne(duty.brother);
    }

  };

  EditableCellHelpers = {

    availableWaiters: function() {
      var shift = this;
      return Brothers.find({
        _id: {$in: shift.available_brothers} 
      }, {
        sort: {duty_count: 1}
      });
    },

    anyAvailableWaiters: function() {
      var shift = this;
      return Brothers.find({
        _id: {$in: shift.available_brothers} 
      }).count() > 0;
    },

    brotherIsWaiter: function(brother) {
      var shift = Template.parentData();
      var ctx = Template.parentData(2);
      var duty = Duties.findOne({shift: shift._id, date: ctx.date});
      if (!duty) return;
      return duty.brother === brother._id;
    }

  };

  Template.editableCell.helpers(_.extend(ReadOnlyCellHelpers, EditableCellHelpers));
  Template.readonlyCell.helpers(ReadOnlyCellHelpers);

  Template.editableCell.events({

    "click a.assign-waiter": function() {
      var current_brother = this;
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
      if (duty) {
        Duties.remove(duty._id);
        Brothers.update(duty.brother, {$inc: {duty_count: -1}});
      }
      Duties.insert({
        shift: shift._id,
        brother: current_brother._id,
        date: ctx.date
      });
      Brothers.update(current_brother._id, {$inc: {duty_count: +1}});
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
      Duties.remove(duty._id);
      Brothers.update(duty.brother, {$inc: {duty_count: -1}});
    }

  });

  Template.phone.events({

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

    ServiceConfiguration.configurations.upsert(
      { service: "google" },
      {
        $set: {
          clientId: "963066814234-45h684so8c720mimkmlaf57isutqpl2p.apps.googleusercontent.com",
          loginStyle: "popup",
          secret: process.env.GOOGLE_OAUTH_SECRET
        }
      }
    );

  ADMIN_EMAILS = [
    'aromanof@andrew.cmu.edu',
    'afrieder@andrew.cmu.edu'
  ];

  Accounts.validateNewUser(function (user) {
    console.log(user);
    if (ADMIN_EMAILS.indexOf(user.services.google.email) !== -1) {
      return true;
    }
    throw new Meteor.Error(403, "Email account not on whitelist.");
  });


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
