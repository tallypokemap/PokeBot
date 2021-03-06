const Discord=require('discord.js');
const moment=require('moment');

//#############################################################//
//#############################################################//
//#####   _____   ____  _  ________ __  __  ____  _   _   #####//
//#####  |  __ \ / __ \| |/ /  ____|  \/  |/ __ \| \ | |  #####//
//#####  | |__) | |  | | ' /| |__  | \  / | |  | |  \| |  #####//
//#####  |  ___/| |  | |  < |  __| | |\/| | |  | | . ` |  #####//
//#####  | |    | |__| | . \| |____| |  | | |__| | |\  |  #####//
//#####  |_|     \____/|_|\_\______|_|  |_|\____/|_| \_|  #####//
//#####             POKEMON SUBSCRIPTIONS                 #####//
//#############################################################//
//#############################################################//

module.exports.run = async (MAIN, internal_value, sighting, city, time) => {

  // DEBUG ACK
  if(MAIN.debug.Subscriptions == 'ENABLED'){ console.info('[DEBUG-SUBSCRIPTIONS] [pokemon.js] Checking Subscriptions for  '+MAIN.pokemon[sighting.pokemon_id].name+' Sighting.'); }

  // GET THE GENERAL AREA
  let pokemon_area = await MAIN.Get_Area(sighting.latitude,sighting.longitude);

  // FETCH ALL USERS FROM THE USERS TABLE AND CHECK SUBSCRIPTIONS
  MAIN.database.query("SELECT * FROM pokebot.users", function (error, users, fields){
    if(users[0]){
      users.forEach((user,index) => {

        // FETCH THE GUILD MEMBER AND CHECK IF A ADMINISTRATOR/DONOR
        let member = MAIN.guilds.get(city.discord_id).members.get(user.user_id);
        if(!member){ proceed = false; }
        else if(member.hasPermission('ADMINISTRATOR')){ proceed = true; }
        else if(city.donor_role && !member.roles.has(city.donor_role)){ proceed = false; }

        // DEFINE VARIABLES
        let user_areas = user.geofence.split(',');


        // LEVEL 1 FILTERS
        // CHECK IF THE USERS SUBS ARE PAUSED, EXIST, AND THAT THE AREA MATCHES THEIR CITY
        if(proceed = true && user.status == 'ACTIVE' && user.pokemon && city.name == user.city){

          // LEVEL 2 FILTERS
          // CHECK IF THE AREA IS WITHIN THE USER'S GEOFENCES
          if(user.geofence == 'ALL' || user_areas.indexOf(pokemon_area) >= 0){

            // SEND TO USER CHECK FUNCTION
            sub_check(MAIN, internal_value, sighting, user, city, time);
          }
          else{
            if(MAIN.debug.Subscriptions == 'ENABLED'){ console.info('[DEBUG-SUBSCRIPTIONS] [pokemon.js] '+MAIN.pokemon[sighting.pokemon_id].name+' Did Not Pass '+user.user_name+'\'s Area Filters.'); }
          }
        }
      });
    }
  });
}

