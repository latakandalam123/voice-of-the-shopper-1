import { useEffect, useRef, useState } from "react";
import style from "./FeedbackChat.module.scss";
import ChatMessage from "../ChatMessage/ChatMessage";

const categories = [
  "Taste", "Packaging", "Price", "Availability",
  "Store Experience", "Promotions", "Sustainability", "Family-Friendliness"
];

function FeedbackChat({ toggleAdmin, userName, resetUserName }) {
  const [messages, setMessages] = useState([
    { sender: "assistant", text: "👋 Hi there! Please select a category and tell me about your experience." }
  ]);
  const [input, setInput] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);
  const [wantsContact, setWantsContact] = useState(false);

  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const sendMessage = async (text) => {
    const newMessages = [...messages, { sender: "user", text }];
    setMessages(newMessages);
    setInput("");
    setIsTyping(true);

    const body = {
      message: text,
      user_name: userName,
      session_id: sessionId,
      category: selectedCategory
    };

    try {
      const response = await fetch("http://localhost:8000/submit-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      const data = await response.json();
      setSessionId(data.session_id);
      setMessages((prev) => [...prev, { sender: "assistant", text: data.bot_reply }]);
    } catch (error) {
      console.error("Failed to send feedback:", error);
    } finally {
      setIsTyping(false);
    }
  };

  const handleCategorySelect = (cat) => {
    setSelectedCategory(cat);
    sendMessage(`I'd like to give feedback about ${cat.toLowerCase()}.`);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim()) sendMessage(input);
  };

  const finalizeFeedback = async () => {
    try {
        await fetch(`http://localhost:8000/finalize-summary/${sessionId}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              user_name: userName,
              category: selectedCategory  // ✅ send this!
            })
          });          
      setShowThankYou(true);
    } catch (error) {
      console.error("Finalization error:", error);
      alert("❌ Failed to finalize feedback.");
    }
  };

  const resetToStart = () => {
    setMessages([
      { sender: "assistant", text: "👋 Hi there! Please select a category and tell me about your experience." }
    ]);
    setInput("");
    setSelectedCategory(null);
    setSessionId(null);
    setIsTyping(false);
    setShowThankYou(false);
    setWantsContact(false);
  };

  if (showThankYou) {
    return (
      <div className={style.container}>
        <div className={style.thankYouCard}>
          <h2>🎉 Thank you for your input!</h2>
          <p>We truly appreciate your feedback.</p>
          <label className={style.checkboxLabel}>
            <input
              type="checkbox"
              checked={wantsContact}
              onChange={() => setWantsContact(!wantsContact)}
            />
            Would you like to be contacted?
          </label>
          <button
            className={style.finishButton}
            onClick={resetToStart}
          >
            Leave More Feedback
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={style.container}>
      <h2>Feedback Assistant</h2>

      {!selectedCategory && (
        <div className={style.categoryButtons}>
          {categories.map((cat) => (
            <button key={cat} onClick={() => handleCategorySelect(cat)} className={style.categoryButton}>
              {cat}
            </button>
          ))}
        </div>
      )}

      <div className={style.chatBox}>
        {messages.map((msg, idx) => (
          <ChatMessage key={idx} sender={msg.sender} text={msg.text} />
        ))}
        {isTyping && <ChatMessage sender="assistant" text={<TypingDots />} />}
        <div ref={chatEndRef} />
      </div>

      <form onSubmit={handleSubmit} className={style.inputForm}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          disabled={!selectedCategory}
        />
        <button type="submit" className={style.sendButton} disabled={!selectedCategory || !input.trim()}>
          Send
        </button>
      </form>

      <button onClick={finalizeFeedback} className={style.finishButton}>
        Finish Feedback
      </button>
    </div>
  );
}

function TypingDots() {
  return (
    <span className={style.typingDots}>
      <span>.</span>
      <span>.</span>
      <span>.</span>
    </span>
  );
}

export default FeedbackChat;
