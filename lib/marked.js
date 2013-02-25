/**
 * marked - a markdown parser
 * Copyright (c) 2011-2013, Christopher Jeffrey. (MIT Licensed)
 * https://github.com/chjj/marked
 */

;(function() {

/**
 * Block-Level Grammar
 */

var block = {
  newline: /^\n+/,
  code: /^( {4}[^\n]+\n*)+/,
  fences: noop,
  hr: /^( *[-*_]){3,} *(?:\n+|$)/,
  heading: /^ *(#{1,6}) *([^\n]+?) *#* *(?:\n+|$)/,
  nptable: noop,
  lheading: /^([^\n]+)\n *(=|-){3,} *\n*/,
  blockquote: /^( *>[^\n]+(\n[^\n]+)*\n*)+/,
  list: /^( *)(bull) [\s\S]+?(?:hr|\n{2,}(?! )(?!\1bull )\n*|\s*$)/,
  html: /^ *(?:comment|closed|closing) *(?:\n{2,}|\s*$)/,
  def: /^ *\[([^\]]+)\]: *<?([^\s>]+)>?(?: +["(]([^\n]+)[")])? *(?:\n+|$)/,
  table: noop,
  paragraph: /^((?:[^\n]+\n?(?!hr|heading|lheading|blockquote|tag|def))+)\n*/,
  text: /^[^\n]+/
};

block.bullet = /(?:[*+-]|\d+\.)/;
block.item = /^( *)(bull) [^\n]*(?:\n(?!\1bull )[^\n]*)*/;
block.item = replace(block.item, 'gm')
  (/bull/g, block.bullet)
  ();

block.list = replace(block.list)
  (/bull/g, block.bullet)
  ('hr', /\n+(?=(?: *[-*_]){3,} *(?:\n+|$))/)
  ();

block._tag = '(?!(?:'
  + 'a|em|strong|small|s|cite|q|dfn|abbr|data|time|code'
  + '|var|samp|kbd|sub|sup|i|b|u|mark|ruby|rt|rp|bdi|bdo'
  + '|span|br|wbr|ins|del|img)\\b)\\w+(?!:/|@)\\b';

block.html = replace(block.html)
  ('comment', /<!--[\s\S]*?-->/)
  ('closed', /<(tag)[\s\S]+?<\/\1>/)
  ('closing', /<tag(?:"[^"]*"|'[^']*'|[^'">])*?>/)
  (/tag/g, block._tag)
  ();

block.paragraph = replace(block.paragraph)
  ('hr', block.hr)
  ('heading', block.heading)
  ('lheading', block.lheading)
  ('blockquote', block.blockquote)
  ('tag', '<' + block._tag)
  ('def', block.def)
  ();

/**
 * Normal Block Grammar
 */

block.normal = merge({}, block);

/**
 * GFM Block Grammar
 */

