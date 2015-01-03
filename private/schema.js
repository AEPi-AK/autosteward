
Shift = {

  day: String, // "monday"

  semester: String, // "2014-spring"

  time: String, // "3pm"

  waiter_number: Number, // "waiter1",

  available_brothers: [Brother]

};

Duty = {

  shift: Shift,

  brother: Brother?,

  date: Date, // "Monday, January 4, 2015"

};

Brother = {

  first_name: String, // "Avi"

  last_name: String, // "Romanoff"

  // synthesized
  full_name: String, // "Avi Romanoff"

  phone_number: String, // "+1 484 000 1234" (E.164 format)

  // synthesized
  performed_duties: [Duty] // where Duty.brother == self

};

