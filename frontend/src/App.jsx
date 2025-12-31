import { SocketProvider } from './context/SocketContext';
import ChatPage from './pages/ChatPage';

/**
 * App Component
 * Root component with Socket.IO context provider
 */
function App() {
  return (
    <SocketProvider>
      <ChatPage />
    </SocketProvider>
  );
}

export default App;

