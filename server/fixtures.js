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
      semester: CURRENT_SEMESTER,
      day_number: DAYS_OF_WEEK.indexOf(day) + 1,
      waiter_number: num_waiters,
      available_brothers: []
    });
    num_waiters -= 1;
  }
});

addFixtures(Shifts, shifts);