async function sub_check(MAIN, internal_value, sighting, user, city, time){
  // CONVERT REWARD LIST TO AN ARRAY
  let pokemon = JSON.parse(user.pokemon);

  // DETERMINE GENDER
  if(sighting.gender == 1){ gender = 'male'; }
  else if(sighting.gender == 2){ gender = 'female'; }
  else{ gender = 'all'; }

  // CHECK EACH USER SUBSCRIPTION
  pokemon.subscriptions.forEach((sub,index) => {
    if(sub.name == MAIN.pokemon[sighting.pokemon_id].name || sub.name.startsWith('ALL')){
      if(sub.min_iv.length > 3){

        // SPLIT THE IVs UP INTO INDIVIDUAL STATS
        let min_iv = sub.min_iv.split('/');
        let max_iv = sub.max_iv.split('/');

        // CHECK ALL SUBSCRIPTION REQUIREMENTS
        switch(true){
          case sighting.individual_attack < min_iv[0]:
            if(MAIN.debug.Subscriptions == 'ENABLED'){ console.info('[DEBUG-SUBSCRIPTIONS] [pokemon.js] '+MAIN.pokemon[sighting.pokemon_id].name+' Did Not Pass '+user.user_name+'\'s Min Atk IV Filter.'); }
            break;

          case sighting.individual_defense < min_iv[1]:
            if(MAIN.debug.Subscriptions == 'ENABLED'){ console.info('[DEBUG-SUBSCRIPTIONS] [pokemon.js] '+MAIN.pokemon[sighting.pokemon_id].name+' Did Not Pass '+user.user_name+'\'s Min Def IV Filter.'); }
            break;

          case sighting.individual_stamina < min_iv[2]:
            if(MAIN.debug.Subscriptions == 'ENABLED'){ console.info('[DEBUG-SUBSCRIPTIONS] [pokemon.js] '+MAIN.pokemon[sighting.pokemon_id].name+' Did Not Pass '+user.user_name+'\'s Min Sta IV Filter.'); }
            break;

          case sighting.individual_attack > max_iv[0]:
            if(MAIN.debug.Subscriptions == 'ENABLED'){ console.info('[DEBUG-SUBSCRIPTIONS] [pokemon.js] '+MAIN.pokemon[sighting.pokemon_id].name+' Did Not Pass '+user.user_name+'\'s Max Atk IV Filter.'); }
            break;

          case sighting.individual_defense > max_iv[1]:
            if(MAIN.debug.Subscriptions == 'ENABLED'){ console.info('[DEBUG-SUBSCRIPTIONS] [pokemon.js] '+MAIN.pokemon[sighting.pokemon_id].name+' Did Not Pass '+user.user_name+'\'s Max Def IV Filter.'); }
            break;

          case sighting.individual_stamina > max_iv[2]:
            if(MAIN.debug.Subscriptions == 'ENABLED'){ console.info('[DEBUG-SUBSCRIPTIONS] [pokemon.js] '+MAIN.pokemon[sighting.pokemon_id].name+' Did Not Pass '+user.user_name+'\'s Max Sta IV Filter.'); }
            break;

          case sub.min_cp > sighting.cp:
            if(MAIN.debug.Subscriptions == 'ENABLED'){ console.info('[DEBUG-SUBSCRIPTIONS] [pokemon.js] '+MAIN.pokemon[sighting.pokemon_id].name+' Did Not Pass '+user.user_name+'\'s Min CP Filter.'); }
            break;

          case sub.max_cp < sighting.cp:
            if(MAIN.debug.Subscriptions == 'ENABLED'){ console.info('[DEBUG-SUBSCRIPTIONS] [pokemon.js] '+MAIN.pokemon[sighting.pokemon_id].name+' Did Not Pass '+user.user_name+'\'s Max CP Filter.'); }
            break;

          case sub.min_lvl > sighting.pokemon_level:
            if(MAIN.debug.Subscriptions == 'ENABLED'){ console.info('[DEBUG-SUBSCRIPTIONS] [pokemon.js] '+MAIN.pokemon[sighting.pokemon_id].name+' Did Not Pass '+user.user_name+'\'s Min Level Filter.'); }
            break;

          case sub.max_lvl < sighting.pokemon_level:
            if(MAIN.debug.Subscriptions == 'ENABLED'){ console.info('[DEBUG-SUBSCRIPTIONS] [pokemon.js] '+MAIN.pokemon[sighting.pokemon_id].name+' Did Not Pass '+user.user_name+'\'s Max Level Filter.'); }
            break;
          default:

          // CHECK GENDER AND NAME FOR A MATCH
          if(sub.gender != 'ALL' && sub.gender.toLowerCase() != gender){
            if(MAIN.debug.Subscriptions == 'ENABLED'){ console.info('[DEBUG-SUBSCRIPTIONS] [pokemon.js] '+MAIN.pokemon[sighting.pokemon_id].name+' Did Not Pass '+user.user_name+'\'s Gender Filter.'); }
            break;
          }
          else if(sub.name != MAIN.pokemon[sighting.pokemon_id].name && !sub.name.startsWith('ALL')){
            if(MAIN.debug.Subscriptions == 'ENABLED'){ console.info('[DEBUG-SUBSCRIPTIONS] [pokemon.js] '+MAIN.pokemon[sighting.pokemon_id].name+' Did Not Pass '+user.user_name+'\'s Name Filter.'); }
            break;
          }
          else{ prepare_alert(MAIN, internal_value, sighting, user, city, time); }
        }
      }
      else{

        switch(true){
          case sub.min_iv > internal_value:
            if(MAIN.debug.Subscriptions == 'ENABLED'){ console.info('[DEBUG-SUBSCRIPTIONS] [pokemon.js] '+MAIN.pokemon[sighting.pokemon_id].name+' Did Not Pass '+user.user_name+'\'s Min % IV Filter.'); }
            break;

          case sub.max_iv < internal_value:
            if(MAIN.debug.Subscriptions == 'ENABLED'){ console.info('[DEBUG-SUBSCRIPTIONS] [pokemon.js] '+MAIN.pokemon[sighting.pokemon_id].name+' Did Not Pass '+user.user_name+'\'s Max % IV Filter.'); }
            break;

          case sub.min_cp > sighting.cp:
            if(MAIN.debug.Subscriptions == 'ENABLED'){ console.info('[DEBUG-SUBSCRIPTIONS] [pokemon.js] '+MAIN.pokemon[sighting.pokemon_id].name+' Did Not Pass '+user.user_name+'\'s Min CP Filter.'); }
            break;

          case sub.max_cp < sighting.cp:
            if(MAIN.debug.Subscriptions == 'ENABLED'){ console.info('[DEBUG-SUBSCRIPTIONS] [pokemon.js] '+MAIN.pokemon[sighting.pokemon_id].name+' Did Not Pass '+user.user_name+'\'s Max CP Filter.'); }
            break;

          case sub.min_lvl > sighting.pokemon_level:
            if(MAIN.debug.Subscriptions == 'ENABLED'){ console.info('[DEBUG-SUBSCRIPTIONS] [pokemon.js] '+MAIN.pokemon[sighting.pokemon_id].name+' Did Not Pass '+user.user_name+'\'s Min Level Filter.'); }
            break;

          case sub.max_lvl < sighting.pokemon_level:
            if(MAIN.debug.Subscriptions == 'ENABLED'){ console.info('[DEBUG-SUBSCRIPTIONS] [pokemon.js] '+MAIN.pokemon[sighting.pokemon_id].name+' Did Not Pass '+user.user_name+'\'s Max Level Filter.'); }
            break;
          default:

            // CHECK GENDER AND NAME FOR A MATCH
            if(sub.gender != 'ALL' && sub.gender.toLowerCase() != gender){
              if(MAIN.debug.Subscriptions == 'ENABLED'){ console.info('[DEBUG-SUBSCRIPTIONS] [pokemon.js] '+MAIN.pokemon[sighting.pokemon_id].name+' Did Not Pass '+user.user_name+'\'s Gender Filter.'); }
              break;
            }
            else{ prepare_alert(MAIN, internal_value, sighting, user, city, time); }
        }
      }
    }
    else{
      if(MAIN.debug.Subscriptions == 'ENABLED'){ console.info('[DEBUG-SUBSCRIPTIONS] [pokemon.js] '+MAIN.pokemon[sighting.pokemon_id].name+' Did Not Pass '+user.user_name+'\'s Name Filter.'); }
    }
  });
}

