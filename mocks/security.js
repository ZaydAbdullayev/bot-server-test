// Mocks for security.js
// This file is used to store the data that is used in the application.
const tokens = [
    { name: 'arenda_2', token: '7671850981:AAG_ZICAhkD4AUd3RfJFS4znZ_tuS7KGqIY' },
    // { name: 'arenda_2', token: '7468201877:AAHINezru2V403UXq_3XuxtNDPUSwsA10EQ' },
    // { name: 'arenda_3', token: '8023014929:AAGCD3_GinOdsZlHLsc6b8XkHdPP2DQRa14' }
]

// informations about the bot of the arenda_2
const arenda_1 = {
    bot_token: '7671850981:AAG_ZICAhkD4AUd3RfJFS4znZ_tuS7KGqIY',
    bot_username: '@SATOSHKIN_MEETUP_BOT',
    owners_chat_id: [1831538012, 7185045229],
    admin_chat_ids: [1831538012, 7185045229],
    my_chat_id: [5909376148],
    paid_chat_id: '-1002295458462',
    deleted_orders_chat_id: '-1002272913653',
    closed_orders_chat_id: '-1002317542629',
    ask_cancel_chat_id: '-1002233483556',
    new_orders_chat_id: '-1002389470396',
    main_channel: 1831538012,
    registered_users_chat_id: '-1002043732390',
    db_name: 'arenda_2',
}

// informations about the bot of the arenda_2 
const arenda_2 = {
    bot_token: '7468201877:AAHINezru2V403UXq_3XuxtNDPUSwsA10EQ',
    bot_username: '@ATOMIC_RENT_BOT',
    owners_chat_id: [1831538012, 7185045229],
    admin_chat_ids: [1831538012, 7185045229],
    my_chat_id: [5909376148],
    paid_chat_id: '-1002295458462',
    deleted_orders_chat_id: '-1002272913653',
    closed_orders_chat_id: '-1002317542629',
    ask_cancel_chat_id: '-1002233483556',
    new_orders_chat_id: '-1002389470396',
    main_channel: 1831538012,
    registered_users_chat_id: '-1002043732390',
    db_name: 'arenda_2',
}


// informations about the bot of the arenda_3
const arenda_3 = {
    bot_token: '8023014929:AAGCD3_GinOdsZlHLsc6b8XkHdPP2DQRa14',
    bot_username: '@FOCI_RENT_BOT',
    owners_chat_id: [1831538012, 7185045229],
    admin_chat_ids: [1831538012, 7185045229],
    my_chat_id: [5909376148],
    paid_chat_id: '-1002329816242',
    deleted_orders_chat_id: '-1002478863578',
    closed_orders_chat_id: '-1002464252289',
    ask_cancel_chat_id: '-1002484809896',
    new_orders_chat_id: '-1002330941976',
    main_channel: 1831538012,
    registered_users_chat_id: '-1002312090290',
    db_name: 'arenda_3',
}


module.exports = {
    tokens,
    arenda_1,
    arenda_2,
    arenda_3
};
