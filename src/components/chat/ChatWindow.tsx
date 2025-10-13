'use client';

import { useEffect, useRef } from 'react';
import { format, isToday, isYesterday } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Message } from '@/lib/graphql/types';

interface ChatWindowProps {
  conversationId: string;
  initialMessages: Message[];
  currentUserId: string;
}

/**
 * Client Component: Ventana de Chat
 * Muestra mensajes con auto-scroll y agrupación por fecha
 */
export function ChatWindow({
  conversationId,
  initialMessages,
  currentUserId
}: ChatWindowProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Validación de datos requeridos
  if (!conversationId || !currentUserId) {
    console.error('[ChatWindow] Missing required props:', { conversationId, currentUserId });
    return null;
  }

  // Auto-scroll al final cuando hay mensajes nuevos
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [initialMessages.length]);

  // Agrupar mensajes por fecha
  const messagesByDate = groupMessagesByDate(initialMessages || []);

  return (
    <div
      ref={containerRef}
      className="h-full overflow-y-auto p-4 space-y-4 bg-gray-50"
    >
      {Object.entries(messagesByDate).map(([date, messages]) => (
        <div key={date}>
          {/* Date divider */}
          <div className="flex items-center justify-center my-6">
            <div className="bg-gray-200 rounded-full px-3 py-1 text-xs font-medium text-gray-600">
              {formatDateLabel(date)}
            </div>
          </div>

          {/* Messages for this date */}
          <div className="space-y-3">
            {messages.map((message) => {
              // Validar mensaje
              if (!message || !message.id || !message.content) {
                console.warn('[ChatWindow] Invalid message:', message);
                return null;
              }

              const isCurrentUser = message.sender_id === currentUserId;

              return (
                <div
                  key={message.id}
                  className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                      isCurrentUser
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-900 border border-gray-200'
                    }`}
                  >
                    {/* Message content */}
                    <p className="text-sm whitespace-pre-wrap break-words">
                      {message.content}
                    </p>

                    {/* Timestamp and status */}
                    <div
                      className={`flex items-center gap-1 mt-1 text-xs ${
                        isCurrentUser ? 'text-blue-100' : 'text-gray-500'
                      }`}
                    >
                      <span>
                        {message.created_at && format(new Date(message.created_at), 'HH:mm', { locale: es })}
                      </span>

                      {/* Status indicator (only for current user messages) */}
                      {isCurrentUser && (
                        <span className="ml-1">
                          {message.status === 'read' && (
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                              <path
                                fillRule="evenodd"
                                d="M12.707 5.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          )}
                          {message.status === 'delivered' && (
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          )}
                          {message.status === 'sent' && (
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z"
                                clipRule="evenodd"
                              />
                            </svg>
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Scroll anchor */}
      <div ref={messagesEndRef} />
    </div>
  );
}

/**
 * Agrupar mensajes por fecha
 */
function groupMessagesByDate(messages: Message[]): Record<string, Message[]> {
  const grouped: Record<string, Message[]> = {};

  messages.forEach((message) => {
    const date = format(new Date(message.created_at), 'yyyy-MM-dd');
    if (!grouped[date]) {
      grouped[date] = [];
    }
    grouped[date].push(message);
  });

  return grouped;
}

/**
 * Formatear etiqueta de fecha
 */
function formatDateLabel(dateString: string): string {
  const date = new Date(dateString);

  if (isToday(date)) {
    return 'Hoy';
  }

  if (isYesterday(date)) {
    return 'Ayer';
  }

  return format(date, "d 'de' MMMM", { locale: es });
}
