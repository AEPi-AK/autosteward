Meteor.methods({

  addBrother: function (brother) {
    var brotherWithIdenticalName = Brothers.findOne({
      first_name: brother.first_name,
      last_name: brother.last_name
    });
    if (brotherWithIdenticalName) return;
    Brothers.insert({
      first_name: brother.first_name,
      last_name: brother.last_name,
      phone_number: brother.phone_number,
      duty_count: brother.duty_count
    });
  },

  removeBrother: function (brother) {
    Brothers.remove(brother);
  },

  setBrotherPhoneNumber: function (brotherId, phoneNumber) {
    if (!phoneNumber.match(/^\d{3}-\d{3}-\d{4}$/)) {
      throw new Meteor.Error("invalid-phone-format", "Phone number was invalid.");
    }
    Brothers.update(brotherId, {
      $set: {phone_number: phoneNumber}
    });
  },

  removeBrotherPhoneNumber: function (brotherId, phoneNumber) {
    Brothers.update(brotherId, {
      $unset: {phone_number: 1}
    });
  },

  assignBrotherToShift: function (shiftId, brotherId) {
    Shifts.update(shiftId, {
      $addToSet: {available_brothers: brotherId}
    });
  },

  removeBrotherFromShift: function (shiftId, brotherId) {
    Shifts.update(shiftId, {
      $pull: {available_brothers: brotherId}
    });
  },

  createDutyForBrother: function (shiftId, brotherId, date) {
    var duty = Duties.findOne({
      shift: shiftId,
      date: date
    });
    if (duty) {
      Duties.remove(duty._id);
      Brothers.update(duty.brother, {$inc: {duty_count: -1}});
    }
    Duties.insert({
      shift: shiftId,
      brother: brotherId,
      date: date,
      reminders_sent: 0
    });
    Brothers.update(brotherId, {$inc: {duty_count: +1}});
  },

  removeDutyForBrother: function (shiftId, date) {
    var duty = Duties.findOne({
      shift: shiftId,
      date: date
    });
    Duties.remove(duty._id);
    Brothers.update(duty.brother, {$inc: {duty_count: -1}});
  },

  resetDuties: function () {
    Duties.remove({});
    // Update the denormalization
    Brothers.update({}, {$set: {duty_count: 0}}, {multi: true});
  }

});
