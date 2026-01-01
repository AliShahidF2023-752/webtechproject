'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import styles from './Chat.module.css'

interface Message {
    id: string
    user_id: string
    message: string
    created_at: string
    is_read: boolean
    sender?: {
        name: string
    }
}

interface ChatBoxProps {
    roomId: string
    currentUserId: string
}

export default function ChatBox({ roomId, currentUserId }: ChatBoxProps) {
    const [messages, setMessages] = useState<Message[]>([])
    const [newMessage, setNewMessage] = useState('')
    const [loading, setLoading] = useState(true)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const supabase = createClient()

    useEffect(() => {
        loadMessages()
        subscribeToMessages()

        return () => {
            supabase.removeChannel(supabase.channel(`chat:${roomId}`))
        }
    }, [roomId])

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    const loadMessages = async () => {
        const { data } = await supabase
            .from('chat_messages')
            .select(`
        *,
        sender:users!user_id(
          player_profiles(name)
        )
      `)
            .eq('room_id', roomId)
            .order('created_at', { ascending: true })

        if (data) {
            setMessages(data.map(m => ({
                ...m,
                sender: { name: m.sender?.player_profiles?.[0]?.name || 'Unknown' }
            })))
        }
        setLoading(false)
    }

    const subscribeToMessages = () => {
        supabase
            .channel(`chat:${roomId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'chat_messages',
                    filter: `room_id=eq.${roomId}`
                },
                async (payload) => {
                    const newMsg = payload.new as Message
                    // Fetch sender info
                    const { data: senderData } = await supabase
                        .from('player_profiles')
                        .select('name')
                        .eq('user_id', newMsg.user_id)
                        .single()

                    setMessages(prev => [...prev, {
                        ...newMsg,
                        sender: { name: senderData?.name || 'Unknown' }
                    }])
                }
            )
            .subscribe()
    }

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    const sendMessage = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newMessage.trim()) return

        const { error } = await supabase
            .from('chat_messages')
            .insert({
                room_id: roomId,
                user_id: currentUserId,
                message: newMessage.trim()
            })

        if (!error) {
            setNewMessage('')
        }
    }

    const formatTime = (dateString: string) => {
        const date = new Date(dateString)
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    if (loading) {
        return <div className={styles.loading}>Loading messages...</div>
    }

    return (
        <div className={styles.chatBox}>
            <div className={styles.messages}>
                {messages.length === 0 && (
                    <div className={styles.emptyChat}>
                        <span>💬</span>
                        <p>No messages yet. Start the conversation!</p>
                    </div>
                )}
                {messages.map(msg => (
                    <div
                        key={msg.id}
                        className={`${styles.message} ${msg.user_id === currentUserId ? styles.own : ''}`}
                    >
                        {msg.user_id !== currentUserId && (
                            <span className={styles.sender}>{msg.sender?.name}</span>
                        )}
                        <div className={styles.bubble}>
                            <p>{msg.message}</p>
                            <span className={styles.time}>{formatTime(msg.created_at)}</span>
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            <form onSubmit={sendMessage} className={styles.inputArea}>
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className={styles.input}
                />
                <button type="submit" className={styles.sendBtn} disabled={!newMessage.trim()}>
                    Send
                </button>
            </form>
        </div>
    )
}
