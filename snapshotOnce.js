// get private chat channels
export const getUserPrivateChannels = () => {
    return dispatch => {
      // loading until channels are received
      dispatch(loadPrivateChannels());
      // current users
      let currentUserID = firebaseService.auth().currentUser.uid;
      // reference to blocked in firebase realtime database
      return getBlockedUsersList().then(blockedChannels => {
        // users current channels firebase ref
  
        let currentUserChannelsRef = FIREBASE_REF_USERS.child(`${currentUserID}`)
          .child("chats")
          .child("Private");
        return currentUserChannelsRef
          .orderByValue()
          .once("value")
          .then(snapshot => {
            // array to put private channels
            let privateChannelsToDownload = [];
            snapshot.forEach(childSnapshot => {
              // get channelID and see get the opposite users ID from the string
              let channelId = childSnapshot.key;
              const indexUnderscore = channelId.indexOf("_");
              const channelLength = channelId.length;
              const userLeft = channelId.substring(0, indexUnderscore);
              const userRight = channelId.substring(
                indexUnderscore + 1,
                channelLength
              );
              const oppositeUser =
                userLeft === currentUserID ? userRight : userLeft;
  
              const UNREAD_MESSAGES = FIREBASE_REF_UNREAD.child("Private")
                .child(channelId).child('users').child(currentUserID)
              UNREAD_MESSAGES.on("value", snapshot => {
                  if (snapshot.val() === null) {
                    // get number of messages in thread if haven't opened
                    dispatch(unreadMessageCount(channelId, 0));
                  } else {
                    dispatch(unreadMessageCount(channelId, snapshot.val()));
                  }
                }
                )
  
              if (blockedChannels !== null) {
                if (typeof blockedChannels[oppositeUser] === "undefined") {
                  privateChannelsToDownload.push(channelId);
                }
              } else {
                privateChannelsToDownload.push(channelId);
              }
            });
            return privateChannelsToDownload;
          })
          .then(privateChannelsDownloaded => {
            let channelDataPromises = privateChannelsDownloaded.map(
              channelId_1 => {
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
                return FIREBASE_REF_USERS.child(`${oppositeUser_1}`)
                  .child("meta")
                  .once("value")
                  .then(snapshot_1 => {
                    oppositeUserValue = snapshot_1.val();
  
                    let currentUserChannelInfoRef = FIREBASE_REF_CHANNEL_INFO.child(
                      "Private"
                    ).child(`${channelId_1}`);
                    return currentUserChannelInfoRef
                      .once("value")
                      .then(channelInfoChildSnapshot => {
                        let channelInfo = channelInfoChildSnapshot.val();
                        return {
                          id: channelId_1,
                          info: channelInfo,
                          users: {
                            id: oppositeUser_1,
                            profilePicture: oppositeUserValue.profilePicture,
                            username: oppositeUserValue.username
                          }
                        };
                      });
                  });
              }
            );
            return Promise.all(channelDataPromises);
          })
          .then(data => {
            const sortedByDate = data
              .filter(item => item.info !== null)
              .sort((a, b) => b.info.timestamp - a.info.timestamp);
            // send private channels to redux store
            return dispatch(loadPrivateChannelsSuccess(sortedByDate));
          })
          .catch(err => {
            // currentUserChannelsRef query failed or at least one channel download failed
            reportError(err);
            dispatch(loadPrivateChannelsError(err));
          });
      });
    };
  };  

const loadPrivateChannelsSuccess = channels => ({
    type: types.LOAD_PRIVATE_CHANNELS_SUCCESS,
    privateChannels: channels
  });
  
  const loadPrivateChannelsError = error => ({
    type: types.LOAD_PRIVATE_CHANNELS_ERROR,
    error
  });