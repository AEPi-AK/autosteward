
Shift = {

  semester: String, // e.g. "2014-spring"

  day_number: Number, // {1,2,3,4,5,6,7} (ISO weekday)

  waiter_number: Number, // {1,2,3}

  available_brothers: [Brother._id]

};

Duty = {

  shift: Shift._id,

  brother: Brother._id,

  date: Date, // must be UTC and set to 12:00 a.m.

};

Brother = {

  first_name: String, // e.g. "Avi"

  last_name: String, // e.g. "Romanoff"

  phone_number: String, // e.g. "+1 484 000 1234" (E.164 format)

  duty_count: Number, // read-only denormalization, never set directly

};

