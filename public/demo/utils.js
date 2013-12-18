/**
 * Returns a random number between min and max
 */
function getRandomArbitary (min, max) {
    return Math.random() * (max - min) + min;
}

/**
 * Returns a random integer between min and max
 * Using Math.round() will give you a non-uniform distribution!
 */
function getRandomInt (min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function formatNumber(number)
{
    number = number.toFixed(2) + '';
    x = number.split('.');
    x1 = x[0];
    x2 = x.length > 1 ? ',' + x[1] : '';
    var rgx = /(\d+)(\d{3})/;
    while (rgx.test(x1)) {
        x1 = x1.replace(rgx, '$1' + '.' + '$2');
    }
    return x1 + x2;
}

function getWeekNumber(d) {
          // Copy date so don't modify original
          d = new Date(d);
          d.setHours(0,0,0);
          // Set to nearest Thursday: current date + 4 - current day number
          // Make Sunday's day number 7
          d.setDate(d.getDate() + 4 - (d.getDay()||7));
          // Get first day of year
          var yearStart = new Date(d.getFullYear(),0,1);
          // Calculate full weeks to nearest Thursday
          var weekNo = Math.ceil(( ( (d - yearStart) / 86400000) + 1)/7)
          // Return array of year and week number
          return [d.getFullYear(), weekNo];
      }