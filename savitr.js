var Savitr = function(game_board, options={columns: 4, rows: 3}) {

  // Universal constants
  var numbers  = ['one',   'two',      'three'];
  var colors   = ['red',   'green',    'purple'];
  var shadings = ['empty', 'striped',  'solid'];
  var shapes   = ['oval',  'squiggle', 'diamond'];

  // Game state
  var deck = []; // only first columns*rows are seen
  var selected = []; // each value is card id (index into `deck`)

  console.log(options);

  // Build deck
  numbers.forEach(function(number) {
    colors.forEach(function(color) {
      shadings.forEach(function(shading) {
        shapes.forEach(function(shape) {
          var card = {number: number, color: color, shading: shading, shape:shape};
          deck.push(card);
        })
      })
    })
  });

  // TODO: use 'options' to control how deck is sorted
  shuffle_array(deck);

  function start() {
    // TODO: adjust terminologly to something like:
    //    game_frame > status & cards
    var board = $('<div/>').addClass('main');

    var header = $('<div class="header"><span class="status"></span> :: <span class="controls">reset</span></div>');
    board.append(header);

    var table = $('<table/>').addClass('board');
    board.append(table);

    for (var r=0; r < options['rows']; r++) {
      var row = $('<tr/>');
      for (var c=0; c < options['columns']; c++) {
        row.append($('<td/>').addClass('board-' + ((r*options['columns'])+c+1)));
      }
      table.append(row);
    }

    game_board.html(board);

    deal_cards();
    $('.card', game_board).click(card_click);

    // How many sets are there laid out?
    var cards_left = [];
    $.each($('.card',game_board), function(index,c) {
      var card_number=$(c).attr('id').split('-')[1];
      cards_left.push(deck[card_number]);
    });
    var left = sets_left(cards_left);
    console.log(left);
    $('.status',game_board).text(left.length);
  }

  function deal_cards() {
    for (var i=0; i < options['rows']*options['columns'] ; i++) {
      var card_index = i;  // deck is shuffled, assuming, so the i'th item in the deck is the i'th card placed
      var card = deck[card_index];
      // _Joy of Set_ file naming scheme (p. ???); Blake chopped these up, thanks Blake!
      var number_code = {one: '1', two: '2', three: '3'};
      var color_code = {red: 'R', green: 'G', purple: 'P'};
      var shading_code = {empty: 'O', striped: 'S', solid: 'F'};
      var shape_code = {oval: 'O', squiggle: 'S', diamond: 'D'};
      var file_name = number_code[card.number] + color_code[card.color] + shading_code[card.shading] + shape_code[card.shape];
      var board_cell = $('.board-'+(i+1), game_board);
      var img = $('<img id="card-'+card_index+'" src="images/'+file_name+'.png"/>').addClass('card');
      board_cell.html(img);
    }
  }

  function card_click() {
    var card_number=$(this).attr('id').split('-')[1];

    var already_selected = (selected.indexOf(card_number) != -1);

    // if cell not yet selected
    //   - 3 already selected?  ignore
    //   - select it: test for set & clear
    // if cell already selected
    //   - unselect it

    if (!already_selected) {
      // not already selected, add it if there's not already 3 selected
      if (selected.length < 3) {
        selected.push(card_number);
        $(this).parent('td').toggleClass('selected');
      }

      if (selected.length == 3) {
        var selected_cards = [];
        selected.forEach(function(c) {
          selected_cards.push(deck[c]);
        });
        if (is_set(selected_cards)) {
          console.log("SET!");
          selected = [];

          // remove the cards and unselect the board spots
          $('.selected .card', game_board).remove();
          $('.selected', game_board).toggleClass('selected');

          if ($('.card', game_board).length == 0) {
            console.log("CLEARED!!!");
          }

          var cards_left = [];
          $.each($('.card',game_board), function(index,c) {
            var card_number=$(c).attr('id').split('-')[1];
            cards_left.push(deck[card_number]);
          });
          var left = sets_left(cards_left);
          console.log(left);
          $('.status',game_board).text(left.length);

        }
      }
    } else {
      // already has been selected, unselect it
      selected.splice(selected.indexOf(card_number), 1);

      // update UI
      $(this).parent('td').toggleClass('selected');
    }
  }

  function is_set(three_cards) {
    var sum = vector_sum(three_cards);
    return (sum['number']  % 3 == 0) &&
           (sum['color']   % 3 == 0) &&
           (sum['shading'] % 3 == 0) &&
           (sum['shape']   % 3 == 0);
  }

  function vector_sum(three_cards) {
    if (three_cards.length != 3) {
      throw 'must be exactly three cards: ' + three_cards;
    }

    // test it for set-ness

    // map card into 4-dimensional point space
    var sum = {
      number: 0,
      color: 0,
      shading: 0,
      shape: 0
    };

    three_cards.forEach(function(card) {
      var current_point = {
        number: numbers.indexOf(card['number']),
        color: colors.indexOf(card['color']),
        shading: shadings.indexOf(card['shading']),
        shape: shapes.indexOf(card['shape'])
      };
      sum = {
        number: sum['number'] + current_point['number'],
        color: sum['color'] + current_point['color'],
        shading: sum['shading'] + current_point['shading'],
        shape: sum['shape'] + current_point['shape']
      };
    });

    return sum;
  }

  function sets_left(cards) {
    // TODO: set a limit - how many iterations is this on 81 cards?
    // throw exception if it's more than, say, 12 cards = 12*11*10?
    var sets = [];
    for (var i=0; i<cards.length;i++) {
      for (var j=i+1; j<cards.length;j++) {
        for (var k=j+1;k<cards.length;k++) {
          var set_possibility = [cards[i],cards[j],cards[k]];
          if (is_set(set_possibility)) {
            sets.push(set_possibility);
          }
        }
      }
    }

    return sets;
  }

  /**
   * Randomize array element order in-place.
   * Using Durstenfeld shuffle algorithm.
   *   adapted from https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
   */
  function shuffle_array(array) {
    for (var i = array.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var temp = array[i];
      array[i] = array[j];
      array[j] = temp;
    }
  }

  return {start: start};
};
