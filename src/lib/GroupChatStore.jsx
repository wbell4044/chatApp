import { create } from "zustand";
import { db } from "./firebase";
import { doc, getDoc, updateDoc, deleteDoc, onSnapshot } from "firebase/firestore";
import { useUserStore } from "./userStore";

const useGroupChatStore = create((set, get) => ({
  currentGroupChat: null,
  currentUser: null,
  isInGroupChat: false,

  fetchCurrentUser: async (user) => {
    if (user) {
      const fetchUserInfo = useUserStore.getState().fetchUserInfo;
      await fetchUserInfo(user.uid);

      const currentUser = useUserStore.getState().currentUser;
      set({
        currentUser: currentUser,
      });
    }
  },

  changeGroupChat: async (groupId) => {
    try {
      if (!groupId) {
        console.error("Invalid groupId provided");
        return;
      }
      const groupRef = doc(db, "groups", groupId);
      const groupDoc = await getDoc(groupRef);

      if (!groupDoc.exists()) {
        console.error("Group not found");
        return;
      }
      const group = groupDoc.data();

      if (!group || !group.members) {
        console.error("Group data is incomplete or malformed");
        return;
      }

      const isInGroup = group.members.includes(get().currentUser.username);

      set({
        currentGroupChat: {
          id: groupId,
          groupName: group.groupname,
          creator: group.creator || 'Unknown',
          createdAt: group.createdAt || null,
          groupAvatar: group.groupAvatar || './avatar.png',
          members: group.members,
          memberIds: group.memberIds,
          messages: group.messages || [],
        },

        isInGroupChat: isInGroup,
      });
    } catch (error) {
      console.error("Error in changeGroupChat:", error);
    }
  },

  // Add a new message to the group chat
  addMessage: async (groupId, message) => {
    try {
      const groupRef = doc(db, "groups", groupId);

      if (message.senderId && message.senderName) {
        // Fetch sender's details from the 'users' collection using senderId
        const senderRef = doc(db, "users", message.senderId);
        const senderDoc = await getDoc(senderRef);

        if (!senderDoc.exists()) {
          console.error("Sender not found in users collection.");
          return;
        }

        const senderData = senderDoc.data();
        const senderAvatar = senderData.avatar || './default-avatar.png';
        const senderUsername = senderData.username || 'Unknown User';

        // Create a new message object with sender's details (including avatar)
        const newMessage = {
          text: message.text,
          senderId: message.senderId,
          senderName: message.senderName,
          senderAvatar: senderAvatar,
          senderUsername: senderUsername,
          createdAt: new Date().getTime(),
          file: message.file || null,
        };

        const groupDoc = await getDoc(groupRef);
        const groupData = groupDoc.data();
        const currentMessages = groupData?.messages || [];

        const updatedMessages = [...currentMessages, newMessage];
        await updateDoc(groupRef, {
          messages: updatedMessages, // Set the updated messages array
        });

        const currentGroupChat = get().currentGroupChat;
        if (currentGroupChat) {
          set({
            currentGroupChat: {
              ...currentGroupChat,
              messages: updatedMessages,
            },
          });
        }
      } else {
        console.error("Invalid message data: senderId or senderName is missing.");
      }
    } catch (error) {
      console.error("Error adding message:", error);
    }
  },

  // Listen for real-time updates for messages in the group chat
  listenForMessages: (groupId, callback) => {
    try {
      const groupRef = doc(db, "groups", groupId);
      const unsubscribe = onSnapshot(groupRef, (docSnap) => {
        const groupData = docSnap.data();
        const messages = groupData?.messages || [];
        callback(messages); // Return messages in ascending order
      });
      return unsubscribe;
    } catch (error) {
      console.error("Error listening for messages:", error);
    }
  },

  updateMessages: (newMessages) => {
    const currentGroupChat = get().currentGroupChat;
    if (currentGroupChat) {
      set({
        currentGroupChat: {
          ...currentGroupChat,
          messages: newMessages,
        },
      });
    }
  },

  handleGroupMembership: async (groupId, isJoining) => {
    try {
      const groupRef = doc(db, "groups", groupId);
      const groupDoc = await getDoc(groupRef);
      if (!groupDoc.exists()) {
        console.error("Group does not exist");
        return;
      }

      const group = groupDoc.data();
      let updatedMembers = group.members;
      let updatedMemberIds = group.memberIds;

      if (isJoining) {
        updatedMembers.push(get().currentUser.username);
        updatedMemberIds.push(get().currentUser.id);
      } else {
        updatedMembers = updatedMembers.filter((member) => member !== get().currentUser.username);
        updatedMemberIds = updatedMemberIds.filter((id) => id !== get().currentUser.id);

        if (updatedMembers.length === 0) {
          await deleteDoc(groupRef);
          console.log("Group deleted as it has no members left");
        }
      }
      await updateDoc(groupRef, {
        members: updatedMembers,
        memberIds: updatedMemberIds,
      });
      set({
        currentGroupChat: {
          ...get().currentGroupChat,
          members: updatedMembers,
          memberIds: updatedMemberIds,
        },
      });
      console.log(isJoining ? "Joined group successfully!" : "Left group successfully!");
    } catch (error) {
      console.error("Error with group membership:", error);
    }
  },

  // New method for updating the group avatar
  updateGroupAvatar: async (groupId, avatarUrl) => {
    try {
      const groupRef = doc(db, "groups", groupId);
      await updateDoc(groupRef, {
        groupAvatar: avatarUrl, // Update the group avatar URL
      });

      const currentGroupChat = get().currentGroupChat;
      if (currentGroupChat) {
        set({
          currentGroupChat: {
            ...currentGroupChat,
            groupAvatar: avatarUrl, // Update the state to reflect the change
          },
        });
      }

      console.log("Group avatar updated successfully!");
    } catch (error) {
      console.error("Error updating group avatar:", error);
    }
  },

  setInGroupChat: (status) => {
    set({
      isInGroupChat: status,
    });
  },
}));

export { useGroupChatStore };