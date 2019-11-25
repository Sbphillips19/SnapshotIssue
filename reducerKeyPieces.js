case types.LOAD_PRIVATE_CHANNELS:
return {
    ...state,
    loadPrivateChannels: true
};

case types.LOAD_PRIVATE_CHANNELS_SUCCESS:
return {
    ...state,
    privateChannels: action.privateChannels,
    loadPrivateChannels: false
};

  case types.LOAD_PRIVATE_CHANNELS_ERROR:
return {
    ...state,
    channelsPrivateError: action.error,
    loadPrivateChannels: false
};
