'use client';

import { useState, useEffect, useRef } from 'react';
import { useClient, useConversations, useStreamMessages } from '@xmtp/react-sdk';
import { useWeb3 } from '../context/Web3Context';
import './ChatBox.css';

export default function ChatBox({ peerAddress }) {
  const { signer, account } = useWeb3();
  const { client, initialize, isLoading: isInitializing } = useClient();
  const { conversations, getCachedByPeerAddress } = useConversations();
  
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

  // Load conversation and messages once client is ready
  useEffect(() => {
    const loadConversation = async () => {
      if (!client || !peerAddress) return;
      try {
        let conv = await getCachedByPeerAddress(peerAddress);
        if (!conv) {
          // Check network
          const networkConvs = await client.conversations.list();
          conv = networkConvs.find(c => c.peerAddress.toLowerCase() === peerAddress.toLowerCase());
        }
        if (!conv) {
          // We don't create it here to save gas/requests until user sends a message
          // But XMTP allows creating new conversations anytime
        } else {
          setConversation(conv);
          const msgs = await conv.messages();
          setMessages(msgs);
        }
      } catch (err) {
        console.error("Error loading conversation:", err);
      }
    };
    loadConversation();
  }, [client, peerAddress, getCachedByPeerAddress]);

  // Stream new messages
  useStreamMessages(conversation, {
    onMessage: (msg) => {
      setMessages((prev) => {
        // Prevent duplicates
        if (prev.find((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    },
  });

  const handleInitialize = async () => {
    if (!signer) {
      setError("Connect your wallet first");
      return;
    }
    setError(null);
    try {
      await initialize({ keys: null, options: { env: 'production' }, signer });
    } catch (err) {
      console.error("Failed to initialize XMTP:", err);
      setError("Signature rejected or failed. You must sign to use chat.");
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim() || !client) return;

    setIsSending(true);
    try {
      let currentConv = conversation;
      if (!currentConv) {
        currentConv = await client.conversations.newConversation(peerAddress);
        setConversation(currentConv);
      }
      await currentConv.send(text.trim());
      setText('');
      // Optimistically reload messages to show it quickly
      const msgs = await currentConv.messages();
      setMessages(msgs);
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
          <p>Sign a message with your wallet to activate end-to-end encrypted chat via XMTP.</p>
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
