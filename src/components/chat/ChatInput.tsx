'use client';

import { useState, useTransition, useRef, KeyboardEvent } from 'react';
import { sendMessageAction } from '@/lib/server/chat-actions';

interface ChatInputProps {
  conversationId: string;
}

/**
 * Client Component: Input de Chat
 * Permite enviar mensajes con optimistic updates
 */
export function ChatInput({ conversationId }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [isPending, startTransition] = useTransition();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Handler: Enviar mensaje
  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();

    // Validar conversationId
    if (!conversationId) {
      console.error('[ChatInput] Missing conversationId');
      alert('Error: No se pudo identificar la conversación');
      return;
    }

    const content = message.trim();

    if (!content || isPending) {
      return;
    }

    // Limpiar input inmediatamente (optimistic update)
    setMessage('');

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    startTransition(async () => {
      const result = await sendMessageAction(conversationId, content);

      if (!result.success) {
        console.error('[ChatInput] Error sending message:', result.error);
        // Restaurar mensaje en caso de error
        setMessage(content);
        alert(result.error || 'Error al enviar mensaje');
      }
    });
  };

  // Handler: Enter para enviar (Shift+Enter para nueva línea)
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Auto-resize textarea
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);

    // Auto-resize
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-3">
      {/* Textarea */}
      <div className="flex-1 relative">
        <textarea
          ref={textareaRef}
          value={message}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Escribe un mensaje..."
          disabled={isPending}
          rows={1}
          className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          style={{ maxHeight: '120px' }}
        />

        {/* Character counter (optional) */}
        {message.length > 400 && (
          <div className="absolute bottom-2 right-12 text-xs text-gray-500">
            {message.length}/500
          </div>
        )}
      </div>

      {/* Send button */}
      <button
        type="submit"
        disabled={!message.trim() || isPending}
        className="flex-shrink-0 w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        aria-label="Enviar mensaje"
      >
        {isPending ? (
          <svg
            className="animate-spin h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        ) : (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
            />
          </svg>
        )}
      </button>
    </form>
  );
}
