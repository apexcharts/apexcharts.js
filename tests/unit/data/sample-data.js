module.exports = {
  range: {
    years: [
      new Date('01/01/2010 UTC').getTime(),
      new Date('01/02/2013 UTC').getTime(),
    ],
    months: [
      new Date('02/02/2017 UTC').getTime(),
      new Date('10/02/2017 UTC').getTime(),
    ],
    days: [
      new Date('02/02/2017 UTC').getTime(),
      new Date('02/28/2017 UTC').getTime(),
    ],
    hours: [
      new Date('02/02/2017 01:20 UTC').getTime(),
      new Date('02/02/2017 21:20 UTC').getTime(),
    ],
    minutes_fives: [
      new Date('02/02/2017 01:39 UTC').getTime(),
      new Date('02/02/2017 02:09 UTC').getTime(),
    ],
    minutes: [
      new Date('02/02/2017 01:59 UTC').getTime(),
      new Date('02/02/2017 02:05 UTC').getTime(),
    ],
    seconds_tens: [
      new Date('02/02/2017 01:59:00 UTC').getTime(),
      new Date('02/02/2017 02:00:25 UTC').getTime(),
    ],
    seconds_fives: [
      new Date('02/02/2017 01:59:43 UTC').getTime(),
      new Date('02/02/2017 02:00:17 UTC').getTime(),
    ],
    seconds: [
      new Date('02/02/2017 01:59:58 UTC').getTime(),
      new Date('02/02/2017 02:00:05 UTC').getTime(),
    ],
  },
}
