import { useEffect, useState } from 'react';
import { useUserStore } from '../../../lib/userStore';
import { useChatStore } from '../../../lib/chatStore';
import { useGroupChatStore } from '../../../lib/GroupChatStore';
import { doc, getDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../../../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import './chatList.css';
import AddUser from './addUser/AddUser';

const ChatList = () => {
  const [chats, setChats] = useState([]);
  const [addMode, setAddMode] = useState(false);
  const [input, setInput] = useState("");
  const { currentUser } = useUserStore();
  const { chatId, changeChat } = useChatStore();
  const [statusUpdated, setStatusUpdated] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        if (!statusUpdated) {
          await updateUserStatus(user.uid, 'online');
          setStatusUpdated(true);
        }

        const userChatsRef = doc(db, 'userchats', user.uid);
        const unsubscribeChats = onSnapshot(userChatsRef, async (docSnap) => {
          if (docSnap.exists()) {
            const chatsData = docSnap.data().chats || [];

            const chatWithUserData = await Promise.all(
              chatsData.map(async (item) => {
                const userDocRef = doc(db, 'users', item.receiverId);
                const userDocSnap = await getDoc(userDocRef);
                const userData = userDocSnap.data();
                return { ...item, user: userData };
              })
            );

            setChats(chatWithUserData);
          } else {
            console.log("No chats found for user");
          }
        });

        return () => unsubscribeChats();
      } else {
        await updateUserStatus(user?.uid, 'offline');
      }
    });

    return () => unsubscribe();
  }, [statusUpdated]);

  const updateUserStatus = async (userId, status) => {
    if (!userId) return;
    try {
      const userDocRef = doc(db, 'users', userId);
      await updateDoc(userDocRef, {
        status: status,
        lastUpdated: new Date()
      });
      console.log(`User status updated to ${status}`);
    } catch (error) {
      console.error('Error updating user status:', error);
    }
  };

  const handleSelect = async (chat) => {
    if (!chat.user) {
      console.error("No user data found for this chat");
      return;
    }
    useGroupChatStore.getState().setInGroupChat(false); // Set isInGroupChat to false

    if (!currentUser || !currentUser.id) {
      console.error("Current user is not authenticated or missing ID");
      return;
    }

    const userChatsRef = doc(db, "userchats", currentUser.id);
    const updatedChats = chats.map(item => {
      const { user, ...rest } = item;
      return rest;
    });

    const chatIndex = updatedChats.findIndex(item => item.chatId === chat.chatId);
    if (chatIndex === -1) {
      console.error("Chat not found", chat);
      return;
    }
    updatedChats[chatIndex].isSeen = true;  // Mark the chat as seen
    try {
      await updateDoc(userChatsRef, { chats: updatedChats });
      changeChat(chat.chatId, chat.user);
    } catch (err) {
      console.error("Error updating user chats:", err);
    }
  };

  const filteredChats = chats.filter(c =>
    c.user?.username?.toLowerCase().includes(input.toLowerCase())
  );

  useEffect(() => {
    // Dynamically load the script and initialize the agent when the page loads
    if (typeof window !== "undefined" && !window.AgentInitialized) {
      const script = document.createElement("script");
      script.src = "https://cdn.jotfor.ms/s/umd/latest/for-embedded-agent.js";
      script.async = true;

      script.onload = () => {
        // Initialize the agent
        window.AgentInitializer.init({
          agentRenderURL: "https://eu.jotform.com/agent/0195a5af34527cd4b37d7e7121b33fdec855",
          rootId: "JotformAgent-0195a5af34527cd4b37d7e7121b33fdec855",
          formID: "0195a5af34527cd4b37d7e7121b33fdec855",
          queryParams: ["skipWelcome=1", "maximizable=1"],
          domain: "https://eu.jotform.com",
          isDraggable: false,
          background: "linear-gradient(180deg, #6C73A8 0%, #6C73A8 100%)",
          buttonBackgroundColor: "#0066C3",
          buttonIconColor: "#FFFFFF",
          variant: false,
          customizations: {
            greeting: "Yes",
            greetingMessage: "Hi! How can I assist you?",
            openByDefault: "No",
            pulse: "Yes",
            position: "left",
            autoOpenChatIn: "5000"  // 5 seconds delay before auto-opening chat
          },
          isVoice: undefined
        });

        window.AgentInitialized = true; // Prevent reinitialization if already initialized
      };

      document.body.appendChild(script);
    }
  }, []);

  return (
    <div className='chatlist'>
      <div className="search">
        <div className="searchBar">
          <img src="./search.png" alt="" />
          <input
            type="text"
            placeholder='Search'
            onChange={(e) => setInput(e.target.value)}
          />
        </div>
        <img
          src={addMode ? "./minus.png" : "./plus.png"}
          alt=""
          className='add'
          onClick={() => setAddMode((prev) => !prev)}
        />
      </div>

      {filteredChats.map((chat) => (
        <div
          key={chat.chatId}
          className="item"
          onClick={() => handleSelect(chat)}
          style={{ backgroundColor: chat?.isSeen ? "transparent" : "#5183fe" }}
        >
          <img
            src={chat.user?.blocked.includes(currentUser.id) ? "./avatar.png" : chat.user?.avatar || "./avatar.png"}
            alt=""
          />
          <div className="texts">
            <div className="username">
              <span>{chat.user?.blocked.includes(currentUser.id) ? "Blocked User!!" : chat.user?.username}</span>
              <p className={`status ${chat.user?.status === 'online' ? 'online' : 'offline'}`}>
                {chat.user?.status === 'online' ? 'Online' : 'Offline'}
              </p>
            </div>
            <p>{chat.lastMessage}</p>
          </div>
        </div>
      ))}

      {addMode && <AddUser setAddMode={setAddMode} />}

      {/* Add AI Agent container */}
      <div id="JotformAgent-0195a5af34527cd4b37d7e7121b33fdec855"></div>
    </div>
  );
};

export default ChatList;