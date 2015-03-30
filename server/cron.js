twilio = Twilio(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);

FROM_NUMBER = "484-309-4990";
BODY = "Don't forget to do waiter 1 today by 6:30 p.m. — AutoSteward";

function sendReminderText(to, callback) {
  twilio.sendSms({
    to: to,
    from: FROM_NUMBER,
    body: BODY
  }, Meteor.bindEnvironment(callback));
}

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
    if (moment().isBefore(moment(reminder_time))) return;
    console.log("sending reminder text to", brother.phone_number);
    sendReminderText(brother.phone_number, function(err, res) {
      if (err) {
        console.log(arguments);
        console.log("Oh noes!");
        return;
      }
      Duties.update(duty._id, {$inc: {reminders_sent: +1}});
    });
  });
}

var everyMinute = new Cron(sendRemindersIfNeeded, {});
