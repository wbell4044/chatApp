import React, { useState, useEffect, useRef } from 'react';
import { useGroupChatStore } from '../../lib/GroupChatStore';
import { getAuth } from 'firebase/auth';
import { formatDistanceToNow, format } from 'date-fns';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../lib/firebase';
import { toast } from 'react-toastify';
import upload from '../../lib/upload'; // Reusing the upload function you use for user avatars
import { generateGroupKey, encryptWithGroupKey, decryptWithGroupKey } from '../../lib/Encryption'; // Import encryption functions
import './chat.css';

const GroupChat = () => {
  const [messageText, setMessageText] = useState('');
  const [file, setFile] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const { currentGroupChat, currentUser, fetchCurrentUser, addMessage, listenForMessages, updateMessages, updateGroupAvatar } = useGroupChatStore();
  const user = getAuth().currentUser;
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (user) {
      fetchCurrentUser(user);
    }
  }, [user, fetchCurrentUser]);

  useEffect(() => {
    if (currentGroupChat?.id) {
      const unsubscribe = listenForMessages(currentGroupChat.id, (messages) => {
        updateMessages(messages);
      });
      return () => unsubscribe();
    }
  }, [currentGroupChat?.id, listenForMessages, updateMessages]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [currentGroupChat?.messages]);

  const handleSendMessage = async () => {
    if (messageText.trim() && currentUser && currentGroupChat?.id) {
      setIsSending(true);
      let fileUrl = null;

      if (file) {
        const fileRef = ref(storage, `messages/${currentGroupChat.id}/${file.name}`);
        const snapshot = await uploadBytes(fileRef, file);
        fileUrl = await getDownloadURL(snapshot.ref); 
      }

      // Generate group key based on groupId and createdAt timestamp
      const groupKey = generateGroupKey(currentGroupChat.id, currentGroupChat.createdAt);

      // Encrypt the message text using the group key
      const encryptedText = encryptWithGroupKey(messageText, groupKey);

      const message = {
        text: encryptedText, // Store the encrypted message
        senderId: currentUser.id,
        senderName: currentUser.username,
        createdAt: new Date().getTime(), 
        file: fileUrl,  
      };

      try {
        await addMessage(currentGroupChat.id, message); 
        setMessageText('');
        setFile(null);
      } catch (error) {
        console.error('Error sending message:', error);
      } finally {
        setIsSending(false);
      }
    }
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const timeAgo = (timestamp) => {
    if (timestamp && !isNaN(timestamp)) {
      const date = new Date(timestamp); 
      return formatDistanceToNow(date, { addSuffix: true });
    } else {
      return 'Unknown time'; 
    }
  };

  const formatDate = (timestamp) => {
    if (timestamp && timestamp.seconds) {
      const date = new Date(timestamp.seconds * 1000); 
      return format(date, 'MM/dd/yyyy');
    }    
    return 'Invalid Date';
  };

  const toggleGroupInfo = () => {
    setShowGroupInfo((prevState) => !prevState); 
  };

  // New function for updating group avatar
  const handleUpdateGroupAvatar = async () => {
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "image/*"; // Restrict file type to images

    fileInput.onchange = async (e) => {
      const selectedFile = e.target.files[0];
      if (selectedFile) {
        setIsUploadingAvatar(true);

        // Reusing the upload method from the user profile update
        try {
          const imgUrl = await upload(selectedFile); // Assuming upload handles the file upload logic and returns the URL

          // After successful upload, update the group's avatar in Firestore
          await updateGroupAvatar(currentGroupChat.id, imgUrl); // You need to implement this function in your store

          toast.success('Group avatar updated successfully!');
        } catch (error) {
          toast.error('Error uploading group avatar');
          console.error(error);
        } finally {
          setIsUploadingAvatar(false);
        }
      }
    };

    fileInput.click(); // Programmatically trigger the file selection
  };

  const decryptMessage = (encryptedText) => {
    // Generate group key for decryption
    const groupKey = generateGroupKey(currentGroupChat.id, currentGroupChat.createdAt);
    return decryptWithGroupKey(encryptedText, groupKey);
  };

  if (!currentGroupChat) {
    return <div>Loading...</div>;
  }

  return (
    <div className="chat">
      <div className="top">
        <div className="user">
          <img src={currentGroupChat?.groupAvatar || './avatar.png'} alt={currentGroupChat?.groupName} />
          <div className="texts">
            <span>{currentGroupChat?.groupName || 'Unknown Group'}</span>
          </div>
        </div>
        <div className="icons">
          <img src="./info.png" alt="Info" onClick={toggleGroupInfo} /> 
        </div>
      </div>

      {/* Group Info Modal */}
      {showGroupInfo && (
        <div className="group-info-modal">
          <div className="modal-content">
            <button className="close-btn" onClick={toggleGroupInfo}>X</button>
            <div className="group-info">
              <img src={currentGroupChat?.groupAvatar || './avatar.png'} alt={currentGroupChat?.groupName} />
              <h3>Group Name: {currentGroupChat?.groupName || 'Unknown Group'}</h3>
              <p><strong>Creator:</strong> {currentGroupChat?.creator || 'Unknown'}</p>
              <p><strong>Created At:</strong> {formatDate(currentGroupChat?.createdAt)}</p>
              <p><strong>Members:</strong> {currentGroupChat?.members?.join(', ')}</p>
              
              {/* Update Group Avatar Button */}
              <div className="group-info-buttons">
                <button 
                  className="update-avatar-btn" 
                  onClick={handleUpdateGroupAvatar}
                  disabled={isUploadingAvatar} 
                >
                  {isUploadingAvatar ? 'Uploading Avatar...' : 'Update Group Avatar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="center">
        {currentGroupChat?.messages && currentGroupChat.messages.length > 0 ? (
          currentGroupChat.messages.map((message, index) => (
            <div
              key={index}
              className={`message ${message.senderId === currentUser?.id ? 'own' : ''}`}
            >
              <img src={message.senderAvatar || './avatar.png'} alt={message.senderName} />
              <div className="texts">
                <strong>{message.senderName}</strong>
                {/* Decrypt message before displaying */}
                <p>{decryptMessage(message.text)}</p>
                <span className="timeAgo">{timeAgo(message.createdAt)}</span> 
              </div>
              {message.file && <img src={message.file} alt="Attachment" className="message-file" />}
            </div>
          ))
        ) : (
          <p>No messages yet...</p>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="bottom">
        <div className="icons">
          <label htmlFor="file">
            <img src="./img.png" alt="Attach" />
          </label>
          <input type="file" id="file" style={{ display: 'none' }} onChange={handleFileChange} />
          <img src="./camera.png" alt="Camera" />
          <img src="./mic.png" alt="Microphone" />
        </div>
        <input
          type="text"
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          placeholder="Type a message"
        />
        <button
          className="sendButtom"
          onClick={handleSendMessage}
          disabled={isSending || !messageText.trim()}
        >
          {isSending ? 'Sending...' : 'Send'}
        </button>
      </div>
    </div>
  );
};

export default GroupChat;
