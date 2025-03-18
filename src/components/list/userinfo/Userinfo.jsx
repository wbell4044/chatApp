import React, { useState } from 'react';
import { useUserStore } from '../../../lib/userStore';
import { signOut } from 'firebase/auth'; 
import { useNavigate } from 'react-router-dom'; 
import ProfileUpdate from '../../profileUpdate/ProfileUpdate'; 
import { auth, db } from '../../../lib/firebase'; 
import { doc, updateDoc } from 'firebase/firestore'; 
import './userInfo.css';

const UserInfo = () => {
  const { currentUser } = useUserStore();  
  const [isProfileUpdateVisible, setIsProfileUpdateVisible] = useState(false); 
  const navigate = useNavigate(); 
  
  const handleEditProfileClick = () => {
    setIsProfileUpdateVisible(true);
  };

  const handleCloseEditProfile = () => {
    setIsProfileUpdateVisible(false);
  };

  const handleLogout = async () => {
    try {      
      const userDocRef = doc(db, 'users', currentUser.id); 
      await updateDoc(userDocRef, {
        status: 'offline',  
      });      
      await signOut(auth);       
      navigate('/login');  
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <div className="userInfo">
      <div className="user">
        <img src={currentUser?.avatar || './avatar.png'} alt="User Avatar" />
        <h3>{currentUser?.username}</h3>
      </div>
      <div className="icons">
        <div className="menu">
          <img src="./more.png" alt="More Options" />
          <div className="sub-menu">            
            <p onClick={handleEditProfileClick}>Edit Profile</p>
            <hr />
            <p onClick={handleLogout}>Logout</p> 
          </div>
        </div>        
      </div>      
      {isProfileUpdateVisible && (
        <div className="profile-update-modal">
          <div className="modal-content">            
            <button className="close-btn" onClick={handleCloseEditProfile}>X</button>            
            <ProfileUpdate />
          </div>
        </div>
      )}
    </div>
  );
};

export default UserInfo;