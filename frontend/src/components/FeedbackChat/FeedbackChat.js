import { useEffect, useRef, useState } from "react";
import style from "./FeedbackChat.module.scss";
import ChatMessage from "../ChatMessage/ChatMessage";
import Confetti from "react-confetti";

const categories = [
  "Taste", "Packaging", "Price", "Availability",
  "Store Experience", "Promotions", "Sustainability", "Family-Friendliness"
];

const categoryPrompts = {
    Taste: ["The flavor was great!", "It was too salty.", "Loved the freshness.", "Could be more seasoned."],
    Packaging: ["The box was damaged.", "Loved the eco-friendly packaging.", "Too much plastic.", "Easy to open."],
    Price: ["Great value for money.", "Too expensive.", "Affordable and worth it.", "Could be cheaper."],
    Availability: ["Item was out of stock.", "Easy to find.", "Not available in my area.", "Restocked quickly."],
    "Store Experience": ["Helpful staff.", "Checkout took too long.", "Store was clean.", "Great atmosphere."],
    Promotions: ["Good deals available.", "Promo was unclear.", "Loved the discount.", "Offer expired too quickly."],
    Sustainability: ["Love the eco-focus.", "Could use less plastic.", "Sustainable options are great.", "More green products please."],
    "Family-Friendliness": ["Kids loved it!", "Great for families.", "Not suitable for children.", "Fun for all ages."]
  };  

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
  const [showConfetti, setShowConfetti] = useState(false);

  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handlePromptSelect = (prompt) => {
    sendMessage(prompt);
  };  

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
          setShowConfetti(true);
            setTimeout(() => setShowThankYou(true), 1500);      
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
        {showConfetti && <Confetti numberOfPieces={250} recycle={false} />}
        <div className={style.thankYouCard}>
          <h2>🎉 Thank you for your input!</h2>
          <p>We truly appreciate your feedback.</p>
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

      {selectedCategory && categoryPrompts[selectedCategory] && (
            <div className={style.prompts}>
                {categoryPrompts[selectedCategory].map((prompt, index) => (
                <button
                    key={index}
                    className={style.promptButton}
                    onClick={() => handlePromptSelect(prompt)}
                >
                    {prompt}
                </button>
                ))}
            </div>
            )}

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
