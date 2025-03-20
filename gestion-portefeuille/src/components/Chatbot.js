import React, { useState } from "react";
import axios from "axios";
import './chatbot.css';

const Chatbot = () => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);

    // Fonction pour envoyer un message et recevoir une réponse
    const sendMessage = async () => {
        if (!input.trim()) return;  // Eviter l'envoi de message vide

        const userMessage = { text: input, sender: "user" };
        setMessages((prevMessages) => [...prevMessages, userMessage]);

        setLoading(true);

        try {
            const response = await axios.post(
                "https://api-inference.huggingface.co/models/gpt2", // Modèle GPT-2 Hugging Face, pas de clé nécessaire
                { inputs: input },
                { headers: { "Content-Type": "application/json" } }
            );

            const botMessage = {
                text: response.data[0]?.generated_text || "Désolé, je n'ai pas compris.",
                sender: "bot"
            };
            setMessages((prevMessages) => [...prevMessages, botMessage]);
        } catch (error) {
            setMessages((prevMessages) => [
                ...prevMessages,
                { text: "Erreur de connexion avec l'IA.", sender: "bot" }
            ]);
        }

        setLoading(false);
        setInput("");
    };

    return (
        <div className="chatbot-container">
            <div className="chatbox">
                {messages.map((msg, index) => (
                    <div key={index} className={`message ${msg.sender}`}>
                        {msg.text}
                    </div>
                ))}
                {loading && <div className="message bot">L'IA est en train de réfléchir...</div>}
            </div>
            <div className="input-area">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Posez une question à l'IA"
                />
                <button onClick={sendMessage} disabled={loading}>
                    Envoyer
                </button>
            </div>
        </div>
    );
};

export default Chatbot;
