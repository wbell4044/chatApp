import { useChatStore } from '../../lib/chatStore';
import { auth } from '../../lib/firebase';
import './detail.css';
import { useUserStore } from '../../lib/userStore';
import { useEffect, useState } from 'react';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove, deleteField } from 'firebase/firestore';  
import { db } from '../../lib/firebase';
import Notification from '../notification/Notification'; // Import Notification component
import { toast } from 'react-toastify'; // Import toast from react-toastify


const Detail = () => {
  const { chatId, user, isCurrentUserBlocked, isReceiverBlocked, changeBlock, messages } = useChatStore();
  const { currentUser } = useUserStore();

  const [imageUrls, setImageUrls] = useState([]);  
  const [isSharedPhotosOpen, setIsSharedPhotosOpen] = useState(false);  // State for dropdown visibility
  const [isChatSettingsOpen, setIsChatSettingsOpen] = useState(false);  // State for "Chat Settings" dropdown visibility
  const [backgroundImage, setBackgroundImage] = useState('/bg7.jpeg'); // Default background image
  const [isBackgroundImageModalOpen, setIsBackgroundImageModalOpen] = useState(false); // State for background image modal visibility
  const [isClearChatConfirmOpen, setIsClearChatConfirmOpen] = useState(false); // State for clear chat confirmation modal
  const [selectedLanguage, setSelectedLanguage] = useState('English'); // State to track selected language

  useEffect(() => {
    // Update the body background when backgroundImage changes
    document.body.style.backgroundImage = `url(${backgroundImage})`;
    document.body.style.backgroundSize = 'cover';
    document.body.style.backgroundPosition = 'center';
    document.body.style.backgroundRepeat = 'no-repeat';
  }, [backgroundImage]); // Re-run when backgroundImage changes

  useEffect(() => {
    if (chatId) {
      const fetchChatMessages = async () => {
        try {          
          const chatDocRef = doc(db, "chats", chatId);
          const chatDoc = await getDoc(chatDocRef);
          if (chatDoc.exists()) {
            const chatData = chatDoc.data();
            const chatMessages = chatData.messages || [];            
            const photos = chatMessages.filter(message => message.img).map(message => message.img);            
            setImageUrls(photos);
          }
        } catch (error) {
          console.error("Error fetching chat messages: ", error);
        }
      };
      fetchChatMessages();
    }
  }, [chatId]);

  const handleBlock = async () => {
    if (!user) return;
    const userDocRef = doc(db, "users", currentUser.id);
    try {
      await updateDoc(userDocRef, {
        blocked: isReceiverBlocked ? arrayRemove(user.id) : arrayUnion(user.id),
      });
      changeBlock();
    } catch (err) {
      console.log("Error blocking user:", err);
    }
  };

  const clearChatHistory = async () => {
    if (!chatId) return;
    const chatDocRef = doc(db, "chats", chatId);
    try {      
      await updateDoc(chatDocRef, {
        messages: deleteField(), 
      });
      console.log("Chat history cleared");
      setIsClearChatConfirmOpen(false); 
    } catch (error) {
      console.error("Error clearing chat history: ", error);
    }
  };

  const toggleSharedPhotos = () => {
    setIsSharedPhotosOpen(prevState => !prevState);
  };
  const toggleChatSettings = () => {
    setIsChatSettingsOpen(prevState => !prevState);
  };
  const openBackgroundImageModal = () => {
    setIsBackgroundImageModalOpen(true);
  };

  const handleBackgroundImageSelect = (imgName) => {
    const imageUrl = `/${imgName}`; // Directly reference the public folder path
    setBackgroundImage(imageUrl); // Update the backgroundImage state
    setIsBackgroundImageModalOpen(false); // Close the modal after selection
  };

  const handleLanguageChange = (event) => {
    setSelectedLanguage(event.target.value);
    toast.success(`Language has been changed to ${event.target.value}.`, {      
      autoClose: 3000, // Auto-close after 3 seconds
    });
  };

  return (
    <div className='detail'>
      <div className="user">
        <img src={user?.avatar || "./avatar.png"} alt="User Avatar" />
        <h2>{user?.username}</h2>
      </div>
      <div className="messages">
        {messages.map((message, index) => (
          <div key={index} className="message">
            <p>{message.text}</p>
          </div>
        ))}
      </div>
      <div className="info">
        <div className="option">
          <div className="title" onClick={toggleChatSettings}>
            <span>Chat Settings</span>
            <img src={isChatSettingsOpen ? "./arrowUp.png" : "./arrowDown.png"} alt="Arrow Icon" />
          </div>
          {isChatSettingsOpen && (
            <div className="chat-settings-dropdown">
              <div className="chat-setting-option" onClick={openBackgroundImageModal}>
                Change Background Image
              </div>
              <div className="chat-setting-option">
                Select Language
                <select value={selectedLanguage} onChange={handleLanguageChange}>
                  <option value="English">English</option>
                  <option value="Spanish">Spanish</option>
                  <option value="French">French</option>
                  <option value="German">German</option>                  
                </select>
              </div>
              <div className="chat-setting-option" onClick={() => setIsClearChatConfirmOpen(true)}>
                Clear Chat History
              </div>
            </div>
          )}
        </div>
        
        {isClearChatConfirmOpen && (
          <div className="confirmation-modal">
            <div className="modal-content">
              <h3>Are you sure you want to delete all chat history?</h3>
              <p className="warning-text">Warning: This action is not reversible.</p>
              <div className="modal-buttons">
                <button onClick={clearChatHistory}>Confirm</button>
                <button onClick={() => setIsClearChatConfirmOpen(false)}>Cancel</button>
              </div>
            </div>
          </div>        
        )}
        
        {isBackgroundImageModalOpen && (
          <div className="background-image-modal">
            <h3>Select a Background Image</h3>
            <div className="image-list">
              {['bg1.jpeg', 'bg3.jpeg', 'bg5.jpeg', 'bg6.jpeg', 'bg7.jpeg','bg2.jpeg', 'bg4.png', 'bg8.jpg', 'bg9.png', 'bg10.jpg', 'bg11.jpg', 'bg12.jpg'].map((image, index) => (
                <div key={index} className="image-item" onClick={() => handleBackgroundImageSelect(image)}>
                  <img src={`/${image}`} alt={image} className="image-thumbnail" />
                  <p>{image}</p> 
                </div>
              ))}
            </div>
            <button onClick={() => setIsBackgroundImageModalOpen(false)}>Close</button>
          </div>
        )}
        <div className="option">
          <div className="title">
            <span>Privacy & help</span>
            <img src="./arrowDown.png" alt="Arrow Icon" />
          </div>
        </div>
        <div className="option">
          <div className="title" onClick={toggleSharedPhotos}>
            <span>Shared photos</span>
            <img src={isSharedPhotosOpen ? "./arrowUp.png" : "./arrowDown.png"} alt="Arrow Icon" />
          </div>
          {isSharedPhotosOpen && (
            <div className="shared-photos">
              {imageUrls.length > 0 ? (
                imageUrls.map((imgUrl, index) => (
                  <div key={index} className="photoItem" onClick={() => handleImageClick(imgUrl)}>
                    <img src={imgUrl} alt={`shared-photo-${index}`} className="shared-photo" />
                  </div>
                ))
              ) : (
                <p>No shared photos</p>
              )}
            </div>
          )}
        </div>
        <div className="option">
          <div className="title">
            <span>Shared files</span>
            <img src="./arrowDown.png" alt="Arrow Icon" />
          </div>
        </div>
        <button onClick={handleBlock}>
          {
            isCurrentUserBlocked ? "You are blocked" :
              isReceiverBlocked ? "User blocked" : "Block User"
          }
        </button>
        <button className="logout" onClick={() => auth.signOut()}>Logout</button>
      </div>      

      <Notification /> {/* Toast container to display the toast notifications */}
    </div>
  );
};

export default Detail;