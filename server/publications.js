Meteor.publish("brothers", function () {
  return Brothers.find();
});

Meteor.publish("duties", function () {
  return Duties.find();
});

Meteor.publish("shifts", function () {
  return Shifts.find();
});
