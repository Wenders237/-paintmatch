/**
 * MessagingPage — Messagerie directe client ↔ peintre.
 * Affiche la liste des conversations à gauche et le chat à droite.
 */

import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/store/authStore'
import messagingService from '@/services/messagingService'
import { Send, MessageSquare, ArrowLeft } from 'lucide-react'
import clsx from 'clsx'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

// ---------------------------------------------------------------------------
// Liste des conversations
// ---------------------------------------------------------------------------
function ConversationList({ conversations, selectedId, onSelect }) {
  return (
    <div className="flex-1 overflow-y-auto">
      {conversations.length === 0 ? (
        <div className="text-center py-12 px-4">
          <MessageSquare size={32} className="mx-auto text-secondary-200 mb-3" />
          <p className="text-sm text-secondary-400">Aucune conversation</p>
        </div>
      ) : (
        conversations.map(conv => (
          <button
            key={conv.id}
            onClick={() => onSelect(conv.id)}
            className={clsx(
              'w-full flex gap-3 items-start p-4 border-b border-secondary-100 hover:bg-secondary-50 transition-colors text-left',
              selectedId === conv.id && 'bg-primary-50 border-primary-100'
            )}
          >
            {/* Avatar */}
            <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-sm flex-shrink-0">
              {conv.other_user_name?.[0]?.toUpperCase() || '?'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold text-secondary-900 text-sm truncate">
                  {conv.other_user_name}
                </p>
                {conv.unread_count > 0 && (
                  <span className="w-5 h-5 bg-primary-500 text-white text-xs rounded-full flex items-center justify-center flex-shrink-0 font-bold">
                    {conv.unread_count}
                  </span>
                )}
              </div>
              {conv.last_message && (
                <p className="text-xs text-secondary-400 truncate mt-0.5">
                  {conv.last_message.is_mine ? 'Vous : ' : ''}{conv.last_message.content}
                </p>
              )}
            </div>
          </button>
        ))
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Fenêtre de chat
// ---------------------------------------------------------------------------
function ChatWindow({ conversationId, currentUserId }) {
  const qc         = useQueryClient()
  const bottomRef  = useRef(null)
  const [text, setText] = useState('')

  const { data: conv, isLoading } = useQuery({
    queryKey: ['conversation', conversationId],
    queryFn:  () => messagingService.getConversation(conversationId).then(r => r.data),
    refetchInterval: 5000, // Polling toutes les 5 secondes
  })

  // Scroll automatique vers le bas
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [conv?.messages])

  const sendMutation = useMutation({
    mutationFn: (content) => messagingService.sendMessage(conversationId, content),
    onSuccess: () => {
      setText('')
      qc.invalidateQueries(['conversation', conversationId])
      qc.invalidateQueries(['conversations'])
    },
  })

  const handleSend = (e) => {
    e.preventDefault()
    if (!text.trim()) return
    sendMutation.mutate(text.trim())
  }

  if (isLoading) {
    return <div className="flex-1 flex items-center justify-center"><span className="spinner w-8 h-8" /></div>
  }

  const messages = conv?.messages || []

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Header chat */}
      <div className="px-4 py-3 border-b border-secondary-100 bg-white">
        <p className="font-semibold text-secondary-900">{conv?.other_user_name}</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <p className="text-center text-secondary-400 text-sm py-8">
            Démarrez la conversation en envoyant un message.
          </p>
        )}
        {messages.map(msg => {
          const isMine = String(msg.sender_id) === String(currentUserId)
          return (
            <div key={msg.id} className={clsx('flex', isMine ? 'justify-end' : 'justify-start')}>
              <div className={clsx(
                'max-w-xs sm:max-w-md px-4 py-2.5 rounded-2xl text-sm',
                isMine
                  ? 'bg-primary-500 text-white rounded-br-sm'
                  : 'bg-white border border-secondary-200 text-secondary-900 rounded-bl-sm'
              )}>
                <p className="leading-relaxed">{msg.content}</p>
                <p className={clsx(
                  'text-xs mt-1',
                  isMine ? 'text-primary-200' : 'text-secondary-400'
                )}>
                  {format(new Date(msg.created_at), 'HH:mm', { locale: fr })}
                  {isMine && msg.is_read && ' ✓'}
                </p>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Saisie */}
      <form onSubmit={handleSend} className="p-3 border-t border-secondary-100 bg-white flex gap-2">
        <input
          type="text"
          className="input flex-1"
          placeholder="Écrivez un message..."
          value={text}
          onChange={e => setText(e.target.value)}
          disabled={sendMutation.isPending}
        />
        <button
          type="submit"
          disabled={!text.trim() || sendMutation.isPending}
          className="btn btn-primary btn-sm aspect-square flex-shrink-0"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Page principale
// ---------------------------------------------------------------------------
export default function MessagingPage() {
  const { user }            = useAuthStore()
  const [searchParams]      = useSearchParams()
  const qc                  = useQueryClient()
  const [selectedId, setSelectedId] = useState(null)
  const [showList, setShowList]     = useState(true)

  const { data: conversations = [], isLoading } = useQuery({
    queryKey: ['conversations'],
    queryFn:  () => messagingService.getConversations().then(r => r.data.results ?? r.data),
    refetchInterval: 15000,
  })

  // Démarrer une conversation si painter_id est dans l'URL
  const painterId  = searchParams.get('painter')
  const convParam  = searchParams.get('conv')

  const startMutation = useMutation({
    mutationFn: (id) => messagingService.startConversation(id),
    onSuccess: (res) => {
      qc.invalidateQueries(['conversations'])
      const convId = res.data.conversation.id
      setSelectedId(convId)
      setShowList(false)
    },
  })

  useEffect(() => {
    if (painterId && user?.role === 'CLIENT') {
      startMutation.mutate(painterId)
    }
  }, [painterId])

  // Sélectionner directement une conversation via URL ?conv=<id>
  useEffect(() => {
    if (convParam) {
      setSelectedId(convParam)
      setShowList(false)
    }
  }, [convParam])

  const handleSelect = (id) => {
    setSelectedId(id)
    setShowList(false)
  }

  return (
    <div className="h-[calc(100vh-130px)] flex bg-white rounded-2xl shadow-card overflow-hidden border border-secondary-100">

      {/* Colonne gauche — liste */}
      <div className={clsx(
        'flex flex-col border-r border-secondary-100 bg-white',
        'w-full lg:w-80 lg:flex',
        showList ? 'flex' : 'hidden'
      )}>
        <div className="px-4 py-3 border-b border-secondary-100">
          <h1 className="font-heading font-bold text-secondary-900">Messages</h1>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8"><span className="spinner w-6 h-6" /></div>
        ) : (
          <ConversationList
            conversations={conversations}
            selectedId={selectedId}
            onSelect={handleSelect}
          />
        )}
      </div>

      {/* Colonne droite — chat */}
      <div className={clsx(
        'flex-1 flex flex-col',
        !showList ? 'flex' : 'hidden lg:flex'
      )}>
        {selectedId ? (
          <>
            {/* Bouton retour mobile */}
            <button
              onClick={() => setShowList(true)}
              className="lg:hidden flex items-center gap-2 p-3 text-sm text-secondary-600 border-b border-secondary-100"
            >
              <ArrowLeft size={16} /> Retour
            </button>
            <ChatWindow
              conversationId={selectedId}
              currentUserId={user?.id}
            />
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <MessageSquare size={40} className="text-secondary-200 mb-4" />
            <p className="font-semibold text-secondary-700 mb-1">
              Sélectionnez une conversation
            </p>
            <p className="text-sm text-secondary-400">
              Ou contactez un peintre depuis son profil.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
