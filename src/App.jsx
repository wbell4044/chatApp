import { useEffect } from "react";
import { BrowserRouter as Router } from "react-router-dom";  
import Chat from "./components/chat/Chat";
import GroupChat from "./components/chat/GroupChat"; 
import Detail from "./components/detail/Detail";
import List from "./components/list/List";
import Login from "./components/login/Login";
import Notification from "./components/notification/Notification";
import { useUserStore } from "./lib/userStore";
import { useGroupChatStore } from "./lib/GroupChatStore"; 

const App = () => {
  const { initAuthListener, isLoading, currentUser } = useUserStore(); 
  const { isInGroupChat } = useGroupChatStore(); 
  
  useEffect(() => {
    initAuthListener(); 
  }, [initAuthListener]);

  
  if (isLoading) {
    return <div className="loading">Loading...</div>; 
  }

  return (
    <Router> 
      <div className="container">
        {currentUser ? (
          <>
            <List />            
            {isInGroupChat ? (
              <GroupChat />
            ) : (
              <Chat />  
            )}
            <Detail />
          </>
        ) : (
          <Login />
        )}
        <Notification />
      </div>
    </Router>  
  );
};

export default App;