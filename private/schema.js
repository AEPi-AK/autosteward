
Shift = {

  day: String, // "Monday"

  name: String, // "Waiter 1"

  semester: String, // "2014-spring"

  time: String, // "3pm"

  available_brothers: [Brother],

};

Duty = {

  brother: Brother,
  
  shift: Shift,

  date: Date, // "Monday, January 4, 2015"

};

Brother = {

  first_name: String, // "Avi"

  last_name: String, // "Romanoff"

  // synthesized
  full_name: String, // "Avi Romanoff"

  phone_number: String, // "+1 484 000 1234" (E.164 format)

  available_shifts: [Shift],

  // synthesized
  performed_duties: [Duty] // where Duty.brother == self

};

