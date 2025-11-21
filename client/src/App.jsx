import { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";

const socket = io("http://localhost:3001");

function App() {
  const [username, setUsername] = useState("");
  const [nameSet, setNameSet] = useState(false); // track if user clicked "Set Name"
  const [targetUser, setTargetUser] = useState("");
  const [users, setUsers] = useState([]);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const chatEndRef = useRef(null);

  // Set username only when button clicked
  const handleSetName = () => {
    if (!username.trim()) return;
    socket.emit("set_username", username.trim());
    setNameSet(true); // prevent changing username after setting
  };

  // Send private message
  const sendMessage = () => {
    if (!targetUser || !message.trim()) return;
    socket.emit("private_message", { to: targetUser, message: message.trim() });
    setMessages((prev) => [
      ...prev,
      { from: username, message: message.trim(), self: true },
    ]);
    setMessage("");
  };

  // Scroll to bottom automatically
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Listen for users list & messages
  useEffect(() => {
    socket.on("users_list", (list) => {
      if (!nameSet) return;
      setUsers(list.filter((u) => u !== username)); // exclude self
    });

    socket.on("receive_message", (data) => {
      setMessages((prev) => [
        ...prev,
        { from: data.from, message: data.message, self: false },
      ]);
    });

    // Cleanup listeners on unmount
    return () => {
      socket.off("users_list");
      socket.off("receive_message");
    };
  }, [nameSet, username]);

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        backgroundColor: "#f5f5f5",
      }}
    >
      {/* Sidebar */}
      <div
        style={{
          width: "250px",
          borderRight: "1px solid #ccc",
          backgroundColor: "#fff",
          padding: "20px",
          boxShadow: "2px 0 5px rgba(0,0,0,0.1)",
        }}
      >
        <h3 style={{ marginBottom: "10px" }}>Users</h3>

        {!nameSet ? (
          <>
            <input
              placeholder="Your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{
                width: "100%",
                padding: "8px",
                borderRadius: "5px",
                border: "1px solid #ccc",
                marginBottom: "10px",
              }}
            />
            <button
              onClick={handleSetName}
              style={{
                width: "100%",
                padding: "8px",
                border: "none",
                borderRadius: "5px",
                backgroundColor: "#4CAF50",
                color: "#fff",
                cursor: "pointer",
              }}
            >
              Set Name
            </button>
          </>
        ) : (
          <>
            <p>
              <b>You:</b> {username}
            </p>
            <select
              value={targetUser}
              onChange={(e) => setTargetUser(e.target.value)}
              style={{
                width: "100%",
                padding: "8px",
                borderRadius: "5px",
                border: "1px solid #ccc",
              }}
            >
              <option value="">Select user</option>
              {users.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </>
        )}
      </div>

      {/* Chat Window */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <div
          style={{
            flex: 1,
            padding: "20px",
            overflowY: "auto",
            backgroundColor: "#eaeaea",
          }}
        >
          {messages.map((msg, idx) => (
            <div
              key={idx}
              style={{
                display: "flex",
                justifyContent: msg.self ? "flex-end" : "flex-start",
                marginBottom: "10px",
              }}
            >
              <div
                style={{
                  maxWidth: "60%",
                  padding: "10px 15px",
                  borderRadius: "20px",
                  backgroundColor: msg.self ? "#4CAF50" : "#fff",
                  color: msg.self ? "#fff" : "#000",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                }}
              >
                {!msg.self && <b>{msg.from}: </b>}
                {msg.message}
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        {nameSet && targetUser && (
          <div
            style={{
              display: "flex",
              padding: "10px 20px",
              borderTop: "1px solid #ccc",
              backgroundColor: "#fff",
            }}
          >
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Type a message..."
              style={{
                flex: 1,
                padding: "10px",
                borderRadius: "20px",
                border: "1px solid #ccc",
              }}
            />
            <button
              onClick={sendMessage}
              style={{
                marginLeft: "10px",
                padding: "10px 20px",
                borderRadius: "20px",
                backgroundColor: "#4CAF50",
                color: "#fff",
                border: "none",
                cursor: "pointer",
              }}
            >
              Send
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
