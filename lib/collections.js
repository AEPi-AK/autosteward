Brothers = new Mongo.Collection("brothers");
Duties = new Mongo.Collection("duties");
Shifts = new Mongo.Collection("shifts", {
  transform: function(shift) {
    shift.day_name = DAYS_OF_WEEK[shift.day_number - 1];
    shift.day_name_short = shift.day_name.slice(0, 3);
    return shift;
  }
});
