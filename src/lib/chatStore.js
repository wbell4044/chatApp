import { create } from 'zustand';
import { useUserStore } from './userStore';
import { collection, doc, setDoc, updateDoc, query, orderBy, onSnapshot, getDoc } from "firebase/firestore";
import { db } from './firebase';

export const useChatStore = create((set) => ({
  chatId: null,
  user: null,
  isCurrentUserBlocked: false,
  isReceiverBlocked: false,
  messages: [],
  unsubscribe: null, // For cleaning up listeners
  
  changeChat: (chatId, user) => {
    const currentUser = useUserStore.getState().currentUser;    
    const prevUnsubscribe = useChatStore.getState().unsubscribe;
    if (prevUnsubscribe) prevUnsubscribe();

    if (user.blocked.includes(currentUser.id)) {
      return set({
        chatId,
        user: null,
        isCurrentUserBlocked: true,
        isReceiverBlocked: false,
        messages: [],
        unsubscribe: null
      });
    } 
    else if (currentUser.blocked.includes(user.id)) {
      return set({
        chatId,
        user,
        isCurrentUserBlocked: false,
        isReceiverBlocked: true,
        messages: [],
        unsubscribe: null
      });
    } 
    else {
      set({
        chatId,
        user,
        isCurrentUserBlocked: false,
        isReceiverBlocked: false,
        messages: [],
      });
      // Fetch Messages with Real-time Updates
      useChatStore.getState().getMessages(chatId);
    }
  },
  
  changeBlock: () => {
    set((state) => ({
      ...state,
      isReceiverBlocked: !state.isReceiverBlocked
    }));
  },
  // Function to get messages with real-time updates
  getMessages: (chatId) => {
    if (!chatId) return;
    const messagesRef = collection(db, "chats", chatId, "messages");
    const q = query(messagesRef, orderBy("createdAt", "asc"));
    const unSub = onSnapshot(q, (snapshot) => {
      const messages = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        isHighlighted: false, 
      }));
      set({ messages });
    }, (error) => {
      console.error("Error getting messages: ", error);
      set({ messages: [] });
    });
    set({ unsubscribe: unSub });
  },

  // Function to toggle message highlight
  toggleHighlight: (messageId) => {
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.id === messageId ? { ...msg, isHighlighted: !msg.isHighlighted } : msg
      )
    }));
  },

  // Function to create a new chat between users
  createChat: async (receiverId) => {
    const currentUser = useUserStore.getState().currentUser;
    if (!currentUser || !receiverId) return;
    
    const chatRef = doc(db, "chats", `${currentUser.id}_${receiverId}`);
    const chatDocSnap = await getDoc(chatRef);
    if (chatDocSnap.exists()) {
      // If chat exists, simply return and don’t create a new one
      return;
    }
    // Create a new chat document
    try {
      const newChatId = `${currentUser.id}_${receiverId}`;  // Combine user ids to form unique chatId

      // Create chat data object
      const chatData = {
        chatId: newChatId,
        users: [currentUser.id, receiverId],
        lastMessage: "",  
        updatedAt: Date.now(),  
      };

      // Create chat document in Firestore
      await setDoc(chatRef, chatData);
      // Create user chats data for both users
      const currentUserChatRef = doc(db, "userchats", currentUser.id);
      await updateDoc(currentUserChatRef, {
        chats: arrayUnion({
          chatId: newChatId,
          lastMessage: "",
          receiverId,
          senderId: currentUser.id,
          status: "online", 
          lastSeen: null, 
          updatedAt: Date.now()
        })
      });
      const receiverUserChatRef = doc(db, "userchats", receiverId);
      await updateDoc(receiverUserChatRef, {
        chats: arrayUnion({
          chatId: newChatId,
          lastMessage: "",
          receiverId: currentUser.id,
          senderId: receiverId,
          status: "online", 
          lastSeen: null, 
          updatedAt: Date.now()
        })
      });      
    } catch (error) {
      console.error("Error creating chat:", error);
    }
  },
}));