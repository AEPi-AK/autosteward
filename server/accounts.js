ServiceConfiguration.configurations.upsert(
  { service: "google" },
  {
    $set: {
      clientId: "963066814234-45h684so8c720mimkmlaf57isutqpl2p.apps.googleusercontent.com",
      loginStyle: "popup",
      secret: "6jxJaywxWqnA7sxyiSpETqOC"
    }
  }
);

ADMIN_EMAILS = [
  'aromanof@andrew.cmu.edu',
  'afrieder@andrew.cmu.edu'
];

Accounts.validateNewUser(function (user) {
  console.log(user);
  if (ADMIN_EMAILS.indexOf(user.services.google.email) !== -1) {
    return true;
  }
  throw new Meteor.Error("invalid-email", "Email account not on whitelist.");
});