block.gfm = merge({}, block.normal, {
  fences: /^ *(`{3,}|~{3,}) *(\w+)? *\n([\s\S]+?)\s*\1 *(?:\n+|$)/,
  paragraph: /^/
});

block.gfm.paragraph = replace(block.paragraph)
  ('(?!', '(?!' + block.gfm.fences.source.replace('\\1', '\\2') + '|')
  ();

/**
 * GFM + Tables Block Grammar
 */

block.tables = merge({}, block.gfm, {
  nptable: /^ *(\S.*\|.*)\n *([-:]+ *\|[-| :]*)\n((?:.*\|.*(?:\n|$))*)\n*/,
  table: /^ *\|(.+)\n *\|( *[-:]+[-| :]*)\n((?: *\|.*(?:\n|$))*)\n*/
});

/**
 * Block Lexer
 */

function Lexer(options) {
  this.tokens = [];
  this.tokens.links = {};
  this.options = options || marked.defaults;
  this.rules = block.normal;

  if (this.options.gfm) {
    if (this.options.tables) {
      this.rules = block.tables;
    } else {
      this.rules = block.gfm;
    }
  }
}

/**
 * Expose Block Rules
 */

Lexer.rules = block;

/**
 * Static Lex Method
 */

Lexer.lex = function(src, options) {
  var lexer = new Lexer(options);
  return lexer.lex(src);
};

/**
 * Preprocessing
 */

Lexer.prototype.lex = function(src) {
  src = src
    .replace(/\r\n|\r/g, '\n')
    .replace(/\t/g, '    ')
    .replace(/\u00a0/g, ' ')
    .replace(/\u2424/g, '\n');

  return this.token(src, true);
};

/**
 * Lexing
 */

Lexer.prototype.token = function(src, top) {
  var src = src.replace(/^ +$/gm, '')
    , next
    , loose
    , cap
    , bull
    , b
    , item
    , space
    , i
    , l;

  while (src) {
    // newline
    if (cap = this.rules.newline.exec(src)) {
      src = src.substring(cap[0].length);
      if (cap[0].length > 1) {
        this.tokens.push({
          type: 'space'
        });
      }
    }

    // code
    if (cap = this.rules.code.exec(src)) {
      src = src.substring(cap[0].length);
      cap = cap[0].replace(/^ {4}/gm, '');
      this.tokens.push({
        type: 'code',
        text: !this.options.pedantic
          ? cap.replace(/\n+$/, '')
          : cap
      });
      continue;
    }

    // fences (gfm)
    if (cap = this.rules.fences.exec(src)) {
      src = src.substring(cap[0].length);
      this.tokens.push({
        type: 'code',
        lang: cap[2],
        text: cap[3]
      });
      continue;
    }

    // heading
    if (cap = this.rules.heading.exec(src)) {
      src = src.substring(cap[0].length);
      this.tokens.push({
        type: 'heading',
        depth: cap[1].length,
        text: cap[2]
      });
      continue;
    }

    // table no leading pipe (gfm)
    if (top && (cap = this.rules.nptable.exec(src))) {
      src = src.substring(cap[0].length);

      item = {
        type: 'table',
        header: cap[1].replace(/^ *| *\| *$/g, '').split(/ *\| */),
        align: cap[2].replace(/^ *|\| *$/g, '').split(/ *\| */),
        cells: cap[3].replace(/\n$/, '').split('\n')
      };

      for (i = 0; i < item.align.length; i++) {
        if (/^ *-+: *$/.test(item.align[i])) {
          item.align[i] = 'right';
        } else if (/^ *:-+: *$/.test(item.align[i])) {
          item.align[i] = 'center';
        } else if (/^ *:-+ *$/.test(item.align[i])) {
          item.align[i] = 'left';
        } else {
          item.align[i] = null;
        }
      }

      for (i = 0; i < item.cells.length; i++) {
        item.cells[i] = item.cells[i].split(/ *\| */);
      }

      this.tokens.push(item);

      continue;
    }

    // lheading
    if (cap = this.rules.lheading.exec(src)) {
      src = src.substring(cap[0].length);
      this.tokens.push({
        type: 'heading',
        depth: cap[2] === '=' ? 1 : 2,
        text: cap[1]
      });
      continue;
    }

    // hr
    if (cap = this.rules.hr.exec(src)) {
      src = src.substring(cap[0].length);
      this.tokens.push({
        type: 'hr'
      });
      continue;
    }

    // blockquote
    if (cap = this.rules.blockquote.exec(src)) {
      src = src.substring(cap[0].length);

      this.tokens.push({
        type: 'blockquote_start'
      });

      cap = cap[0].replace(/^ *> ?/gm, '');

      // Pass `top` to keep the current
      // "toplevel" state. This is exactly
      // how markdown.pl works.
      this.token(cap, top);

      this.tokens.push({
        type: 'blockquote_end'
      });

      continue;
    }

    // list
    if (cap = this.rules.list.exec(src)) {
      src = src.substring(cap[0].length);
      bull = cap[2];

      this.tokens.push({
        type: 'list_start',
        ordered: bull.length > 1
      });

      // Get each top-level item.
      cap = cap[0].match(this.rules.item);

      next = false;
      l = cap.length;
      i = 0;

      for (; i < l; i++) {
        item = cap[i];

        // Remove the list item's bullet
        // so it is seen as the next token.
        space = item.length;
        item = item.replace(/^ *([*+-]|\d+\.) +/, '');

        // Outdent whatever the
        // list item contains. Hacky.
        if (~item.indexOf('\n ')) {
          space -= item.length;
          item = !this.options.pedantic
            ? item.replace(new RegExp('^ {1,' + space + '}', 'gm'), '')
            : item.replace(/^ {1,4}/gm, '');
        }

        // Determine whether the next list item belongs here.
        // Backpedal if it does not belong in this list.
        if (this.options.smartLists && i !== l - 1) {
          b = block.bullet.exec(cap[i+1])[0];
          if (bull !== b && !(bull.length > 1 && b.length > 1)) {
            src = cap.slice(i + 1).join('\n') + src;
            i = l - 1;
          }
        }

        // Determine whether item is loose or not.
        // Use: /(^|\n)(?! )[^\n]+\n\n(?!\s*$)/
        // for discount behavior.
        loose = next || /\n\n(?!\s*$)/.test(item);
        if (i !== l - 1) {
          next = item[item.length-1] === '\n';
          if (!loose) loose = next;
        }

        this.tokens.push({
          type: loose
            ? 'loose_item_start'
            : 'list_item_start'
        });

        // Recurse.
        this.token(item, false);

        this.tokens.push({
          type: 'list_item_end'
        });
      }

      this.tokens.push({
        type: 'list_end'
      });

      continue;
    }

    // html
    if (cap = this.rules.html.exec(src)) {
      src = src.substring(cap[0].length);
      this.tokens.push({
        type: this.options.sanitize
          ? 'paragraph'
          : 'html',
        pre: cap[1] === 'pre',
        text: cap[0]
      });
      continue;
    }

    // def
    if (top && (cap = this.rules.def.exec(src))) {
      src = src.substring(cap[0].length);
      this.tokens.links[cap[1].toLowerCase()] = {
        href: cap[2],
        title: cap[3]
      };
      continue;
    }

    // table (gfm)
    if (top && (cap = this.rules.table.exec(src))) {
      src = src.substring(cap[0].length);

      item = {
        type: 'table',
        header: cap[1].replace(/^ *| *\| *$/g, '').split(/ *\| */),
        align: cap[2].replace(/^ *|\| *$/g, '').split(/ *\| */),
        cells: cap[3].replace(/(?: *\| *)?\n$/, '').split('\n')
      };

      for (i = 0; i < item.align.length; i++) {
        if (/^ *-+: *$/.test(item.align[i])) {
          item.align[i] = 'right';
        } else if (/^ *:-+: *$/.test(item.align[i])) {
          item.align[i] = 'center';
        } else if (/^ *:-+ *$/.test(item.align[i])) {
          item.align[i] = 'left';
        } else {
          item.align[i] = null;
        }
      }

      for (i = 0; i < item.cells.length; i++) {
        item.cells[i] = item.cells[i]
          .replace(/^ *\| *| *\| *$/g, '')
          .split(/ *\| */);
      }

      this.tokens.push(item);

      continue;
    }

    // top-level paragraph
    if (top && (cap = this.rules.paragraph.exec(src))) {
      src = src.substring(cap[0].length);
      this.tokens.push({
        type: 'paragraph',
        text: cap[1][cap[1].length-1] === '\n'
          ? cap[1].slice(0, -1)
          : cap[1]
      });
      continue;
    }

    // text
    if (cap = this.rules.text.exec(src)) {
      // Top-level should never reach here.
      src = src.substring(cap[0].length);
      this.tokens.push({
        type: 'text',
        text: cap[0]
      });
      continue;
    }

    if (src) {
      throw new
        Error('Infinite loop on byte: ' + src.charCodeAt(0));
    }
  }

  return this.tokens;
};

/**
 * Inline-Level Grammar
 */

var inline = {
  escape: /^\\([\\`*{}\[\]()#+\-.!_>])/,
  autolink: /^<([^ >]+(@|:\/)[^ >]+)>/,
  url: noop,
  tag: /^<!--[\s\S]*?-->|^<\/?\w+(?:"[^"]*"|'[^']*'|[^'">])*?>/,
  link: /^!?\[(inside)\]\(href\)/,
  reflink: /^!?\[(inside)\]\s*\[([^\]]*)\]/,
  nolink: /^!?\[((?:\[[^\]]*\]|[^\[\]])*)\]/,
  strong: /^__([\s\S]+?)__(?!_)|^\*\*([\s\S]+?)\*\*(?!\*)/,
  em: /^\b_((?:__|[\s\S])+?)_\b|^\*((?:\*\*|[\s\S])+?)\*(?!\*)/,
  emoji: /^\:([\w|\+|\-]{2,}?)\:/,
  code: /^(`+)\s*([\s\S]*?[^`])\s*\1(?!`)/,
  br: /^ {2,}\n(?!\s*$)/,
  del: noop,
  text: /^[\s\S]+?(?=[\\<!\[_*`\:]| {2,}\n|$)/
};

