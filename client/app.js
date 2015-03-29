Meteor.subscribe("brothers");
Meteor.subscribe("duties");
Meteor.subscribe("shifts");

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
    if (_.isNull(first_name) || first_name == "") {
      return;
    }
    var last_name = prompt("Last Name:");
    if (_.isNull(last_name) || last_name == "") {
      return;
    }

    Meteor.call("addBrother", {
      first_name: first_name,
      last_name: last_name,
      phone_number: null,
      duty_count: 0
    });
  },

  "click #reset-duties": function() {
    if (!confirm("Are you sure?")) return;
    Meteor.call("resetDuties");
  },

  "click a.delete-brother": function() {
    if (!confirm("Are you sure?")) return;
    Meteor.call("removeBrother", this._id);
  },

  "click span.phone-number": function(event, template) {
    var entered = prompt("Number:", Boolean(this.phone_number) ? this.phone_number : "");
    if (_.isNull(entered)) {
      return;
    }
    else if (entered === "") {
      Meteor.call("removeBrotherPhoneNumber", this._id);
    }
    else {
      Meteor.call("setBrotherPhoneNumber", this._id, entered);
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

    Meteor.call("createDutyForBrother", shift._id, current_brother._id, ctx.date);
  },

  "click a.unassign-waiter": function() {
    var ctx = Template.currentData();
    var shift = Shifts.findOne({
      semester: "2014-spring",
      day_number: moment(ctx.date).isoWeekday(),
      waiter_number: ctx.waiter_number
    });
    Meteor.call("removeDutyForBrother", shift._id, ctx.date);
  }

});

Template.brotherName.helpers({

  recentlyServedDuty: function() {
    var current_brother = this;
    return Duties.find({
      brother: this._id,
      date: {$gte: moment().subtract(7, "days").toDate()}
    }).count() > 0;
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
    Meteor.call("assignBrotherToShift", this._id, this.current_brother_id);
  },

  "click button.remove": function() {
    Meteor.call("removeBrotherFromShift", this._id, this.current_brother_id);
  }

});
