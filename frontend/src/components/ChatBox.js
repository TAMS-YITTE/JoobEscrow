'use client';

import { useState, useEffect, useRef } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { useXMTP } from '../context/XMTPContext';
import './ChatBox.css';

export default function ChatBox({ peerAddress }) {
  const { signer, account } = useWeb3();
  const { client, initialize, isInitializing } = useXMTP();
  
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState(null);

  const messagesEndRef = useRef(null);

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load conversation and stream messages natively
  useEffect(() => {
    if (!client || !peerAddress) return;
    
    let isMounted = true;
    let stream = null;

    const loadData = async () => {
      try {
        const convs = await client.conversations.list();
        let conv = convs.find(c => c.peerAddress.toLowerCase() === peerAddress.toLowerCase());
        
        if (!conv) {
          conv = await client.conversations.newConversation(peerAddress);
        }
        
        if (isMounted) setConversation(conv);
        
        const msgs = await conv.messages();
        if (isMounted) setMessages(msgs);

        stream = await conv.streamMessages();
        for await (const msg of stream) {
          if (isMounted) {
            setMessages(prev => {
              if (prev.find(m => m.id === msg.id)) return prev;
              return [...prev, msg];
            });
          }
        }
      } catch (err) {
        console.error("Error loading chat:", err);
      }
    };
    
    loadData();

    return () => {
      isMounted = false;
      if (stream) {
        // stream might not have a close method depending on exact SDK version, try/catch to be safe
        try { stream.return(); } catch (e) {}
      }
    };
  }, [client, peerAddress]);

  const handleInitialize = async () => {
    if (!signer) {
      setError("Connect your wallet first");
      return;
    }
    setError(null);
    try {
      await initialize(signer);
    } catch (err) {
      console.error("Failed to initialize XMTP:", err);
      setError("Signature rejected or failed. You must sign to use chat.");
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim() || !client || !conversation) return;

    setIsSending(true);
    try {
      await conversation.send(text.trim());
      setText('');
      // Message will appear via the stream loop above
    } catch (err) {
      console.error("Failed to send message:", err);
      setError("Failed to send message.");
    }
    setIsSending(false);
  };

  if (!client) {
    return (
      <div className="chatbox-container">
        <div className="chatbox-uninitialized">
          <h4>Secure Messaging</h4>
          <p>Sign a message with your wallet to activate end-to-end encrypted chat via XMTP V3.</p>
          <button className="btn btn-primary" onClick={handleInitialize} disabled={isInitializing}>
            {isInitializing ? 'Connecting...' : 'Activate Chat'}
          </button>
          {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="chatbox-container">
      <div className="chatbox-header">
        <h4>Encrypted Chat</h4>
        <span className="text-xs text-gray-400">XMTP Network</span>
      </div>
      
      <div className="chatbox-messages">
        {messages.length === 0 ? (
          <p className="chat-empty">No messages yet. Send a message to start!</p>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderAddress.toLowerCase() === account?.toLowerCase();
            return (
              <div key={msg.id} className={`chat-bubble-wrapper ${isMe ? 'is-me' : 'is-peer'}`}>
                <div className="chat-bubble">
                  {msg.content}
                </div>
                <div className="chat-time">
                  {new Date(msg.sent).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <form className="chatbox-input-area" onSubmit={handleSend}>
        <input 
          type="text" 
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message or paste a link..." 
          disabled={isSending}
        />
        <button type="submit" disabled={isSending || !text.trim()}>
          {isSending ? '...' : 'Send'}
        </button>
      </form>
    </div>
  );
}
