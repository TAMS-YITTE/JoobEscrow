'use client';

import { useState, useEffect, useRef } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { useXMTP } from '../context/XMTPContext';
import { Client, IdentifierKind } from '@xmtp/browser-sdk';
import './ChatBox.css';

export default function ChatBox({ peerAddress }) {
  const { signer } = useWeb3();
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

  // Load conversation and stream messages natively V3
  useEffect(() => {
    if (!client || !peerAddress) return;
    
    let isMounted = true;
    let stream = null;

    const loadData = async () => {
      try {
        const peerIdentifier = { 
          identifier: peerAddress.toLowerCase(), 
          identifierKind: IdentifierKind.Ethereum 
        };

        // 1. Check reachability
        console.log("[XMTP] Checking reachability for:", peerIdentifier.identifier);
        const canMsgMap = await client.canMessage([peerIdentifier]);
        const isReachable = canMsgMap.get(peerIdentifier.identifier);
        console.log("[XMTP] Reachability result:", isReachable);

        if (!isReachable) {
          if (isMounted) setError("This wallet hasn't activated XMTP yet. Ask them to open the chat once to enable messaging.");
          return;
        }

        // 2. Get inboxId
        console.log("[XMTP] Fetching inbox ID...");
        const peerInboxId = await client.fetchInboxIdByIdentifier(peerIdentifier);
        console.log("[XMTP] Found inbox ID:", peerInboxId);
        
        if (!peerInboxId) {
          if (isMounted) setError("This wallet hasn't activated XMTP yet. Ask them to open the chat once to enable messaging.");
          return;
        }

        // 3. Get or create DM
        let conv;
        try {
          console.log("[XMTP] Attempting to get DM by inbox ID...");
          conv = await client.conversations.getDmByInboxId(peerInboxId);
        } catch (e) {
          console.log("[XMTP] getDmByInboxId failed, searching list:", e);
          const convs = await client.conversations.list();
          conv = convs.find(c => c.peerInboxId === peerInboxId);
        }

        if (!conv) {
          console.log("[XMTP] Creating new DM with inbox:", peerInboxId);
          conv = await client.conversations.createDm(peerInboxId);
        }
        console.log("[XMTP] Conversation established:", conv.id);
        
        if (isMounted) setConversation(conv);
        
        // 4. Load history
        console.log("[XMTP] Loading history...");
        const msgs = await conv.messages();
        console.log("[XMTP] History loaded, count:", msgs.length);
        if (isMounted) setMessages(msgs.filter(m => typeof m.content === 'string'));

        // 5. Stream real-time
        if (conv.stream) {
          try {
            stream = await conv.stream();
            for await (const msg of stream) {
              if (isMounted && typeof msg.content === 'string') {
                setMessages(prev => {
                  if (prev.find(m => m.id === msg.id)) return prev;
                  return [...prev, msg];
                });
              }
            }
          } catch (streamErr) {
            console.error("Stream error:", streamErr);
          }
        }
      } catch (err) {
        console.error("Error loading V3 chat:", err);
        if (isMounted) setError("Error setting up conversation: " + err.message);
      }
    };
    
    loadData();

    return () => {
      isMounted = false;
      if (stream && typeof stream.return === 'function') {
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
      console.error("Failed to initialize XMTP V3:", err);
      setError("Signature rejected or failed. You must sign to use chat.");
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim() || !client) return;

    if (!conversation) {
      setError("Conversation is not fully loaded. Please wait or reload.");
      return;
    }

    setIsSending(true);
    console.log("[XMTP] Starting send process...");
    try {
      console.log("[XMTP] Syncing conversation before send...");
      await conversation.sync();
      console.log("[XMTP] Conversation synced.");

      console.log("[XMTP] Sending message with 15s timeout...");
      const sendPromise = conversation.send(text.trim());
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Send timed out after 15s (OPFS locked or network issue). Please use separate browser profiles.")), 15000)
      );
      
      await Promise.race([sendPromise, timeoutPromise]);
      console.log("[XMTP] Message sent successfully.");
      
      setText('');
      // Reload messages to ensure the sent message displays reliably
      const msgs = await conversation.messages();
      setMessages(msgs.filter(m => typeof m.content === 'string'));
    } catch (err) {
      console.error("[XMTP] Failed to send message:", err);
      setError("Failed to send message: " + err.message);
    } finally {
      setIsSending(false);
      console.log("[XMTP] Send process finished.");
    }
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
      <div className="chatbox-header" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
          <svg width="16" height="16" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
          Encrypted Chat
        </h4>
        <span className="text-xs text-green-400" style={{ fontSize: '0.75rem', opacity: 0.9 }}>
          End-to-End Encrypted (XMTP Network)
        </span>
      </div>
      
      {error && <div className="p-2 bg-red-900/50 text-red-200 text-sm border-b border-red-800">{error}</div>}

      <div className="chatbox-messages">
        {messages.length === 0 ? (
          <p className="chat-empty">No messages yet. Send a message to start!</p>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderInboxId === client.inboxId;
            const content = typeof msg.content === 'string' ? msg.content : (msg.fallback || "Unsupported message");
            const date = new Date(Number(msg.sentAtNs / 1000000n));

            return (
              <div key={msg.id} className={`chat-bubble-wrapper ${isMe ? 'is-me' : 'is-peer'}`}>
                <div className="chat-bubble">
                  {content}
                </div>
                <div className="chat-time">
                  {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
          disabled={isSending || error}
        />
        <button type="submit" disabled={isSending || !text.trim() || error}>
          {isSending ? '...' : 'Send'}
        </button>
      </form>
    </div>
  );
}