async function prepare_alert(MAIN, internal_value, sighting, user, city, time){
  // FETCH THE MAP TILE
  MAIN.Static_Map_Tile(sighting.latitude,sighting.longitude,'pokemon').then(async function(img_url){

    // DEFINE VARIABLES
    let hide_time = await MAIN.Bot_Time(sighting.disappear_time,'1');
    let hide_minutes = Math.floor((sighting.disappear_time-(time/1000))/60);
    let weather = '', area = '';

    // ATTACH THE MAP TILE
    let attachment = new Discord.Attachment(img_url, 'Pokemon_Alert.png');

    // DETERMINE MOVE NAMES AND TYPES
    let move_name_1 = MAIN.moves[sighting.move_1].name;
    let move_type_1 = await MAIN.Get_Move_Type(sighting.move_1);
    let move_name_2 = MAIN.moves[sighting.move_2].name;
    let move_type_2 = await MAIN.Get_Move_Type(sighting.move_2);

    // DETERMINE POKEMON NAME AND DETAILS
    let pokemon_type = '';
    let name = MAIN.pokemon[sighting.pokemon_id].name;
    MAIN.pokemon[sighting.pokemon_id].types.forEach((type) => { pokemon_type += type+' '+MAIN.emotes[type.toLowerCase()]+' / '; });
    pokemon_type = pokemon_type.slice(0,-3);
    let height = 'Height: '+Math.floor(sighting.height*100)/100+'m';
    let weight = 'Weight: '+Math.floor(sighting.weight*100)/100+'kg';

    // GET SPRITE IMAGE
    let pokemon_url = await MAIN.Get_Sprite(sighting.form, sighting.pokemon_id);

    // GET THE GENERAL AREA
    let pokemon_area = await MAIN.Get_Area(sighting.latitude,sighting.longitude);

    // GET GENDER
    let gender = await MAIN.Get_Gender(sighting.gender);

    // GET WEATHER BOOST
    let weatherBoost = await MAIN.Get_Weather(sighting.weather);

    // CREATE AND SEND THE EMBED
    let pokemon_embed = new Discord.RichEmbed()
      .setColor('00ccff')
      .setThumbnail(pokemon_url)
      .attachFile(attachment)
      .setImage('attachment://Pokemon_Alert.png')
      .setTitle(name+' '+sighting.individual_attack+'/'+sighting.individual_defense+'/'+sighting.individual_stamina+' ('+internal_value+'%)'+weatherBoost)
      .addField('Level '+sighting.pokemon_level+' | CP '+sighting.cp+gender, move_name_1+' '+move_type_1+' / '+move_name_2+' '+move_type_2, false)
      .addField('Disappears: '+hide_time+' (*'+hide_minutes+' Mins*)', height+' | '+weight+'\n'+pokemon_type, false)
      .addField(pokemon_area.name+'| Directions:','[Google Maps](https://www.google.com/maps?q='+sighting.latitude+','+sighting.longitude+') | [Apple Maps](http://maps.apple.com/maps?daddr='+sighting.latitude+','+sighting.longitude+'&z=10&t=s&dirflg=w) | [Waze](https://waze.com/ul?ll='+sighting.latitude+','+sighting.longitude+'&navigate=yes)');

    if(MAIN.logging == 'ENABLED'){ console.info('[Pokébot] ['+MAIN.Bot_Time(null,'stamp')+'] [Subscriptions] Sent a Pokémon DM to '+user.user_name+'.'); }

    MAIN.Send_DM(city.discord_id, user.user_id, pokemon_embed, user.bot);
  });
}
