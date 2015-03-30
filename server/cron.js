twilio = Twilio(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);

var FROM_NUMBER = "484-309-4990";
var templates = [
  _.template( // Reminder #1
    "Yo <%= first_name %>, don't forget to do waiter " +
    "<%= waiter_number %> by <%= deadline %> today!"
  ),
  _.template( // Reminder #2
    "If you haven't done waiter <%= waiter_number %> yet, " +
    "do it now. Thanks Brother <%= last_name %> :)"
  ),
];

var sendSMSToBrother = Meteor.wrapAsync(
  function (brother, reminder_number, reminder_time, waiter_number, callback) {
    console.log("Sending reminder SMS to",
      brother.first_name, brother.last_name, "@", brother.phone_number);
    twilio.sendSms({
      to: brother.phone_number,
      from: FROM_NUMBER,
      body: templates[reminder_number]({
        first_name: brother.first_name,
        last_name: brother.last_name,
        waiter_number: waiter_number,
        deadline: moment(reminder_time).format('h:mm a')
      })
    }, function sendSmsCallback(err, res) {
      if (err) throw new Meteor.Error("twilio-" + err.code, err.message);
      else callback(null, res);
    });
});

function sendRemindersIfNeeded() {
  var today = moment().startOf('day').toDate();
  Duties.find({
    date: today,
    reminders_sent: {$lt: 2}
  }).forEach(function(duty) {
    var brother = Brothers.findOne(duty.brother);
    var waiter_number = Shifts.findOne(duty.shift).waiter_number;
    var reminder_time = REMINDER_TIMES[waiter_number - 1][duty.reminders_sent];
    // time right now < scheduled reminder time
    if (moment().isAfter(moment(reminder_time))) {
      sendSMSToBrother(brother, duty.reminders_sent, reminder_time, waiter_number);
      Duties.update(duty._id, {$inc: {reminders_sent: +1}});
    };
  });
}

var everyMinute = new Cron(sendRemindersIfNeeded, {});