inline._inside = /(?:\[[^\]]*\]|[^\]]|\](?=[^\[]*\]))*/;
inline._href = /\s*<?([^\s]*?)>?(?:\s+['"]([\s\S]*?)['"])?\s*/;

inline.link = replace(inline.link)
  ('inside', inline._inside)
  ('href', inline._href)
  ();

inline.reflink = replace(inline.reflink)
  ('inside', inline._inside)
  ();

/**
 * Normal Inline Grammar
 */

inline.normal = merge({}, inline);

/**
 * Pedantic Inline Grammar
 */

inline.pedantic = merge({}, inline.normal, {
  strong: /^__(?=\S)([\s\S]*?\S)__(?!_)|^\*\*(?=\S)([\s\S]*?\S)\*\*(?!\*)/,
  em: /^_(?=\S)([\s\S]*?\S)_(?!_)|^\*(?=\S)([\s\S]*?\S)\*(?!\*)/
});

/**
 * GFM Inline Grammar
 */

inline.gfm = merge({}, inline.normal, {
  escape: replace(inline.escape)('])', '~|])')(),
  url: /^(https?:\/\/[^\s<]+[^<.,:;"')\]\s])/,
  del: /^~~(?=\S)([\s\S]*?\S)~~/,
  text: replace(inline.text)
    (']|', '~]|')
    ('|', '|https?://|')
    ()
});

inline.emoji = {
  emoji: /^\:([\w|\+|\-]{2,}?)\:/,
  emojis: ':100:1234:-1:+1:8ball:abcd:abc:ab:accept:aerial_tramway:airplane:alarm_clock:alien:ambulance:anchor:angel:anger:angry:anguished:ant:a:apple:aquarius:aries:arrow_backward:arrow_double_down:arrow_double_up:arrow_down:arrow_down_small:arrow_forward:arrow_heading_down:arrow_heading_up:arrow_left:arrow_lower_left:arrow_lower_right:arrow_right_hook:arrow_right:arrows_clockwise:arrows_counterclockwise:arrow_up_down:arrow_upper_left:arrow_upper_right:arrow_up:arrow_up_small:articulated_lorry:art:astonished:atm:baby_bottle:baby_chick:baby:baby_symbol:baggage_claim:balloon:ballot_box_with_check:bamboo:banana:bangbang:bank:barber:bar_chart:baseball:basketball:bath:bathtub:battery:bear:bee:beer:beers:beetle:beginner:bell:bento:bicyclist:bike:bikini:bird:birthday:black_circle:black_joker:black_nib:black_square_button:black_square:blossom:blowfish:blue_book:blue_car:blue_heart:blush:boar:boat:bomb:bookmark:bookmark_tabs:book:books:boom:boot:bouquet:bowling:bow:bowtie:boy:b:bread:bride_with_veil:bridge_at_night:briefcase:broken_heart:bug:bulb:bullettrain_front:bullettrain_side:bus:busstop:bust_in_silhouette:busts_in_silhouette:cactus:cake:calendar:calling:camel:camera:cancer:candy:capital_abcd:capricorn:card_index:carousel_horse:car:cat2:cat:cd:chart:chart_with_downwards_trend:chart_with_upwards_trend:checkered_flag:cherries:cherry_blossom:chestnut:chicken:children_crossing:chocolate_bar:christmas_tree:church:cinema:circus_tent:city_sunrise:city_sunset:clapper:clap:clipboard:clock1030:clock10:clock1130:clock11:clock1230:clock12:clock130:clock1:clock230:clock2:clock330:clock3:clock430:clock4:clock530:clock5:clock630:clock6:clock730:clock7:clock830:clock8:clock930:clock9:closed_book:closed_lock_with_key:closed_umbrella:cloud:cl:clubs:cn:cocktail:coffee:cold_sweat:collision:computer:confetti_ball:confounded:confused:congratulations:construction:construction_worker:convenience_store:cookie:cool:cop:copyright:corn:couplekiss:couple:couple_with_heart:cow2:cow:credit_card:crocodile:crossed_flags:crown:crying_cat_face:cry:crystal_ball:cupid:curly_loop:currency_exchange:curry:custard:customs:cyclone:dancer:dancers:dango:dart:dash:date:deciduous_tree:department_store:de:diamond_shape_with_a_dot_inside:diamonds:disappointed:disappointed_relieved:dizzy_face:dizzy:dog2:dog:dollar:dolls:dolphin:do_not_litter:door:doughnut:dragon_face:dragon:dress:dromedary_camel:droplet:dvd:ear_of_rice:ear:earth_africa:earth_americas:earth_asia:eggplant:egg:eight:eight_pointed_black_star:eight_spoked_asterisk:electric_plug:elephant:e-mail:email:emojis.txt:end:envelope:es:european_castle:european_post_office:euro:evergreen_tree:exclamation:expressionless:eyeglasses:eyes:facepunch:factory:fallen_leaf:family:fast_forward:fax:fearful:feelsgood:feet:ferris_wheel:file_folder:finnadie:fire_engine:fire:fireworks:first_quarter_moon:first_quarter_moon_with_face:fish_cake:fishing_pole_and_fish:fish:fist:five:flags:flashlight:floppy_disk:flower_playing_cards:flushed:foggy:football:fork_and_knife:fountain:four_leaf_clover:four:free:fried_shrimp:fries:frog:frowning:fr:fuelpump:full_moon:full_moon_with_face:fu:game_die:gb:gemini:gem:ghost:gift_heart:gift:girl:globe_with_meridians:goat:goberserk:godmode:golf:grapes:green_apple:green_book:green_heart:grey_exclamation:grey_question:grimacing:grinning:grin:guardsman:guitar:gun:haircut:hamburger:hammer:hamster:handbag:hand:hankey:hash:hatched_chick:hatching_chick:headphones:hear_no_evil:heartbeat:heart_decoration:heart_eyes_cat:heart_eyes:heart:heartpulse:hearts:heavy_check_mark:heavy_division_sign:heavy_dollar_sign:heavy_exclamation_mark:heavy_minus_sign:heavy_multiplication_x:heavy_plus_sign:helicopter:herb:hibiscus:high_brightness:high_heel:hocho:honeybee:honey_pot:horse:horse_racing:hospital:hotel:hotsprings:hourglass_flowing_sand:hourglass:house:house_with_garden:hurtrealbad:hushed:ice_cream:icecream:ideograph_advantage:id:imp:inbox_tray:incoming_envelope:information_desk_person:information_source:innocent:interrobang:iphone:it:izakaya_lantern:jack_o_lantern:japanese_castle:japanese_goblin:japanese_ogre:japan:jeans:joy_cat:joy:jp:keycap_ten:key:kimono:kissing_cat:kissing_closed_eyes:kissing_face:kissing_heart:kissing:kissing_smiling_eyes:kiss:koala:koko:kr:large_blue_circle:large_blue_diamond:large_orange_diamond:last_quarter_moon:last_quarter_moon_with_face:laughing:leaves:ledger:left_luggage:left_right_arrow:leftwards_arrow_with_hook:lemon:leopard:leo:libra:light_rail:link:lips:lipstick:lock:lock_with_ink_pen:lollipop:loop:loudspeaker:love_hotel:love_letter:low_brightness:mag:mag_right:mahjong:mailbox_closed:mailbox:mailbox_with_mail:mailbox_with_no_mail:man:mans_shoe:man_with_gua_pi_mao:man_with_turban:maple_leaf:mask:massage:meat_on_bone:mega:melon:memo:mens:metal:metro:microphone:microscope:milky_way:minibus:minidisc:mobile_phone_off:moneybag:money_with_wings:monkey_face:monkey:monorail:moon:mortar_board:mountain_bicyclist:mountain_cableway:mountain_railway:mount_fuji:mouse2:mouse:movie_camera:moyai:m:muscle:mushroom:musical_keyboard:musical_note:musical_score:mute:mx:nail_care:name_badge:neckbeard:necktie:negative_squared_cross_mark:neutral_face:new_moon:new_moon_with_face:new:newspaper:ng:nine:no_bell:no_bicycles:no_entry:no_entry_sign:no_good:no_mobile_phones:no_mouth:non-potable_water:no_pedestrians:nose:no_smoking:notebook:notebook_with_decorative_cover:notes:nut_and_bolt:o2:ocean:octocat:octopus:oden:office:ok_hand:ok:ok_woman:older_man:older_woman:oncoming_automobile:oncoming_bus:oncoming_police_car:oncoming_taxi:one:on:open_file_folder:open_hands:open_mouth:ophiuchus:o:orange_book:outbox_tray:ox:page_facing_up:pager:page_with_curl:palm_tree:panda_face:paperclip:parking:part_alternation_mark:partly_sunny:passport_control:paw_prints:peach:pear:pencil2:pencil:penguin:pensive:performing_arts:persevere:person_frowning:person_with_blond_hair:person_with_pouting_face:phone:pig2:pig_nose:pig:pill:pineapple:pisces:pizza:plus1:point_down:point_left:point_right:point_up_2:point_up:police_car:poodle:poop:postal_horn:postbox:post_office:potable_water:pouch:poultry_leg:pound:pouting_cat:pray:princess:punch:purple_heart:purse:pushpin:put_litter_in_its_place:question:rabbit2:rabbit:racehorse:radio_button:radio:rage1:rage2:rage3:rage4:rage:railway_car:rainbow:raised_hand:raised_hands:ramen:ram:rat:recycle:red_car:red_circle:registered:relaxed:relieved:repeat_one:repeat:restroom:revolving_hearts:rewind:ribbon:rice_ball:rice_cracker:rice:rice_scene:ring:rocket:roller_coaster:rooster:rose:rotating_light:round_pushpin:rowboat:rugby_football:runner:running:running_shirt_with_sash:ru:sagittarius:sailboat:sake:sandal:santa:sa:satellite:satisfied:saxophone:school:school_satchel:scissors:scorpius:scream_cat:scream:scroll:seat:secret:seedling:see_no_evil:seven:shaved_ice:sheep:shell:shipit:ship:shirt:shit:shoe:shower:signal_strength:six:six_pointed_star:ski:skull:sleeping:sleepy:slot_machine:small_blue_diamond:small_orange_diamond:small_red_triangle_down:small_red_triangle:smile_cat:smile:smiley_cat:smiley:smiling_imp:smirk_cat:smirk:smoking:snail:snake:snowboarder:snowflake:snowman:sob:soccer:soon:sos:sound:space_invader:spades:spaghetti:sparkler:sparkles:sparkling_heart:speaker:speak_no_evil:speech_balloon:speedboat:squirrel:star2:star:stars:station:statue_of_liberty:steam_locomotive:stew:straight_ruler:strawberry:stuck_out_tongue_closed_eyes:stuck_out_tongue:stuck_out_tongue_winking_eye:sunflower:sunglasses:sunny:sunrise_over_mountains:sunrise:sun_with_face:surfer:sushi:suspect:suspension_railway:sweat_drops:sweat:sweat_smile:sweet_potato:swimmer:symbols:syringe:tada:tanabata_tree:tangerine:taurus:taxi:tea:telephone:telephone_receiver:telescope:tennis:tent:thought_balloon:three:thumbsdown:thumbsup:ticket:tiger2:tiger:tired_face:tm:toilet:tokyo_tower:tomato:tongue:tophat:top:tractor:traffic_light:train2:train:tram:triangular_flag_on_post:triangular_ruler:trident:triumph:trolleybus:trollface:trophy:tropical_drink:tropical_fish:truck:trumpet:tshirt:tulip:turtle:tv:twisted_rightwards_arrows:two_hearts:two_men_holding_hands:two:two_women_holding_hands:u5272:u5408:u55b6:u6307:u6708:u6709:u6e80:u7121:u7533:u7981:u7a7a:uk:umbrella:unamused:underage:unlock:up:us:vertical_traffic_light:vhs:vibration_mode:video_camera:video_game:violin:virgo:volcano:v:vs:walking:waning_crescent_moon:waning_gibbous_moon:warning:watch:water_buffalo:watermelon:wave:wavy_dash:waxing_crescent_moon:waxing_gibbous_moon:wc:weary:wedding:whale2:whale:wheelchair:white_check_mark:white_circle:white_flower:white_square_button:white_square:wind_chime:wine_glass:wink:wolf:woman:womans_clothes:womans_hat:womens:worried:wrench:x:yellow_heart:yen:yum:zap:zero:zzz:'
}

/**
 * GFM + Line Breaks Inline Grammar
 */

inline.breaks = merge({}, inline.gfm, {
  br: replace(inline.br)('{2,}', '*')(),
  text: replace(inline.gfm.text)('{2,}', '*')()
});

/**
 * Inline Lexer & Compiler
 */

function InlineLexer(links, options) {
  this.options = options || marked.defaults;
  this.links = links;
  this.rules = inline.normal;

  if (!this.links) {
    throw new
      Error('Tokens array requires a `links` property.');
  }

  if (this.options.gfm) {
    if (this.options.breaks) {
      this.rules = inline.breaks;
    } else {
      this.rules = inline.gfm;
    }
  } else if (this.options.pedantic) {
    this.rules = inline.pedantic;
  }
  //TODO: estandarize this 
  if (this.options.emojis) {
    this.rules = merge({}, inline.emoji);
  }
}

/**
 * Expose Inline Rules
 */

InlineLexer.rules = inline;

/**
 * Static Lexing/Compiling Method
 */

InlineLexer.output = function(src, links, options) {
  var inline = new InlineLexer(links, options);
  return inline.output(src);
};

/**
 * Lexing/Compiling
 */

InlineLexer.prototype.output = function(src) {
  var out = ''
    , link
    , text
    , href
    , cap;

  while (src) {
    // escape
    if (cap = this.rules.escape.exec(src)) {
      src = src.substring(cap[0].length);
      out += cap[1];
      continue;
    }

    // autolink
    if (cap = this.rules.autolink.exec(src)) {
      src = src.substring(cap[0].length);
      if (cap[2] === '@') {
        text = cap[1][6] === ':'
          ? this.mangle(cap[1].substring(7))
          : this.mangle(cap[1]);
        href = this.mangle('mailto:') + text;
      } else {
        text = escape(cap[1]);
        href = text;
      }
      out += '<a href="'
        + href
        + '">'
        + text
        + '</a>';
      continue;
    }

    // url (gfm)
    if (cap = this.rules.url.exec(src)) {
      src = src.substring(cap[0].length);
      text = escape(cap[1]);
      href = text;
      out += '<a href="'
        + href
        + '">'
        + text
        + '</a>';
      continue;
    }

    // tag
    if (cap = this.rules.tag.exec(src)) {
      src = src.substring(cap[0].length);
      out += this.options.sanitize
        ? escape(cap[0])
        : cap[0];
      continue;
    }

    // link
    if (cap = this.rules.link.exec(src)) {
      src = src.substring(cap[0].length);
      out += this.outputLink(cap, {
        href: cap[2],
        title: cap[3]
      });
      continue;
    }

    // reflink, nolink
    if ((cap = this.rules.reflink.exec(src))
        || (cap = this.rules.nolink.exec(src))) {
      src = src.substring(cap[0].length);
      link = (cap[2] || cap[1]).replace(/\s+/g, ' ');
      link = this.links[link.toLowerCase()];
      if (!link || !link.href) {
        out += cap[0][0];
        src = cap[0].substring(1) + src;
        continue;
      }
      out += this.outputLink(cap, link);
      continue;
    }

    // strong
    if (cap = this.rules.strong.exec(src)) {
      src = src.substring(cap[0].length);
      out += '<strong>'
        + this.output(cap[2] || cap[1])
        + '</strong>';
      continue;
    }

    // em
    if (cap = this.rules.em.exec(src)) {
      src = src.substring(cap[0].length);
      out += '<em>'
        + this.output(cap[2] || cap[1])
        + '</em>';
      continue;
    }

    // emoji
    if (cap = this.rules.emoji.exec(src)) {
      src = src.substring(cap[0].length);
      console.log(','+cap[1]+',');
      console.log(inline.emojis.search(','+cap[1]+','));
      if ( inline.emojis.search(',' + cap[1] + ',') !== -1 || cap[1] === '+1') {
        out += '<img class="emoji" src="/img/emojis/'
          + (cap[1])
          + '.png" alt="'
          + (cap[1])
          + ' emoji"/>';  
      } else {
        out += cap[0];
      }
      continue;
    }

    // code
    if (cap = this.rules.code.exec(src)) {
      src = src.substring(cap[0].length);
      out += '<code>'
        + escape(cap[2], true)
        + '</code>';
      continue;
    }

    // br
    if (cap = this.rules.br.exec(src)) {
      src = src.substring(cap[0].length);
      out += '<br>';
      continue;
    }

    // del (gfm)
    if (cap = this.rules.del.exec(src)) {
      src = src.substring(cap[0].length);
      out += '<del>'
        + this.output(cap[1])
        + '</del>';
      continue;
    }

    // text
    if (cap = this.rules.text.exec(src)) {
      src = src.substring(cap[0].length);
      out += escape(cap[0]);
      continue;
    }

    if (src) {
      throw new
        Error('Infinite loop on byte: ' + src.charCodeAt(0));
    }
  }

  return out;
};

/**
 * Compile Link
 */

InlineLexer.prototype.outputLink = function(cap, link) {
  if (cap[0][0] !== '!') {
    return '<a href="'
      + escape(link.href)
      + '"'
      + (link.title
      ? ' title="'
      + escape(link.title)
      + '"'
      : '')
      + '>'
      + this.output(cap[1])
      + '</a>';
  } else {
    return '<img src="'
      + escape(link.href)
      + '" alt="'
      + escape(cap[1])
      + '"'
      + (link.title
      ? ' title="'
      + escape(link.title)
      + '"'
      : '')
      + '>';
  }
};

/**
 * Mangle Links
 */

InlineLexer.prototype.mangle = function(text) {
  var out = ''
    , l = text.length
    , i = 0
    , ch;

  for (; i < l; i++) {
    ch = text.charCodeAt(i);
    if (Math.random() > 0.5) {
      ch = 'x' + ch.toString(16);
    }
    out += '&#' + ch + ';';
  }

  return out;
};

/**
 * Parsing & Compiling
 */

function Parser(options) {
  this.tokens = [];
  this.token = null;
  this.options = options || marked.defaults;
}

/**
 * Static Parse Method
 */

Parser.parse = function(src, options) {
  var parser = new Parser(options);
  return parser.parse(src);
};

/**
 * Parse Loop
 */

Parser.prototype.parse = function(src) {
  this.inline = new InlineLexer(src.links, this.options);
  this.tokens = src.reverse();

  var out = '';
  while (this.next()) {
    out += this.tok();
  }

  return out;
};

/**
 * Next Token
 */

Parser.prototype.next = function() {
  return this.token = this.tokens.pop();
};

/**
 * Preview Next Token
 */

Parser.prototype.peek = function() {
  return this.tokens[this.tokens.length-1] || 0;
};

/**
 * Parse Text Tokens
 */

Parser.prototype.parseText = function() {
  var body = this.token.text;

  while (this.peek().type === 'text') {
    body += '\n' + this.next().text;
  }

  return this.inline.output(body);
};

/**
 * Parse Current Token
 */

Parser.prototype.tok = function() {
  switch (this.token.type) {
    case 'space': {
      return '';
    }
    case 'hr': {
      return '<hr>\n';
    }
    case 'heading': {
      return '<h'
        + this.token.depth
        + '>'
        + this.inline.output(this.token.text)
        + '</h'
        + this.token.depth
        + '>\n';
    }
    case 'code': {
      if (this.options.highlight) {
        var code = this.options.highlight(this.token.text, this.token.lang);
        if (code != null && code !== this.token.text) {
          this.token.escaped = true;
          this.token.text = code;
        }
      }

      if (!this.token.escaped) {
        this.token.text = escape(this.token.text, true);
      }

      return '<pre><code'
        + (this.token.lang
        ? ' class="'
        + this.options.langPrefix
        + this.token.lang
        + '"'
        : '')
        + '>'
        + this.token.text
        + '</code></pre>\n';
    }
    case 'table': {
      var body = ''
        , heading
        , i
        , row
        , cell
        , j;

      // header
      body += '<thead>\n<tr>\n';
      for (i = 0; i < this.token.header.length; i++) {
        heading = this.inline.output(this.token.header[i]);
        body += this.token.align[i]
          ? '<th align="' + this.token.align[i] + '">' + heading + '</th>\n'
          : '<th>' + heading + '</th>\n';
      }
      body += '</tr>\n</thead>\n';

      // body
      body += '<tbody>\n'
      for (i = 0; i < this.token.cells.length; i++) {
        row = this.token.cells[i];
        body += '<tr>\n';
        for (j = 0; j < row.length; j++) {
          cell = this.inline.output(row[j]);
          body += this.token.align[j]
            ? '<td align="' + this.token.align[j] + '">' + cell + '</td>\n'
            : '<td>' + cell + '</td>\n';
        }
        body += '</tr>\n';
      }
      body += '</tbody>\n';

      return '<table>\n'
        + body
        + '</table>\n';
    }
    case 'blockquote_start': {
      var body = '';

      while (this.next().type !== 'blockquote_end') {
        body += this.tok();
      }

      return '<blockquote>\n'
        + body
        + '</blockquote>\n';
    }
    case 'list_start': {
      var type = this.token.ordered ? 'ol' : 'ul'
        , body = '';

      while (this.next().type !== 'list_end') {
        body += this.tok();
      }

      return '<'
        + type
        + '>\n'
        + body
        + '</'
        + type
        + '>\n';
    }
    case 'list_item_start': {
      var body = '';

      while (this.next().type !== 'list_item_end') {
        body += this.token.type === 'text'
          ? this.parseText()
          : this.tok();
      }

      return '<li>'
        + body
        + '</li>\n';
    }
    case 'loose_item_start': {
      var body = '';

      while (this.next().type !== 'list_item_end') {
        body += this.tok();
      }

      return '<li>'
        + body
        + '</li>\n';
    }
    case 'html': {
      return !this.token.pre && !this.options.pedantic
        ? this.inline.output(this.token.text)
        : this.token.text;
    }
    case 'paragraph': {
      return '<p>'
        + this.inline.output(this.token.text)
        + '</p>\n';
    }
    case 'text': {
      return '<p>'
        + this.parseText()
        + '</p>\n';
    }
  }
};

/**
 * Helpers
 */

function escape(html, encode) {
  return html
    .replace(!encode ? /&(?!#?\w+;)/g : /&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function replace(regex, opt) {
  regex = regex.source;
  opt = opt || '';
  return function self(name, val) {
    if (!name) return new RegExp(regex, opt);
    val = val.source || val;
    val = val.replace(/(^|[^\[])\^/g, '$1');
    regex = regex.replace(name, val);
    return self;
  };
}

function noop() {}
noop.exec = noop;

function merge(obj) {
  var i = 1
    , target
    , key;

  for (; i < arguments.length; i++) {
    target = arguments[i];
    for (key in target) {
      if (Object.prototype.hasOwnProperty.call(target, key)) {
        obj[key] = target[key];
      }
    }
  }

  return obj;
}

/**
 * Marked
 */

function marked(src, opt) {
  try {
    if (opt) opt = merge({}, marked.defaults, opt);
    return Parser.parse(Lexer.lex(src, opt), opt);
  } catch (e) {
    e.message += '\nPlease report this to https://github.com/chjj/marked.';
    if ((opt || marked.defaults).silent) {
      return '<p>An error occured:</p><pre>'
        + escape(e.message + '', true)
        + '</pre>';
    }
    throw e;
  }
}

/**
 * Options
 */

marked.options =
marked.setOptions = function(opt) {
  merge(marked.defaults, opt);
  return marked;
};

marked.defaults = {
  gfm: true,
  tables: true,
  breaks: false,
  pedantic: false,
  sanitize: false,
  smartLists: false,
  silent: false,
  highlight: null,
  langPrefix: 'lang-',
  emojis: false,
  emojis_path: '/img/emojis/'
};

/**
 * Expose
 */

marked.Parser = Parser;
marked.parser = Parser.parse;

marked.Lexer = Lexer;
marked.lexer = Lexer.lex;

marked.InlineLexer = InlineLexer;
marked.inlineLexer = InlineLexer.output;

marked.parse = marked;

if (typeof exports === 'object') {
  module.exports = marked;
} else if (typeof define === 'function' && define.amd) {
  define(function() { return marked; });
} else {
  this.marked = marked;
}

}).call(function() {
  return this || (typeof window !== 'undefined' ? window : global);
}());
