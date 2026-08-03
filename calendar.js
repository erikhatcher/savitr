// Savitr calendar: pop-up monthly calendar where each day links to that day's game.
//   Day links are index.html?game_seed=YYYY-MM-DD, so a given date always deals the same board.
var SavitrCalendar = function(container) {
  var month_names = ['January', 'February', 'March',     'April',   'May',      'June',
                     'July',    'August',   'September', 'October', 'November', 'December'];
  var day_names = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  var today = new Date();
  today = new Date(today.getFullYear(), today.getMonth(), today.getDate()); // midnight, for date-only comparisons

  var today_id = date_id(today);
  var current_id = current_game_id();       // the date, if any, this page was loaded with
  var shown = new Date(today.getTime());    // month currently displayed; day component unused

  var corner = $('<div class="calendar-corner">' +
                   '<button class="calendar-toggle" title="Play a game by date">📅</button>' +
                   '<div class="calendar-popup" style="display:none;">' +
                     '<div class="calendar-nav">' +
                       '<button class="calendar-prev" title="Previous month">‹</button>' +
                       '<span class="calendar-month"></span>' +
                       '<button class="calendar-next" title="Next month">›</button>' +
                     '</div>' +
                     '<table class="calendar-grid"></table>' +
                     '<div class="calendar-note">Each day is its own game.</div>' +
                   '</div>' +
                 '</div>');

  var popup = $('.calendar-popup', corner);

  $('.calendar-toggle', corner).click(function(event) {
    event.stopPropagation();
    if (popup.is(':visible')) {
      popup.hide();
    } else {
      shown = new Date(today.getTime()); // always reopen on the current month
      draw_month();
      popup.show();
    }
  });

  $('.calendar-prev', corner).click(function() { step_month(-1); });
  $('.calendar-next', corner).click(function() { step_month(1); });

  popup.click(function(event) { event.stopPropagation(); }); // clicks inside shouldn't dismiss

  $(document).click(function() { popup.hide(); });
  $(document).keydown(function(event) {
    if (event.which == 27) { popup.hide(); } // escape
  });

  container.css('position', 'relative').prepend(corner);

  function step_month(delta) {
    shown = new Date(shown.getFullYear(), shown.getMonth() + delta, 1);
    draw_month();
  }

  function draw_month() {
    var year = shown.getFullYear();
    var month = shown.getMonth();

    $('.calendar-month', corner).html(month_names[month] + ' ' + year);

    // Next month is only reachable while there are still playable (non-future) days ahead of it
    $('.calendar-next', corner).prop('disabled', new Date(year, month + 1, 1) > today);

    var grid = $('.calendar-grid', corner).empty();

    var header = $('<tr/>');
    day_names.forEach(function(day_name) {
      header.append($('<th/>').html(day_name));
    });
    grid.append(header);

    var first_weekday = new Date(year, month, 1).getDay();
    var days_in_month = new Date(year, month + 1, 0).getDate();

    var row = $('<tr/>');
    for (var blank = 0; blank < first_weekday; blank++) {
      row.append($('<td class="calendar-blank"/>'));
    }

    for (var day = 1; day <= days_in_month; day++) {
      if (row.children().length == 7) {
        grid.append(row);
        row = $('<tr/>');
      }
      row.append(day_cell(new Date(year, month, day)));
    }

    while (row.children().length < 7) {
      row.append($('<td class="calendar-blank"/>'));
    }
    grid.append(row);
  }

  function day_cell(date) {
    var cell = $('<td/>');
    var id = date_id(date);

    if (date > today) {
      cell.addClass('calendar-future').html(date.getDate()); // not yet playable
      return cell;
    }

    var link = $('<a/>').attr('href', 'index.html?game_seed=' + id).html(date.getDate());
    if (id == today_id) { link.addClass('calendar-today').attr('title', "Today's game"); }
    if (id == current_id) { link.addClass('calendar-current'); }

    return cell.append(link);
  }

  function date_id(date) {
    // local YYYY-MM-DD; deliberately not toISOString(), which shifts to UTC
    var month = date.getMonth() + 1;
    var day = date.getDate();
    return date.getFullYear() + '-' +
           (month < 10 ? '0' + month : month) + '-' +
           (day < 10 ? '0' + day : day);
  }

  function current_game_id() {
    var seed = new RegExp('[\?&]game_seed=([^&#]*)').exec(window.location.search);
    return (seed !== null && /^\d{4}-\d{2}-\d{2}$/.test(seed[1])) ? seed[1] : null;
  }
};
