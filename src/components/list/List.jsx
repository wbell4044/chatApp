import './list.css';
import UserInfo from './userInfo/UserInfo';
import ChatList from './chatList/ChatList';
import GroupChatInfo from './groupChat/GroupChatInfo'; 

const List = () => {
  return (
    <div className="list">
      <UserInfo />
      <ChatList />      
      <GroupChatInfo />
    </div>
  );
};

export default List;