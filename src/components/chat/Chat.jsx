import './chat.css';
import { useEffect, useRef, useState } from 'react';
import EmojiPicker from 'emoji-picker-react';
import { arrayUnion, doc, getDoc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import upload from '../../lib/upload';
import { useChatStore } from '../../lib/chatStore';
import { useUserStore } from '../../lib/userStore';
import { format } from 'date-fns';
import { generateKey1, generateKey2, encryptWithKey1, encryptWithKey2, decryptWithKey1, decryptWithKey2 } from '../../lib/Encryption'; // Import encryption functions

const Chat = () => {
  const [chat, setChat] = useState(null);
  const [openEmoji, setOpenEmoji] = useState(false);
  const [text, setText] = useState("");
  const [img, setImg] = useState({ file: null, url: "" });
  const [userStatus, setUserStatus] = useState('connecting');
  const [showUserInfo, setShowUserInfo] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [userLastSeen, setUserLastSeen] = useState('');
  const [isBlocked, setIsBlocked] = useState(false);
  const { currentUser } = useUserStore();
  const { chatId, user, isCurrentUserBlocked, isReceiverBlocked } = useChatStore();
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat]);

  useEffect(() => {
    if (chatId) {
      const unSub = onSnapshot(
        doc(db, "chats", chatId),
        (res) => {
          setChat(res.data());
        }
      );
      return () => {
        unSub();
      };
    }
  }, [chatId]);

  useEffect(() => {
    if (user?.id) {
      const userRef = doc(db, "users", user.id);
      const unSub = onSnapshot(userRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          const newStatus = data?.status || 'offline';

          if (newStatus !== userStatus) {
            setUserStatus(newStatus);
            setUserEmail(data?.email || 'No email available');
            setUserLastSeen(data?.lastSeen || 'N/A');
          }
        }
      });

      return () => unSub();
    }
  }, [user?.id]);

  const handleEmoji = (e) => {
    setText((prev) => prev + e.emoji);
    setOpenEmoji(false);
  };

  const handleImg = (e) => {
    const file = e.target.files[0];
    if (file) {
      const fileType = file.type;
      if (
        fileType === "image/jpeg" ||
        fileType === "image/png" ||
        fileType === "image/gif"
      ) {
        setImg({
          file: file,
          url: URL.createObjectURL(file),
        });
      } else {
        alert("Please upload an image file (jpg, jpeg, png, gif).");
        e.target.value = "";
      }
    }
  };

  const handleSend = async () => {
    if (text === "") return;

    // Generate encryption keys
    const key1 = generateKey1(currentUser.id, user.id);    
    let encryptedTextKey1 = encryptWithKey1(text, key1);

    let imgUrl = null;
    try {
      if (img.file) {
        imgUrl = await upload(img.file);
      }

      if (currentUser && chatId) {
        await updateDoc(doc(db, "chats", chatId), {
          messages: arrayUnion({
            senderId: currentUser.id,
            text: encryptedTextKey1,            
            createdAt: Date.now(),
            ...(imgUrl && { img: imgUrl }),
          }),
        });

        const userIDs = [currentUser.id, user.id];
        userIDs.forEach(async (id) => {
          const userChatRef = doc(db, "userchats", id);
          const userChatsSnapShot = await getDoc(userChatRef);
          if (userChatsSnapShot.exists()) {
            const userChatsData = userChatsSnapShot.data();
            const chatIndex = userChatsData.chats.findIndex(c => c.chatId === chatId);             
            userChatsData.chats[chatIndex].lastMessage = text.slice(0, 30);
            userChatsData.chats[chatIndex].isSeen = id === currentUser.id ? true : false;
            userChatsData.chats[chatIndex].updatedAt = Date.now();
            await updateDoc(userChatRef, {
              chats: userChatsData.chats,
            });
          }
        });
      }
    } catch (err) {
      console.log(err);
    }

    setImg({
      file: null,
      url: "",
    });
    setText("");
  };

  const handleInfoClick = () => {
    setShowUserInfo((prev) => !prev);
  };

  return user ? (
    <div className='chat'>
      <div className="top">
        <div className="user">
          <img src={user?.avatar || "./avatar.png"} alt="" />
          <div className="texts">
            <span>{user?.username}</span>
            <p className={userStatus === "online" ? "status online" : userStatus === "offline" ? "status offline" : "status connecting"}>
              {userStatus === "online" ? "Online" : userStatus === "offline" ? "Offline" : "Connecting..."}
            </p>
          </div>
        </div>
        <div className="icons">
          <img src="./info.png" alt="" onClick={handleInfoClick} />
        </div>
      </div>

      {showUserInfo && (
        <div className="user-info-modal">
          <div className="modal-content">
            <button className="close-btn" onClick={handleInfoClick}>X</button>
            <div className="user-info">
              <img src={user?.avatar || './avatar.png'} alt="User Avatar" />
              <h3>Name: {user?.username}</h3>
              <p>Email: {userEmail}</p>
              <p>Status: {userStatus}</p>
              <p>Last Seen: {userLastSeen}</p>
              <p>Blocked: {isBlocked ? 'Yes' : 'No'}</p>
              <p>Bio: {user?.bio || 'No bio available'}</p>
            </div>
          </div>
        </div>
      )}

      <div className="center">
        {chat?.messages?.map((message) => {          
          const key1 = generateKey1(currentUser.id, user.id);
          const key2 = generateKey2(user.id, currentUser.id);
          let decryptedMessage;
          if (message.senderId === currentUser?.id) {            
            decryptedMessage = decryptWithKey1(message.text, key1);
          } else {            
            decryptedMessage = decryptWithKey2(message.text, key2);
          }

          return (
            <div className={message.senderId === currentUser?.id ? "message own" : "message"} key={message.createdAt}>
              <div className="message-content">
                <img src={user?.avatar || "./avatar.png"} className='user-avatar' alt="" />
                <span className="time">
                  {format(new Date(message.createdAt), 'HH:mm')}
                </span>
              </div>
              <div className="texts">
                {message.img && <img src={message.img} alt="" />}
                <p>{decryptedMessage}</p> 
              </div>
            </div>
          );
        })}
        {img?.url && (
          <div className="message own">
            <div className="texts">
              <img src={img.url} alt="" />
            </div>
          </div>
        )}
        <div ref={endRef}></div>
      </div>

      <div className="bottom">
        <div className="icons">
          <label htmlFor="file">
            <img src="./img.png" alt="" />
          </label>
          <input
            type="file"
            id="file"
            style={{ display: 'none' }}
            onChange={handleImg}
            accept=".jpg,.jpeg,.png,.gif"
          />
          <img src="./camera.png" alt="" />
          <img src="./mic.png" alt="" />
        </div>
        <input
          type="text"
          placeholder={(isCurrentUserBlocked || isReceiverBlocked) ? "You cannot send a message" : "Type a message..."}
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={isCurrentUserBlocked || isReceiverBlocked}
        />
        <div className="emoji">
          <img src="./emoji.png" alt="" onClick={() => setOpenEmoji((prev) => !prev)} />
          <div className="picker">
            <EmojiPicker open={openEmoji} onEmojiClick={handleEmoji} width={"300px"} height={"400px"} />
          </div>
        </div>
        <button className="sendButtom" onClick={handleSend} disabled={isCurrentUserBlocked || isReceiverBlocked}>Send</button>
      </div>
    </div>
  ) : <div className="chat-welcome">
    <img src="../../chat.jpeg" alt="" />
    <h1>Welcome to Chat</h1>
    <p>Select a chat to start messaging</p>
  </div>;
};

export default Chat;