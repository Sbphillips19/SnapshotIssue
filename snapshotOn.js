// get private chat channels
export const getUserPrivateChannels = () => {
    return async dispatch => {
      // loading until channels are received
      dispatch(loadPrivateChannels());
      // current users
      let currentUserID = firebaseService.auth().currentUser.uid;
      // reference to blocked in firebase realtime database
      const blockedChannels = await getBlockedUsersList();
      // users current channels firebase ref
      let currentUserChannelsRef = FIREBASE_REF_USERS.child(`${currentUserID}`)
        .child("chats")
        .child("Private");
      currentUserChannelsRef.orderByValue()
        .on("value", snapshot => {
          // array to put private channels
          let privateChannelsToDownload = [];
          snapshot.forEach(childSnapshot => {
            // get channelID and see get the opposite users ID from the string
            let channelId = childSnapshot.key;
            const indexUnderscore = channelId.indexOf("_");
            const channelLength = channelId.length;
            const userLeft = channelId.substring(0, indexUnderscore);
            const userRight = channelId.substring(indexUnderscore + 1, channelLength);
            const oppositeUser = userLeft === currentUserID ? userRight : userLeft;
            const UNREAD_MESSAGES = FIREBASE_REF_UNREAD.child("Private")
              .child(channelId).child('users').child(currentUserID);
            UNREAD_MESSAGES.on("value", snapshot => {
              if (snapshot.val() === null) {
                // get number of messages in thread if haven't opened
                dispatch(unreadMessageCount(channelId, 0));
              }
              else {
                dispatch(unreadMessageCount(channelId, snapshot.val()));
              }
            });
            if (blockedChannels !== null) {
              if (typeof blockedChannels[oppositeUser] === "undefined") {
                privateChannelsToDownload.push(channelId);
              }
            }
            else {
              privateChannelsToDownload.push(channelId);
            }
          });
          dispatch(downloadChannels(privateChannelsToDownload));
        });
    }
  }
  
  const downloadChannels = (privateChannelsDownloaded) => {
    return async dispatch => {
      let currentUserID = firebaseService.auth().currentUser.uid;
      const channelDataPromises = privateChannelsDownloaded.map(
        async channelId_1 => {
          // find the opposite user- the user that is not the current user
          // need this for the profile picture and channel name
          const indexUnderscore_1 = channelId_1.indexOf("_");
          const channelLength_1 = channelId_1.length;
          const userLeft_1 = channelId_1.substring(0, indexUnderscore_1);
          const userRight_1 = channelId_1.substring(
            indexUnderscore_1 + 1,
            channelLength_1
          );
          const oppositeUser_1 =
            userLeft_1 === currentUserID ? userRight_1 : userLeft_1;
  
          let oppositeUserValue;
  
          // get user information to display
          const snapshot_1 = await FIREBASE_REF_USERS.child(`${oppositeUser_1}`)
            .child("meta")
            .once("value");
          oppositeUserValue = snapshot_1.val();
          let currentUserChannelInfoRef = FIREBASE_REF_CHANNEL_INFO.child("Private").child(`${channelId_1}`);
          const channelInfoChildSnapshot = await currentUserChannelInfoRef.once("value");
          let channelInfo = channelInfoChildSnapshot.val();
          return{
            id: channelId_1,
            info: channelInfo,
            users: {
              id: oppositeUser_1,
              profilePicture: oppositeUserValue.profilePicture,
              username: oppositeUserValue.username
            }
          };
          })
          
      Promise.all(channelDataPromises).then(
        data => dispatch(loadChannels(data))
      )
    }
  }
  
  
  const loadChannels = data => {
    
    return dispatch => {
      // alert(data)
    const sortedByDate = data
      .filter(item => item.info !== null)
      .sort((a, b) => b.info.timestamp - a.info.timestamp);
    // send private channels to redux store
    return dispatch(loadPrivateChannelsSuccess(sortedByDate));
    }
  }

  const loadPrivateChannelsSuccess = channels => ({
    type: types.LOAD_PRIVATE_CHANNELS_SUCCESS,
    privateChannels: channels
  });
  